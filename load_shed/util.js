`use strict`;

// Imports start
const _ = require('lodash');
const DateTime = require('luxon').DateTime
const Singleton = require('../singleton').getSingleton();
const LoadShedConstants = require('./constants');
const { Logger } = require('../logging/standard_logger');
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const Error = require('../error');
const PrioritizedLoadShed = require('./strategy/prioritized')
// Imports end

// Initialization start
const LoadShedUtil = {};
// Initialization end

LoadShedUtil.logError = (message) => {
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_LOAD_SHED;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.REQUEST_LOAD_SHEDED;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = message;
  Logger.error(logData);
};

LoadShedUtil.logInfo = (api, client, strategy, message) => {
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_LOAD_SHED;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = "API";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = api;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = "CLIENT";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = client;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3] = "strategy";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3_VALUE] = strategy;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE] = message;
  Logger.info(logData);
};

LoadShedUtil.getClient = (request) => {
  let key = _.get(request, 'query.client_id');

  key = key ? key : _.get(request.headers, 'x-device-os');
  if (!key) {
      if (_.includes(_.get(request.headers, 'user-agent'), 'Android')) {
          key = 'android';
      } else if(_.includes(_.get(request.headers, 'user-agent'), 'iPhone')) {
          key = 'ios';
      } else if (_.includes(_.get(request.headers, 'user-agent'), 'Mozilla')) {
          key = 'web';
      }
  }
  return key;
}

LoadShedUtil.getAPI = (request) => {
  const route = _.get(request._parsedUrl, 'pathname', _.get(request, 'base_url'));
  const api = route.split('/'+Singleton.Config['SERVICE_ID'])[1];
  return api;
}

LoadShedUtil.isRouteExcluded = (api) => {
  if (_.find(LoadShedConstants.ExcludedRoutes, (route) => route === api)) return true;
  return false;
}

module.exports = LoadShedUtil;
