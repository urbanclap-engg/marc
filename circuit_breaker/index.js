const Armor = require('@uc-engg/armor');
const Singleton = require('../singleton').getSingleton();
const _ = require('lodash');
const RequestPromise = require('request-promise');
const CIRCUIT_BREAKER_CONSTANTS = require('./constants');
const PLATFORM_CONFIG_SERVICE_ID = 'platform-config-service';
const Command = Armor.initCircuitBreaker();

function decorateWithCircuitBreakerOptions(requestPromise) {
  return function decoratedFunction(options, circuitBreakerOptions, circuitBreakerFallback, onError) {
    if (!circuitBreakerOptions || !circuitBreakerOptions.ENABLE) {
      return requestPromise(options)
        .catch(err => {
          onError(options, err)
        });
    }
    return Command.execute(
      circuitBreakerOptions.key, // Circuit breaker key.
      options, // run method param
      requestPromise, // run method which circuit breaker will monitor
      null, // fallback method param
      circuitBreakerFallback,
      circuitBreakerOptions
    )
  };
}

function persistCircuitBreakerConfig(serviceName, externalServiceName, apiConfig) {
  if (_.isEmpty(apiConfig)) return;

  const hostname = _.get(Singleton, `Config.GLOBAL_CONF.${PLATFORM_CONFIG_SERVICE_ID}.discovery.uri`);
  const port = _.get(Singleton, `Config.GLOBAL_CONF.${PLATFORM_CONFIG_SERVICE_ID}.discovery.port`);
  const clientId = serviceName;
  const methodName = 'setConfig';

  const options = {
    method: 'POST',
    uri: `http://${hostname}:${port}/${PLATFORM_CONFIG_SERVICE_ID}/${methodName}?client_id=${clientId}`,
    json: true,
    headers: { 'Content-Type': 'application/json' }
  };

  for (const [route, config] of Object.entries(apiConfig)) {
    const isEnabled = _.get(config, 'CIRCUIT_BREAKER_OPTIONS.ENABLE');
    const timeout = _.get(config, 'CIRCUIT_BREAKER_OPTIONS.TIMEOUT');
    const isForceClosed = _.get(config, 'CIRCUIT_BREAKER_OPTIONS.CIRCUIT_BREAKER_FORCE_CLOSED');

    options.body = {
      configName: 'circuitBreaker',
      configProperties: {
        service: serviceName,
        externalService: externalServiceName,
        route,
        isEnabled,
        timeout,
        isForceClosed
      }
    }

    RequestPromise(options);
  }
}

/**
  * Function to capitalize circuite breaker options
  * TODO move this to armor
  */
const transformCircuitBreakerOptions = (obj) => {
  if (!obj) {
    return;
  }

  const newObj = {};
  _.keys(obj).forEach(key => {
    newObj[key.toUpperCase()] = obj[key];
  });

  return newObj;
}

/**
  * fetches the circuitBreakerOptions from config/constants.
  */
const getCircuitBreakerOptions = (apiConfig, method_name, called_service_id) => {
  let circuitBreakerOptions = _.get(apiConfig, `${method_name}.CIRCUIT_BREAKER_OPTIONS`, null);

  if(!circuitBreakerOptions || !circuitBreakerOptions.ENABLE) {
    circuitBreakerOptions = CIRCUIT_BREAKER_CONSTANTS.DEFAULT_CIRCUIT_BREAKER_OPTIONS[called_service_id]; // to enforce circuit breaker options if the external service wants so.
  }
  return circuitBreakerOptions;
}

module.exports = { 
  decorateWithCircuitBreakerOptions,
  persistCircuitBreakerConfig,
  transformCircuitBreakerOptions,
  getCircuitBreakerOptions
};