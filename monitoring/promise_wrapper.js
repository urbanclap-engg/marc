const RPC_Constants = require('../constants');
const PrometheusExporter = require('./prometheus_exporter');
const _ = require('lodash');
const ErrorTypes = require('../error');
const ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
const MycroftCapture = require('./mycroft_capture');
const util = require('./monitoring_util');
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const Singleton = require('../singleton').getSingleton();

function getInfoLogObject(client_id, method_name, start_time_ms) {
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_CLIENT;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = client_id;
  logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = method_name;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - start_time_ms;
  return logData;
}

function logInDebugMode(clientId, methodName, startTimeMs, timingPhases) {
  const debugMode = _.get(Singleton, 'Config.CUSTOM.logging_options.debug_mode');

  if (debugMode && timingPhases) {
    Singleton.Logger.debug({
      [LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]: LOG_TYPE.RPC_SYSTEM,
      [LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID]: clientId,
      [LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME]: methodName,
      [LOG_CONSTANTS.SYSTEM_LOGS.API_TIME]: Date.now() - startTimeMs,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1]: 'SocketInitTime',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1_VALUE]: timingPhases.wait,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_2]: 'DNSLookUpTime',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_2_VALUE]: timingPhases.dns,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_3]: 'TCPConnectTime',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_3_VALUE]: timingPhases.tcp,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_4]: 'FirstByteTime',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_4_VALUE]: timingPhases.firstByte,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_5]: 'DownloadTime',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_5_VALUE]: timingPhases.download,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_6]: 'TotalTime',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_6_VALUE]: timingPhases.total
    });
  }
}

function monitoredPromiseForFullResponse(retryableRequestPromise, ...args){

  let headers = [...args][0]['headers'];
  const methodName = [...args][0].uri;
  return retryableRequestPromise(...args)
    .then(function(resp) {
        const monitoringParams = util.getMonitoringParameters(headers,
        RPC_Constants.HTTP_RESPONSE_CODE_OK, RPC_Constants.EMPTY, ENV)
        PrometheusExporter.captureClientRequestDurationMetric(monitoringParams);     
        MycroftCapture.clientRequestMetric(monitoringParams);
        Singleton.Logger.info(getInfoLogObject(headers.client_id, methodName, headers.start_time_ms));
        logInDebugMode(headers.client_id, methodName, headers.start_time_ms, _.get(resp, RPC_Constants.CLIENT.TIMING_PHASES));
        return resp.body;
    })
    .catch(function(error) {
        const errorType = _.get(error, 'err_type') || _.get(error, 'error.err_type', ErrorTypes.RPC_EXTERNAL_SERVER_ERROR);
        const monitoringParams = util.getMonitoringParameters(headers, 
        RPC_Constants.HTTP_RESPONSE_CODE_ERROR, errorType, ENV)
        PrometheusExporter.captureClientRequestDurationMetric(monitoringParams);
        MycroftCapture.clientRequestMetric(monitoringParams);
        throw(error);
    });
}

function monitoredPromise(retryableRequestPromise, ...args){

  let headers = [...args][0]['headers'];
  const methodName = [...args][0].uri;
  return retryableRequestPromise(...args)
    .then(function(resp) {
        const monitoringParams = util.getMonitoringParameters(headers,
        RPC_Constants.HTTP_RESPONSE_CODE_OK, RPC_Constants.EMPTY, ENV)
        PrometheusExporter.captureClientRequestDurationMetric(monitoringParams);     
        MycroftCapture.clientRequestMetric(monitoringParams);
        Singleton.Logger.info(getInfoLogObject(headers.client_id, methodName, headers.start_time_ms));
        return resp;
    })
    .catch(function(error) {
        const errorType = _.get(error, 'err_type') || _.get(error, 'error.err_type', ErrorTypes.RPC_EXTERNAL_SERVER_ERROR);
        const monitoringParams = util.getMonitoringParameters(headers, 
        RPC_Constants.HTTP_RESPONSE_CODE_ERROR, errorType, ENV)
        PrometheusExporter.captureClientRequestDurationMetric(monitoringParams);
        MycroftCapture.clientRequestMetric(monitoringParams);
        throw(error);
    });
}

/**
 * This function wraps the promisified function into a monitored promise
 */
function promiseWrapper(retryableRequestPromise, resolvedWithFullResponse = false){

    function decoratedFunction(...args) {
        return resolvedWithFullResponse
            ? monitoredPromiseForFullResponse(retryableRequestPromise, ...args)
            : monitoredPromise(retryableRequestPromise, ...args);
    }
  
  return decoratedFunction;
}

module.exports = promiseWrapper;
