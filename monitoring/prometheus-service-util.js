'use strict';

// Imports start
const _ = require('lodash');
const Util = require('util');
const Singleton = require('../singleton').getSingleton();
const { Logger } = require('../logging/standard_logger');
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const ERROR = require('../error');
const MonitoringConstants = require('./monitoring_constants')
// Imports end

// Initialization start
const PrometheusServiceUtil = {};
const Config = Singleton.Config;
const PrometheusServiceConf = Config.getExternalConf(MonitoringConstants.PROMETHEUS_SERVICE_ID);
const API_END_POINT = `http://${PrometheusServiceConf.uri}:${PrometheusServiceConf.port}/api/v1/query?query=%s`;
// Initialization end

const logError = (data, message) => {
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = "prom_ql";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = data['promQL'];
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = ERROR.RPC_EXTERNAL_SERVER_ERROR;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = message;
  Logger.error(logData);
};

PrometheusServiceUtil.getQueryResult = async (metric, labelsMap) => {
  let labelsQueryStr;
  for (const [key, value] of _.entries(labelsMap)) {
    const labelStr = key + "=" + "\"" + value + "\"";
    labelsQueryStr = labelsQueryStr ? labelsQueryStr + "," + labelStr : labelStr;
  }
  const promQL = metric + "{" + labelsQueryStr + "}";
  const PrometheusServiceClient = Singleton[MonitoringConstants.PROMETHEUS_SERVICE_ID];
  let response;
  if (PrometheusServiceClient) {
    const options = {
      method: 'GET',
      uri: Util.format(API_END_POINT, promQL),
      json: true
    };
    try {
      response = await PrometheusServiceClient.requestPromise(options);
    } catch(error) {
      logError({promQL: promQL}, 'Error while executing prometheus' +
          ' query. Exception::'+ JSON.stringify(error));
    }
  }
  return _.get(response, 'data.result');
};

module.exports = PrometheusServiceUtil;
