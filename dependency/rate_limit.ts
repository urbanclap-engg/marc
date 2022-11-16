import * as _ from 'lodash';
import RequestPromise from 'request-promise';
import { Microservice } from './microservice';
import { ExternalService } from './external_service';
import ScriptConstants from '../scripts/common/constants';
import { LOG_TYPE } from '../logging/constants';
import Error from '../error';
import MonitoringConstants from '../monitoring/monitoring_constants';

const RATE_LIMIT_POLICY_SYNC_TIME_SECONDS = 60;

const createOptions = (endPoint) => {
  const { url, authToken, body } = endPoint;
  let header = {}
  if (authToken) {
    header =  {
      Authorization: `Bearer ${authToken}`
    }
  }
  return {
    method: 'POST',
    uri: url,
    headers: {...header},
    json: true,
    body
  };
}

const getRateLimitPolicy = async (RPCFramework, params = {useStaticConfig: false, useEndPoint: false, endPoint: '', rateLimitPolicy: {}}) => {
  const { useStaticConfig, useEndPoint} = params;
  if (useStaticConfig) {
    // Read from dependency config
    const { rateLimitPolicy } = params;
    return rateLimitPolicy;
  } else if (useEndPoint) {
    // Read from end point
    const { endPoint } = params;
    const options = createOptions(endPoint);
    return RequestPromise(options)
      .promise()
      .then(response => _.get(response, 'data'))
      .catch(err => new Error.RPCError({
        error: JSON.stringify(err),
        err_type: err.err_type || 'rate_limit_endpoint_error',
        err_message: err.err_message || 'RateLimitPolicy endpoint connection failed',
        log_type: LOG_TYPE.RPC_RATE_LIMIT
      }));
  } else { 
    //default
    const PlatformConfigServiceClient = RPCFramework.getSingleton()[ScriptConstants.PLATFORM_CONFIG_SERVICE];
    const RPC_CONFIG = RPCFramework.getSingleton().Config;
    const response = await PlatformConfigServiceClient.getRateLimit({"serviceType": "microservice", "serviceId": RPC_CONFIG.SERVICE_ID});
    return _.get(response, 'success.data');
  }
};

export const RateLimit: any = {
  initRateLimit: async (params = {options: {useStaticConfig: false, useEndPoint: false, endPoint: '', rateLimitPolicy: {}}}, RPCFramework) => {
    const rateLimitServiceParams = {
      "id": ScriptConstants.PLATFORM_CONFIG_SERVICE,
      "version": 0
    };
    const prometheusServiceParams = {
      "id": MonitoringConstants.PROMETHEUS_SERVICE_ID,
      "options": {
        "CIRCUIT_BREAKER_OPTIONS": {
          "ENABLE": true,
          "TIMEOUT": 10000,
          "CIRCUIT_BREAKER_FORCE_CLOSED": true
        }
      },
      "version": 0
    };
    if (!params.options.useStaticConfig && !RPCFramework.getSingleton()[ScriptConstants.PLATFORM_CONFIG_SERVICE]) {
      /*
       Initialize platform-config-service client if dependency is not
        already initialized via dependency.config.js
      */
      Microservice.initMicroserviceClient(rateLimitServiceParams, RPCFramework);
    }
    ExternalService.initExternalServiceClient(prometheusServiceParams, RPCFramework);
    const rateLimitPolicy = await getRateLimitPolicy(RPCFramework, params.options);
    if (!rateLimitPolicy) {
      throw new Error.RPCError({
        err_type: Error.DEPENDENCY_INITIALIZATION_ERROR,
        err_message: "RateLimitPolicy does not exist",
        log_type: LOG_TYPE.RPC_RATE_LIMIT
      });
    }
  
    if (_.get(rateLimitPolicy, 'isEnabled')) RPCFramework.addToSingleton('RateLimitPolicy', rateLimitPolicy);
    setInterval(async () => {
      const rateLimitPolicy = await getRateLimitPolicy(RPCFramework, params.options);
      if (_.get(rateLimitPolicy, 'isEnabled')) RPCFramework.addToSingleton('RateLimitPolicy', rateLimitPolicy);
      else RPCFramework.addToSingleton('RateLimitPolicy', undefined);
    }, RATE_LIMIT_POLICY_SYNC_TIME_SECONDS * 1000);
  }
}
