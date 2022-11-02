import _ from 'lodash';
import ChangeCase from 'change-case';
import { Logger } from '../../logging/standard_logger';
import ErrorTypes from '../../error';
import RPC_Constants from '../../constants';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import Armor from '@uc-engg/armor';
import Ajv from "ajv";
import retryablePromiseWrapper from '../../retryable_promise';
import Monitoring from '../../monitoring';
import loadShed from '../../load_shed/index';
import { getSingleton } from '../../singleton';
import { decorateWithCircuitBreakerOptions, persistCircuitBreakerConfig } from '../../circuit_breaker';
import { ClientUtils } from './utils';
import { RpcClientInterface } from './interface';
import { getRequestSchema } from '../../schema/external_services';
import { Validator } from 'jsonschema';
import { expanded as expandSchemaRef } from 'expand-swagger-refs';
import * as CircuitBreaker from '../../circuit_breaker'

const externalServiceRequestSchema = getRequestSchema();
const jsonSchemaValidator = new Validator();
const Singleton = getSingleton();


export const RpcClient: RpcClientInterface = {
  /**
  * Create the rpc client.
  * Description in index.js file.
  */
  createClient: (serviceId, calledServiceId, schema, serverHost, serverPort, clientOptions) => {
    
    const retry_options = _.get(clientOptions,"retry", {});
    const apiConfig = ClientUtils.getApiConfig(clientOptions);
    const EventConf = _.get(Singleton, 'Config.EVENT_CONF.platform', {});
    const expandedSchema = expandSchemaRef(schema);
    const ajv = new Ajv({
      allErrors: true,
      unknownFormats: ['int32', 'int64']
    });
    let client = {};
    let apiSchemaValidatorMap = {};

    const onError = (options, err, extraLogs = {}) => {
      const potentialError = new Error();
      const errType = _.get(err, 'error.err_type') ||  _.get(err, 'body.err_type') || ErrorTypes.RPC_EXTERNAL_SERVER_ERROR;
      const errMessage = _.get(err, 'error.err_message', err.message || '');
      const logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_CLIENT;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = _.get(Singleton, 'Config.SUB_SERVICE_ID' , serviceId);;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = _.get(options, 'uri', '');
      logData[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = _.get(options, 'qs.trxn_id', '');
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errMessage;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = errType;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_PAYLOAD] = ClientUtils.getSanitizedPayloadForClient(err);
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = potentialError.stack;
    
      Logger.error({
        ...logData,
        ...extraLogs
      });

      let errObj = {
        err_type: errType,
        err_message: errMessage,
        err_stack: potentialError.stack,
        code: _.get(err, 'error.err_code', err.code || 500)
      };

      if(errType === ErrorTypes.REQUEST_LOAD_SHEDED) {
        if(!_.isEmpty(errMessage)) {
          const errMsg = JSON.parse(errMessage);
          loadShed.updateDownstreamServiceMap(errMsg.service, errMsg.api, errMsg.priority);
        }
        errObj.code = RPC_Constants.HTTP_RESPONSE_CODE_TOO_MANY_REQUESTS;
      }

      throw new ErrorTypes.RPCError(errObj);    
    }
    
    const circuitBreakerFallback = (err, fallbackParams) => {
      const options = fallbackParams[0];
      const logs = {
        [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_PAYLOAD]: err.message,
        [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1]: 'circuit_breaker',
        [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE]: 'true'
      };
      _.set(err, 'error.err_type', _.get(err, 'error.err_type', ErrorTypes.CIRCUIT_BREAKER_ERROR));
      onError(options, err, logs);
    }

    const callInAsync = (methodName, req) => {
      let eventName = ChangeCase.lowerCase(calledServiceId.split('-').join('') + '_' + methodName.split('/').join('_'));
      if (_.get(EventConf, `topicsToPublish.${serviceId}`, []).includes(eventName)) {
        /* Handling old async flow. */
        if (!_.isNil(req[RPC_Constants.EVENT_PRIORITY_KEY])) {
          if (!_.includes(RPC_Constants.EVENT_PRIORITY_LEVELS, req[RPC_Constants.EVENT_PRIORITY_KEY])) {
            onError({}, ClientUtils.getErrorObj(ErrorTypes.RPC_INTERNAL_SERVER_ERROR,
                `${req[RPC_Constants.EVENT_PRIORITY_KEY]} is not a valid ${RPC_Constants.EVENT_PRIORITY_KEY}`));
          }
          eventName = eventName + '_' + req[RPC_Constants.EVENT_PRIORITY_KEY];
        }    
      } else {
        eventName = ChangeCase.lowerCase(calledServiceId + '_' + methodName.split('/').join('_'));
        req.metadata = {
          methodName: methodName,
          isAsyncApi: true,
          schemaValidationDetails: ClientUtils.validateSchema(methodName, req, apiSchemaValidatorMap)
        }
      }
    
      if (!(RPC_Constants.DEPENDENCY.ID.event_producer in Singleton)) {
        onError({}, ClientUtils.getErrorObj(ErrorTypes.RPC_INTERNAL_SERVER_ERROR,
          `${RPC_Constants.DEPENDENCY.ID.event_producer} is not initialised.`));
      }
    
      return Singleton[RPC_Constants.DEPENDENCY.ID.event_producer].sendEvent(eventName, req, serviceId);
    }

    _.forEach(schema.paths, function(__, path) {
      const method_name = path.substring(1);
      const nestedPath = method_name.split('/').join('.');

      /* Compiling schema & storing schema validator for async api call.*/
      _.set(apiSchemaValidatorMap, method_name, ClientUtils.getSchemaValidator(method_name, expandedSchema, ajv));

      const methodImplementation = function (req, callingType = RPC_Constants.CALL_TYPE_SYNC) {

        if (callingType === RPC_Constants.CALL_TYPE_ASYNC) {
          return callInAsync(method_name, req);
        }

        const basicQuery = ClientUtils.getBasicQuery(serviceId);
        const options = ClientUtils.getRequestPromiseOptions(req, calledServiceId, method_name, serverHost, serverPort, basicQuery);
        
        let logData = {};
        logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_CLIENT;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = _.get(Singleton, 'Config.SUB_SERVICE_ID' , serviceId);
        logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = options.uri;
        Singleton.Logger.debug(logData);
    
        let circuitBreakerOptions = CircuitBreaker.getCircuitBreakerOptions(apiConfig, method_name, calledServiceId);
  
        if(circuitBreakerOptions) {
          _.set(circuitBreakerOptions, 'key', `${serviceId}#${nestedPath.split('.').join('#')}`);
        }
        const retryableRequestPromiseFn = retryablePromiseWrapper(ClientUtils.getRequestPromise, retry_options.retries, retry_options.retry_after_ms,
          retry_options.backoff_multiplier, ClientUtils.shouldRetryOnError);
        
        return Monitoring.promiseWrapper(decorateWithCircuitBreakerOptions(retryableRequestPromiseFn), true)(options, circuitBreakerOptions, circuitBreakerFallback, onError);
      };

      _.set(client, nestedPath, methodImplementation);
    });

    persistCircuitBreakerConfig(serviceId, calledServiceId, apiConfig);

    return client;
  },

  /**
  * Create external service client with circuit breaker options.
  * Circuit breaker config structure:
  * {CIRCUIT_BREAKER_OPTIONS: {ENABLE: true, TIMEOUT: 5000, CIRCUIT_BREAKER_FORCE_CLOSED: true}}
  * Other default values and field descriptions is present in armor repo at path /configs/circuit_breaker.js
  *
  * @param {string} service_id
  * @param {string} external_service_id
  * @param {json} config to contain CIRCUIT_BREAKER_OPTIONS
  * @returns {object} client object containing a function - requestPromise to make external call
  */
  createExternalClient: (serviceId, externalServiceId, config) => {

    const handleExternalError = (payload, err) => {
      const isCircuitBreakerEnabled = _.get(config, 'CIRCUIT_BREAKER_OPTIONS.ENABLE', false);
      const errType = isCircuitBreakerEnabled ? ErrorTypes.CIRCUIT_BREAKER_ERROR : ErrorTypes.RPC_EXTERNAL_SERVER_ERROR;
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_CLIENT;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = _.get(Singleton, 'Config.SUB_SERVICE_ID' , serviceId);;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = JSON.stringify(err.message);
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = errType;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_PAYLOAD] = JSON.stringify(payload);
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = JSON.stringify(err.stack);
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'circuit_breaker';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = isCircuitBreakerEnabled.toString();
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'external_service_id';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = externalServiceId;
      Logger.error(logData);
      throw new ErrorTypes.ExternalError(err);
    }

    const circuitBreakerFallback = (err, params) => {
      const Command = Armor.initCircuitBreaker();
      _.set(err, 'err_type', _.get(err, 'err_type', ErrorTypes.CIRCUIT_BREAKER_ERROR));
      handleExternalError(params[Command.constants.RUN_PARAMS_INDEX], err);
    }

    const client = {
      /**
      * RequestPromise call to external service
      * @param requestOptions {json} request promise options to match the schema present in /external-services/request_promise
      * @returns {promise} RequestPromise call response
      * @throws RPCError and ExternalError
      */
      requestPromise: (requestOptions) => {

        if(!_.has(requestOptions, 'headers')){
          requestOptions['headers'] = {};
        }

        const external_urls = _.split(_.replace(requestOptions.uri, /(https?:\/\/)?(www.)?/i, ''), '@');
        const external_url = _.split(external_urls[external_urls.length -1], '/')[0];

        requestOptions.headers['start_time_ms'] = Date.now();
        requestOptions.headers['client_id'] = _.get(Singleton, 'Config.SUB_SERVICE_ID' , serviceId);
        requestOptions.headers['external_service_id'] = externalServiceId;
        requestOptions.headers['method_name'] = requestOptions.uriPath || external_url;

        const circuitBreakerOptions = _.get(config, 'CIRCUIT_BREAKER_OPTIONS');
        if(circuitBreakerOptions) {
          _.set(circuitBreakerOptions, 'key', externalServiceId);
        }
        
        let schemaValidationResult = jsonSchemaValidator.validate(requestOptions, externalServiceRequestSchema);
        if(!schemaValidationResult.valid) {
          throw new ErrorTypes.RPCError({
            err_type: ErrorTypes.RPC_INTERNAL_SERVER_ERROR,
            err_message: "External service call request options schema validation failed. " + JSON.stringify(schemaValidationResult.errors)
          });
        }
        return Monitoring.promiseWrapper(decorateWithCircuitBreakerOptions(ClientUtils.requestPromiseCall))(requestOptions, circuitBreakerOptions, circuitBreakerFallback, handleExternalError);
      },

      /**
       * This function is used to make external calls. The external call should be a library or a non-request-promise call.
       * @param params parameters which will be passed to runFunction
       * @param runFunction A promisified function which will make the external call.
       * @returns {promise} Response from runFunction
       * @throws RPCError and ExternalError
       */
      execute: (params, runFunction) => {

        if(!_.has(params, 'headers')){
          params['headers'] = {};
        }
        params.headers['start_time_ms'] = Date.now();
        params.headers['client_id'] = _.get(Singleton, 'Config.SUB_SERVICE_ID' , serviceId);
        params.headers['external_service_id'] = externalServiceId;
        params.headers['method_name'] = runFunction.name || "unknown";

        const circuitBreakerOptions = _.get(config, 'CIRCUIT_BREAKER_OPTIONS');
        if(circuitBreakerOptions) {
          _.set(circuitBreakerOptions, 'key', externalServiceId);
        }

        return Monitoring.promiseWrapper(decorateWithCircuitBreakerOptions(runFunction))(params, circuitBreakerOptions, circuitBreakerFallback, handleExternalError);
      }
    }
    
    return client;
  }
}