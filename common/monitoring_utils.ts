import _ from 'lodash';
import { LOG_CONSTANTS, LOG_TYPE } from '../logging/constants';
import { getSingleton } from '../singleton';

const Singleton = getSingleton();

export const MonitoringUtils = {
  getMonitoringParameters: (params) => {
    const monitoringParams = {
      headers: params.headers,
      service_id: _.get(Singleton, 'Config.SUB_SERVICE_ID', params.service_id),
      client_id: _.get(params.headers, 'client_id', params.client_id),
      route: params.method_url,
      http_code: params.http_code,
      error_type: params.error_type,
      env: params.env,
      start_time: params.start_time,
      path: params.path,
      body: params.body
    };
    return monitoringParams;
  },
  
  getEndpointResponseLog: (req) => {
    let logData = {};
    if(req.start_time_ms) {
      logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
    }
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVER_RESPONSE;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = req.headers.client_id || req.client_id || req.query.client_id;
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = req.method_name || req.originalUrl;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = req.trxn_id;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.user_agent;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_NAME] = _.get(req, 'headers.x-device-os')
    logData[LOG_CONSTANTS.SYSTEM_LOGS.VERSION_NAME] = _.get(req, 'headers.x-version-name')
    logData[LOG_CONSTANTS.SYSTEM_LOGS.VERSION_CODE] = _.get(req, 'headers.x-version-code')
    logData[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_ID] = _.get(req, 'headers.x-device-id')
    logApiRequestFields(req, logData)
    return logData
  },
  
  sendMonitoredMetricsPayload: async(req, res, exporter) => {
    const client = {
      "user-agent": req.headers['user-agent'],
    }
  
    const metricsData = await exporter(client, req.start_time_ms);
  
    res.set('Content-Type', metricsData.contentType);
    res.send(metricsData.metrics);
  }
};


//Logic for internal use

const addCommonRequestFieldsToLog = (key, value, logData) => {
  const logKey = key == 'request_id' ? LOG_CONSTANTS.COMMON_PARAMS.CUSTOMER_REQUEST_ID : key;
  if(_.includes(Object.values(LOG_CONSTANTS.COMMON_PARAMS), logKey)) {
    logData[logKey] = typeof value === "string" ? value : undefined
  }
}

const logApiRequestFields = (req, logData) => {
  Object.keys(req.body).forEach(function(key) { addCommonRequestFieldsToLog(_.snakeCase(key), req.body[key], logData) })
  if(_.has(req, 'headers.auth')) {
    addCommonRequestFieldsToLog(_.get(req, 'headers.auth.id_type'), _.get(req, 'headers.auth.id'), logData)
  }
}