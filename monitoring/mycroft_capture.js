'use strict';

const MONITORING_CONSTANTS = require('./monitoring_constants');
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const { Logger } = require('../logging/standard_logger');
const Error = require('../error');
const Mycroft = require('@uc-engg/mycroft');
const _ = require('lodash');
const RPC_CONSTANTS = require('../constants');
const Singleton = require('../singleton').getSingleton();
const RPC_METRICS = MONITORING_CONSTANTS.RPC_METRICS;
const APPLICATION_METRICS = MONITORING_CONSTANTS.APPLICATION_METRICS;
const MIDDLEWARE_METRICS = MONITORING_CONSTANTS.MIDDLEWARE_METRICS;
const IS_MIDDLEWARE_MONITORING_ENABLED = (process.env.MIDDLEWARE_MONITORING_ENABLED === 'true');
const METRIC_TYPES = MONITORING_CONSTANTS.METRIC_TYPES;

function monitorPayloadKeyValueMetric(monitoringParams) {
  const apiKeyTrackingMap = Singleton.Config.CUSTOM.API_KEY_TRACKING_MAP;
  const keysToTrack = _.get(apiKeyTrackingMap, monitoringParams.path);
  if (_.isEmpty(apiKeyTrackingMap) || _.isUndefined(keysToTrack)) return;
  const deviceType = getDeviceType(monitoringParams.client_id, monitoringParams.headers);
  const metricLabelVal = {
    service: monitoringParams.service_id,
    client: monitoringParams.client_id || deviceType || RPC_CONSTANTS.UNKNOWN,
    route: monitoringParams.route,
    code: monitoringParams.http_code
  };

  _.forEach(keysToTrack, (key) => {
    const value = _.get(monitoringParams, `body.${key}`); 
    metricLabelVal.key = key;
    if(Array.isArray(value)) {
      _.forEach(value, (val) => {
        metricLabelVal.value = val;
        Mycroft.incMetric(
          RPC_METRICS.STORE,
          RPC_METRICS.HTTP_SERVER_REQUEST_KEYS_COUNT, {
          ...metricLabelVal,
        });
      });
    } else {
      metricLabelVal.value = value;
      Mycroft.incMetric(
        RPC_METRICS.STORE,
        RPC_METRICS.HTTP_SERVER_REQUEST_KEYS_COUNT, {
        ...metricLabelVal,
      });
    }
  });
}

function monitorPayloadSizeValue(monitoringParams) {
  const metricLabelVal = {
    client: monitoringParams.client,
    route: monitoringParams.route,
    code: monitoringParams.code,
  };

  Mycroft.setMetric(RPC_METRICS.STORE,
    RPC_METRICS.REQUEST_PAYLOAD_SIZE_IN_BYTES, {
    ...metricLabelVal
  }, monitoringParams.request_payload_size
  );

  Mycroft.setMetric(RPC_METRICS.STORE,
    RPC_METRICS.RESPONSE_PAYLOAD_SIZE_IN_BYTES, {
    ...metricLabelVal
  }, monitoringParams.response_payload_size
  );
}

function middlewareMetrics(monitoringParams) {
  if(!IS_MIDDLEWARE_MONITORING_ENABLED) {
    return;
  }
  const metricLabelVal = {
    route: monitoringParams.route,
    middleware: monitoringParams.name
  };

  Mycroft.setMetric(
    MIDDLEWARE_METRICS.STORE,
    MIDDLEWARE_METRICS.HTTP_SERVER_REQUEST_MIDDLEWARE_DURATION,
    metricLabelVal,
    monitoringParams.latency
  );
}

function serverRequestMetric(monitoringParams) {
  let deviceType = getDeviceType(monitoringParams.client_id, monitoringParams.headers);

  const metricLabelVal = {
    service: monitoringParams.service_id,
    client: monitoringParams.client_id || deviceType || RPC_CONSTANTS.UNKNOWN,
    route: monitoringParams.route,
    code: monitoringParams.http_code
  }

  try {

    if (isErrorCode(monitoringParams.http_code)) {
      Mycroft.incMetric(
        RPC_METRICS.STORE,
        RPC_METRICS.HTTP_SERVER_REQUEST_ERROR, {
        ...metricLabelVal,
        error_type: monitoringParams.error_type
      });
    }

    Mycroft.setMetric(
      RPC_METRICS.STORE,
      RPC_METRICS.HTTP_SERVER_REQUEST_DURATION, {
      ...metricLabelVal,
      env: monitoringParams.env
    }, Date.now() - monitoringParams.start_time);
  // For capturing payload keys and values metrics
    monitorPayloadKeyValueMetric(monitoringParams);
  } catch (err) {
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
function clientRequestMetric(monitoringParams) {
  const metricLabelVal = {
    external_service: monitoringParams.external_service_id,
    route: monitoringParams.route,
    code: monitoringParams.http_code
  }

  try {
    if (isErrorCode(monitoringParams.http_code)) {
      Mycroft.incMetric(
        RPC_METRICS.STORE,
        RPC_METRICS.HTTP_CLIENT_REQUEST_ERROR, {
        ...metricLabelVal,
        error_type: monitoringParams.error_type
      });
    }

    if (monitoringParams.start_time) {
      Mycroft.setMetric(
        RPC_METRICS.STORE,
        RPC_METRICS.HTTP_CLIENT_REQUEST_DURATION, {
          ...metricLabelVal,
          env: monitoringParams.env
        }, Date.now() - monitoringParams.start_time);
    }

  } catch (err) {
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

function applicationMetrics(metricName, monitoringParams) {
  try {
    if(!_.get(monitoringParams, 'labels')) {
      Mycroft.incMetric(APPLICATION_METRICS.STORE, metricName, monitoringParams);
      return;
    }
    const metricType = monitoringParams.metricType || METRIC_TYPES.COUNTER;
    const metricVal = monitoringParams.value;
    const setMetricStrategy = {
      [METRIC_TYPES.GAUGE] : Mycroft.setMetric,
      [METRIC_TYPES.HISTOGRAM] : Mycroft.setMetric,
      [METRIC_TYPES.COUNTER] : Mycroft.incMetric
    };
    setMetricStrategy[metricType](APPLICATION_METRICS.STORE, metricName, monitoringParams.labels, metricVal);
  } catch (err) {
    logMetricCaptureError(err)
  }
};

async function workflowMetrics(metricName, monitoringParams) {
  try {

    const metricType = monitoringParams.metricType;
    const metricVal = monitoringParams.value;
    const jobName = monitoringParams.jobName;

    const setMetricStrategy = {
      [METRIC_TYPES.GAUGE] : Mycroft.setMetric,
      [METRIC_TYPES.COUNTER] : Mycroft.incMetric
    }
    
    setMetricStrategy[metricType](APPLICATION_METRICS.STORE, metricName, monitoringParams.labels, metricVal);
  
    await Mycroft.pushMetric(APPLICATION_METRICS.STORE, jobName)

  } catch (err) {
    logMetricCaptureError(err)
  }
};

function isErrorCode(httpCode) {
  return !String(httpCode).match(/2[0-9][0-9]/g);
}

function logMetricCaptureError(err){
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.METRICS_CAPTURE_ERROR;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = JSON.stringify(err);
  Logger.error(logData);
}

function getDeviceType(clientId, headers) {
  let deviceType = _.get(headers, 'x-device-os');

  if (!clientId && !deviceType) {
    if (_.includes(_.get(headers, 'user-agent'), 'Android')) {
      deviceType = 'android';
    } else if(_.includes(_.get(headers, 'user-agent'), 'iPhone')) {
      deviceType = 'ios';
    } else if (_.includes(_.get(headers, 'user-agent'), 'Mozilla')) {
      deviceType = 'web';
    }
  }

  if(_.has(headers, 'x-redirection-client-id')) {
    deviceType = _.get(headers, 'x-redirection-client-id') + ':' + (deviceType || '');
  }

  return deviceType;
}

module.exports = {
  serverRequestMetric,
  clientRequestMetric,
  applicationMetrics,
  workflowMetrics,
  monitorPayloadSizeValue,
  middlewareMetrics
}