'use strict';

const MONITORING_CONSTANTS = require('./monitoring_constants');
const Singleton = require('../singleton').getSingleton();
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const { Logger } = require('../logging/standard_logger');
const Error = require('../error');
const RPC_CONSTANTS =  require('../constants');
const IS_PROMETHEUS_MONITORING_ENABLED = process.env.PROMETHEUS_MONITORING_ENABLED == 'true' ? true : false;
const _ = require('lodash');

let PrometheusExporter = {};

PrometheusExporter.captureServerRequestDurationMetric = function(monitoringParams) {
  let httpServerRequestDurationMetric;
  let httpServerRequestErrorMetric;

  if (!String(monitoringParams.http_code).match(/2[0-9][0-9]/g)){
    httpServerRequestErrorMetric = Singleton[MONITORING_CONSTANTS.PROMETHEUS.HTTP_SERVER_REQUEST_ERROR_METRIC];
  }
  httpServerRequestDurationMetric = Singleton[MONITORING_CONSTANTS.PROMETHEUS.HTTP_SERVER_REQUEST_DURATION_METRIC];
  
  let deviceType = _.get(monitoringParams.headers, 'x-device-os');
  if (!monitoringParams.client_id && !deviceType) {
    if (_.includes(_.get(monitoringParams.headers, 'user-agent'), 'Android')) {
      deviceType = 'android';
    } else if(_.includes(_.get(monitoringParams.headers, 'user-agent'), 'iPhone')) {
      deviceType = 'ios';
    } else if (_.includes(_.get(monitoringParams.headers, 'user-agent'), 'Mozilla')) {
      deviceType = 'web';
    }
  }
  if(_.has(monitoringParams.headers, 'x-redirection-client-id')) {
    deviceType = _.get(monitoringParams.headers, 'x-redirection-client-id') + ':' + (deviceType || '');
  }

  try {
    if(httpServerRequestDurationMetric) {
      httpServerRequestDurationMetric.labels(monitoringParams.service_id, monitoringParams.client_id || deviceType || RPC_CONSTANTS.UNKNOWN,
        monitoringParams.route, monitoringParams.http_code, monitoringParams.env).observe(Date.now() - monitoringParams.start_time);  
    }
    if(httpServerRequestErrorMetric) {
      httpServerRequestErrorMetric.labels(monitoringParams.service_id, monitoringParams.client_id || deviceType || RPC_CONSTANTS.UNKNOWN,
        monitoringParams.route, monitoringParams.http_code, monitoringParams.error_type).inc();
    }
  } catch(err) {
    let logData = {};
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = monitoringParams.client_id;
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = monitoringParams.route;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.METRICS_CAPTURE_ERROR;
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.message || JSON.stringify(err);
    Logger.error(logData);
  }
};

//For capturing external calls metrics
PrometheusExporter.captureClientRequestDurationMetric = function(monitoringParams) {
  let httpClientRequestDurationMetric;
  let httpClientRequestErrorMetric;

  if (!String(monitoringParams.http_code).match(/2[0-9][0-9]/g)){
    httpClientRequestErrorMetric = Singleton[MONITORING_CONSTANTS.PROMETHEUS.HTTP_CLIENT_REQUEST_ERROR_METRIC];
  }
  httpClientRequestDurationMetric = Singleton[MONITORING_CONSTANTS.PROMETHEUS.HTTP_CLIENT_REQUEST_DURATION_METRIC];

  try {
    if (httpClientRequestDurationMetric) {
    httpClientRequestDurationMetric.labels(monitoringParams.external_service_id, monitoringParams.route,
      monitoringParams.http_code, monitoringParams.env).observe(Date.now() - monitoringParams.start_time);
    }
    if (httpClientRequestErrorMetric) {
    httpClientRequestErrorMetric.labels(monitoringParams.external_service_id, monitoringParams.route, 
      monitoringParams.http_code, monitoringParams.error_type).inc()
    }
  } catch(err) {
    let logData = {};
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = monitoringParams.client_id;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.EXTERNAL_SERVICE_ID] = monitoringParams.external_service_id;
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = monitoringParams.route;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.METRICS_CAPTURE_ERROR;
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.message || JSON.stringify(err);
    Logger.error(logData);
  }
};

PrometheusExporter.exportMetrics = function(client, startTimeMs) {
  let PrometheusClient = Singleton[MONITORING_CONSTANTS.PROMETHEUS.CLIENT];
  let metricsData = {};
  if (PrometheusClient) {
    let PrometheusClient = Singleton[MONITORING_CONSTANTS.PROMETHEUS.CLIENT];
    let clientId = client['user-agent'] && client['user-agent'].includes('Prometheus') ? MONITORING_CONSTANTS.PROMETHEUS.SCRAPPER : RPC_CONSTANTS.EMPTY;
    try {
      metricsData.metrics = PrometheusClient.register.metrics();
      metricsData.contentType = PrometheusClient.register.contentType;

      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = MONITORING_CONSTANTS.PROMETHEUS.APP_METRICS_ENDPOINT;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = client['user-agent'];
      logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - startTimeMs;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = clientId;
      Logger.info(logData);
    } catch(err) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = clientId;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.METRICS_EXPORT_ERROR;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.message || JSON.stringify(err);
      Logger.error(logData);
    }
    return metricsData;
  }
};

PrometheusExporter.isMonitoringEnabled = function() {
  return IS_PROMETHEUS_MONITORING_ENABLED;
};

module.exports = PrometheusExporter;
