'use strict';


import _ from 'lodash';
import RPC_CONSTANTS from '../../constants';
import Error from '../../error';
import { Slack } from '../../slack'; 
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import { getSingleton } from '../../singleton';
import uuidv4 from 'uuid/v4';
import {Profiler} from '../../profiler';
import PrometheusExporter from '../../monitoring/prometheus_exporter';
import Monitoring from '../../monitoring';
import { MiddlewareUtils } from '../utils';
import { MonitoringUtils } from '../../common/monitoring_utils';
import { ServerMiddlewareInterface } from './interface';
import { ProfileType, Strategy } from '../../profiler/interface';

const Singleton = getSingleton();


export const ServerMiddleware: ServerMiddlewareInterface = {
  debugLogRequest: (req, res, next) => {
    const debug_mode = _.get(Singleton, 'Config.CUSTOM.logging_options.debug_mode');
    if(debug_mode) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = req.headers.client_id || req.client_id || req.query.client_id;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = req.baseUrl || _.get(req._parsedUrl, 'pathname');
      logData[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = req.trxn_id;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.user_agent;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_NAME] = _.get(req, 'headers.x-device-os')
      logData[LOG_CONSTANTS.SYSTEM_LOGS.VERSION_NAME] = _.get(req, 'headers.x-version-name')
      logData[LOG_CONSTANTS.SYSTEM_LOGS.VERSION_CODE] = _.get(req, 'headers.x-version-code')
      logData[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_ID] = _.get(req, 'headers.x-device-id')
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'request_payload';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = JSON.stringify(req.body);
      Singleton.Logger.debug(logData);
    }
    next();
  },

  getDBDetails: (app) => {
    app.post('/getDBDetails', async function (req, res, next) {
      const DBDetails = require('../../schema/database');
      const response = await DBDetails.getDBDetails(req, res);
      if (typeof response !== 'undefined') {
        res.status(200).json(response);
      }
    });
  },
  
  isInternalServiceAuthenticated: (app, auth_service_ids, service_id) => {
    app.get('/isInternalServiceAuthenticated', function(req, res, next) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVER_RESPONSE;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = req.headers.client_id || req.query.client_id;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = RPC_CONSTANTS.IS_INTERNAL_SERVICE_AUTHENTICATED;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.user_agent;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
      if (_.isArray(auth_service_ids) && auth_service_ids.length > 0 && !_.includes(auth_service_ids, req.query.client_id)) {
          throw new Error.RPCError({ err_type: Error.RPC_AUTH_ERROR, err_message: `Internal service authentication failure, Client id: ${req.query.client_id} `});
        } else {
          Singleton.Logger.info(logData);
          let monitoringParams = MonitoringUtils.getMonitoringParameters({
            service_id: service_id,
            client_id: req.query.client_id,
            method_url: '/isInternalServiceAuthenticated',
            http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK,
            error_type: RPC_CONSTANTS.EMPTY,
            env: Singleton.Config.ENV,
            start_time: req.start_time_ms, 
            headers: req.headers, 
            path: '/isInternalServiceAuthenticated', 
            body: req.body
          });
          PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
          Monitoring.capture.serverRequestMetric(monitoringParams);
          res.status(200).json({ message: 'Authenticated!!!' });
        }
    });
  },
  
  getEventDataConfig: (app, service_id) => {
    app.get('/getEventDataConfig', function(req, res, next) {
      const uuid = uuidv4();
      const serverTime = (new Date()).getTime(); // timestamp in milliseconds
      let logData = {};
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'uuid';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = String(uuid);
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'server_time';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = String(serverTime);
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVER_RESPONSE;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = RPC_CONSTANTS.GET_SESSION;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.headers['user-agent'];
      logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
      Singleton.Logger.info(logData);
      let monitoringParams = MonitoringUtils.getMonitoringParameters({
        service_id: service_id,
        client_id: req.query.client_id,
        method_url: '/getEventDataConfig',
        http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK,
        error_type: RPC_CONSTANTS.EMPTY,
        env: Singleton.Config.ENV,
        start_time: req.start_time_ms, 
        headers: req.headers, 
        path: '/getEventDataConfig', 
        body: req.body
      })
      PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
      Monitoring.capture.serverRequestMetric(monitoringParams);
      res.status(200).json({ "uuid": String(uuid), "server_time": serverTime });
    });
  },
  
  triggerProfiler: (app) => {
    app.post('/triggerProfiler', async function(req, res, next) {
      const profileType: ProfileType = _.get(req.body, 'profileType');
      const duration = _.get(req.body, 'duration');
      const url = Profiler.triggerProfiler(Strategy.ON_DEMAND, profileType, duration); 
      res.status(200).json({ message: `Download the profile from ${url}` });
    });
  },
  
  handleUndefinedRouteError: (app, service_id) => {
    app.use(function(req, res, next) {
      const error = MiddlewareUtils.createError(req, undefined, { err_type: Error.RPC_METHOD_NOT_FOUND_ERROR, 
        err_message:"API route could not be found. Check the service schema or API controller code"});
      const route = _.get(req._parsedUrl, 'pathname', req.base_url);
      const monitoringParams = MonitoringUtils.getMonitoringParameters({
        service_id: service_id,
        client_id: req.query.client_id,
        method_url: route,
        http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_ERROR,
        error_type: error[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE],
        env: Singleton.Config.ENV,
        start_time: req.start_time_ms, 
        headers: req.headers, 
        path: '', 
        body: req.body
      })
      PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
      Monitoring.capture.serverRequestMetric(monitoringParams);
      res.status(500).json({ err_type: error[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE], err_message: error[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] });
    });
  },
  
  handleApiError: (app, service_id) => {
    app.use(function(err, req, res, next) {
      const error = MiddlewareUtils.createError(req, undefined, err);
      Slack.serverExceptionAlert(service_id, err);
      const route = _.get(req._parsedUrl, 'pathname', req.base_url);
      const monitoringParams = MonitoringUtils.getMonitoringParameters({
        service_id: service_id,
        client_id: req.query.client_id,
        method_url: route,
        http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_ERROR,
        error_type: error[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE],
        env: Singleton.Config.ENV,
        start_time: req.start_time_ms, 
        headers: req.headers, 
        path: '', 
        body: req.body
      })
      PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
      Monitoring.capture.serverRequestMetric(monitoringParams);
      res.status(500).json({ err_type: error[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE],
        err_message: error[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] });
    });
  }
}
