'use strict';

const MONITORING_CONSTANTS = require('./monitoring_constants');
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const { Logger } = require('../logging/standard_logger');
const Error = require('../error');
const RPC_CONSTANTS = require('../constants');
const Mycroft = require('@uc-engg/mycroft');
const { Events } = require('../dependency/events');
const RPC_METRICS = MONITORING_CONSTANTS.RPC_METRICS;
const MIDDLEWARE_METRICS = MONITORING_CONSTANTS.MIDDLEWARE_METRICS;
const APPLICATION_METRICS = MONITORING_CONSTANTS.APPLICATION_METRICS;
const Singleton = require('../singleton').getSingleton();
const IS_AUTH_MONITORING_ENABLED = (process.env.AUTH_MONITORING_ENABLED === 'true');
const IS_LOCALISATION_MONITORING_ENABLED = (process.env.LOCALISATION_MONITORING_ENABLED === 'true');
const IS_MIDDLEWARE_MONITORING_ENABLED = (process.env.MIDDLEWARE_MONITORING_ENABLED === 'true');
const LocalisationMetricUtility = require('../localisation/localisation_metric_utils');
const Promise  = require('bluebird');

function setImmediatePromise() { // Forces the execution of function in the next iteration of event loop.
  return new Promise((resolve) => {
    setImmediate(() => resolve());
  });
}

async function executeFuncInNextIteration(handle, args = []) {
  await setImmediatePromise();
  return handle(...args);
}

async function RPCMetrics(client, startTimeMs) { 
  const metricsData = exportMetrics(RPC_METRICS.STORE, client, startTimeMs);
  metricsData.metrics += await executeFuncInNextIteration(getTrajectoryMetrics);
  metricsData.metrics += await executeFuncInNextIteration(getAuthMetrics);
  metricsData.metrics += await executeFuncInNextIteration(getAcropolisMetrics);
  metricsData.metrics += await executeFuncInNextIteration(getLocalisationMetrics);
  metricsData.metrics += await executeFuncInNextIteration(getMiddlewareMetrics, [client]);
  metricsData.metrics += await executeFuncInNextIteration(getFlashMetrics);
  return metricsData;
}

function ApplicationMetrics(client, startTimeMs) {
  return exportMetrics(APPLICATION_METRICS.STORE,
    client, startTimeMs);
}

function getTrajectoryMetrics() {
  if (Events.isLibraryInitialized()) {
    const EventLib = require('@uc-engg/trajectory');
    return EventLib.exportMonitoringMetrics();
  }
  return '';
}

function getFlashMetrics() {
  for(const id of MONITORING_CONSTANTS.CACHE_SINGLETON_IDS) {
    if(Singleton[id]) {
      return Singleton[id].exportMetrics();
    }
  }
  return '';
}

function getAuthMetrics() {
  if(!IS_AUTH_MONITORING_ENABLED){
    return '';
  }
  const { Authentication } = require('../auth/authentication');
  return Authentication.exportMetrics();
}

function getAcropolisMetrics() {
  if(!IS_AUTH_MONITORING_ENABLED){
    return '';
  }
  if (Singleton.auth_service) {
    return Singleton.auth_service.exportMetrics();
  }
  return '';
}

function getLocalisationMetrics(){
  if(!IS_LOCALISATION_MONITORING_ENABLED){
    return '';
  }
  return LocalisationMetricUtility.exportMetrics();
}

function getMiddlewareMetrics(client){
  if(!IS_MIDDLEWARE_MONITORING_ENABLED) {
    return '';
  }
  try {
    return Mycroft.exportMetrics(MIDDLEWARE_METRICS.STORE).metrics;
  } catch(err) {
    errorHandler(err, client);
    return {};
  }
}

function exportMetrics(storeName, client, startTimeMs) {
  let metricsData = {};
  let clientId = client['user-agent'] && client['user-agent'].includes('Prometheus') ? MONITORING_CONSTANTS.PROMETHEUS.SCRAPPER : RPC_CONSTANTS.EMPTY;

  try {
    metricsData = Mycroft.exportMetrics(storeName);

    let logData = {};
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = RPC_METRICS.ENDPOINT;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = client['user-agent'];
    logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - startTimeMs;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = clientId;
    Logger.info(logData);
  } catch (err) {
    errorHandler(err, client);
  }

  return metricsData;
};

function errorHandler(err, client) {
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = client['user-agent'] && client['user-agent'].includes('Prometheus') ? MONITORING_CONSTANTS.PROMETHEUS.SCRAPPER : RPC_CONSTANTS.EMPTY;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.METRICS_EXPORT_ERROR;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = JSON.stringify(err);
  Logger.error(logData);
}

module.exports = {
  RPCMetrics,
  ApplicationMetrics
}
