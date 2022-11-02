'use strict'

import _ from 'lodash';
import TransactionContext from '../../transaction-context';
import express from 'express';
import bodyParser from 'body-parser';
import { expanded as expandSchemaRef } from 'expand-swagger-refs';
import requestStats from 'request-stats';
/**
 * Standard Logger should be used when
 * 1. We are logging at the time of server startup (no transaction context present).
 * 2. We do not want to log the transaction id i.e. in case of health check
 *    or in case of js file initialisation.
 *
 * Note: For cases(which should be all the cases except above two points) where logs
 *       are printed in the context of any request, we should use Singleton.Logger function
 *       for logging as it also logs the transaction id.
 */
import { Logger } from '../../logging/standard_logger';
import { Slack } from '../../slack';
import Error from '../../error';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import RPC_CONSTANTS from '../../constants';
import AuditContext from '../../audit-context';
import { getSingleton } from '../../singleton';
import PrometheusExporter from '../../monitoring/prometheus_exporter';
import Monitoring from '../../monitoring';
import swaggerValidation from '@uc-engg/openapi-validator-middleware';
import { RpcServerInterface } from './interface';


const Singleton = getSingleton();
const RPC_METRICS = Monitoring.CONSTANTS.RPC_METRICS;

export const RpcServer: RpcServerInterface = {
  /**
   * Create the proto server.
   * Description in index.js file.
  */
  createServer: (service_id, auth_service_ids, schema, service, port) => {
    const { Middleware } = require('../../middleware');
    const MonitoringMiddleware = Middleware.monitoringMiddleware;
    const ServerMiddleware = Middleware.serverMiddleware;
    const { ServerUtils } = require('./utils');
    const { MonitoringUtils } = require('../../common/monitoring_utils');
  
    const ecs_service_id = _.get(Singleton, 'Config.SUB_SERVICE_ID', service_id);
    console.log('ecs service-id: ',ecs_service_id);
    /* Log all uncaught exceptions properly and exit gracefully */
    process.on("uncaughtException", function (err) {
      console.log('------------Uncaught exception caught--------------');
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_UNCAUGHT_SERVER_EXCEPTION;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err ? err.message : "NA";
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err ? err.stack : "NA";
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = err;
      Singleton.Logger.error(logData);
      Slack.serverRestartAlert(service_id, err ? err.message : "NA")
        .then(function () {
          Singleton.Logger.exit_after_flush();
        })    
    });
  
    /* Log all uncaught rejection properly and exit gracefully */
    process.on("unhandledRejection", function (reason: any, p) {
      console.log('------------Unhandled rejection caught--------------');
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_UNHANDLED_SERVER_REJECTION;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = reason ? (reason.err_message || reason.message) : "NA";
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = reason ? (reason.err_stack || reason.stack) : "NA";
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = JSON.stringify(reason);
      Singleton.Logger.error(logData);
    });
  
    let app = express();
    swaggerValidation.init(expandSchemaRef(schema), { errorFormatter: ServerUtils.requestValidationFn });
    app.use(ServerUtils.setStartTimeToRequest);
    app.use(bodyParser.json({ limit: '20mb'}));
    app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
    app.use(TransactionContext.getExpressMiddleware());
    app.use(AuditContext.getExpressMiddleware());
    app.use(ServerMiddleware.debugLogRequest);
    if(PrometheusExporter.isMonitoringEnabled()) {
      // expose metrics at the default URL for Prometheus
      app.get('/metrics', function(req, res, next) {
        MonitoringUtils.sendMonitoredMetricsPayload(req, res, PrometheusExporter.exportMetrics);
      });
    }
  
    //Endpoint for exposing openapi-rpc metrics
    MonitoringMiddleware.exposeOpenapiRpcMetrics(app);
  
    //Endpoint for exposing application metrics
    MonitoringMiddleware.exposeApplicationMetrics(app);
  
    // TODO validate schema
    // ....
    //Initializing RPC Server
    initRpcServer(app, schema, service_id, auth_service_ids, service);
  
    MonitoringMiddleware.monitorMiddlewares(app);
  
    MonitoringMiddleware.healthCheck(app, service_id);
  
    MonitoringMiddleware.ecsServiceHealthCheck(app, ecs_service_id, service_id);
     
    /* @Objective : Returns various details about DB events 
       @param : Req --> { action (list or getSchema), db_type, db_name,schema_name } 
       @param : Res --> Returns the JSON Schema of the event or list of all Schemas according to the action chosen.
    */  
    ServerMiddleware.getDBDetails(app);
    
    /**
    * Returns 200 if service_id is Authenticated to call another micro service, else 500.
    * @param service_id
    * @return success : "{ message: 'Authenticated!!!' }", failure : "{"err_type":"rpc_auth_error","err_message":""}"
    */
    ServerMiddleware.isInternalServiceAuthenticated(app, auth_service_ids, service_id);
  
    ServerMiddleware.getEventDataConfig(app, service_id);
  
    ServerMiddleware.triggerProfiler(app);
  
    // undefined route -
    ServerMiddleware.handleUndefinedRouteError(app, service_id);
  
    // other errors -
    ServerMiddleware.handleApiError(app, service_id);
  
    let server = app.listen(port, function() {
      Logger.system(port, 'started');
    });
    server.keepAliveTimeout = 0;
    requestStats(server, function (stats) {
      // this function will be called every time a request to the server completes.
      if(stats.res.status === RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK) {
        let logData = MonitoringUtils.getEndpointResponseLog(stats.req.raw);
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1] = 'request_size_bytes';
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1_VALUE] = stats.req.bytes;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_2] = 'response_size_bytes';
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_2_VALUE] = stats.res.bytes;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.STATUS] = _.get(stats, 'res.status', RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK).toString();
        Singleton.Logger.info(logData);
        const method_url = stats.req.raw.baseUrl || _.get(stats.req.raw._parsedUrl, 'pathname');
        const path = '/' + _.split(method_url, '/')[2];
        const ecs_service_healthcheck_url = `/${ecs_service_id}/healthcheck`;
        let monitoringParams = MonitoringUtils.getMonitoringParameters({
          service_id: service_id,
          client_id: stats.req.raw.query.client_id,
          method_url: method_url,
          http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK,
          error_type: RPC_CONSTANTS.EMPTY,
          env: Singleton.Config.ENV,
          start_time: stats.req.raw.start_time_ms,
          headers: stats.req.raw.headers,
          path: path,
          body: stats.req.raw.body
        });
        if(!_.includes(['/healthcheck', ecs_service_healthcheck_url, RPC_METRICS.ENDPOINT], monitoringParams.route)) {
          Monitoring.capture.serverRequestMetric(monitoringParams);
        }
      }
      Monitoring.capture.monitorPayloadSizeValue(ServerUtils.getPayloadMonitoringParams(stats));
    });
  }
}

//Logic for internal use

const initRpcServer = (app, schema, service_id, auth_service_ids, service) => {
  const { ServerUtils } = require('./utils');
  const { Middleware } = require('../../middleware');
  const ApiMiddleware = Middleware.apiMiddleware;

  const expected_paths = _.keys(schema.paths);

  expected_paths.forEach(function (path) {

    const method_name = path.substring(1)
    const method_url = '/' + service_id + path

    if (!ServerUtils.isMethodPathValid(method_name)) {
      throw new Error.RPCError({err_type: Error.RPC_METHOD_PATH_INVALID_ERROR, err_message: method_url});
    }
    if (!ServerUtils.isMethodImplemented(method_name, service)) {
      throw new Error.RPCError({err_type: Error.RPC_METHOD_NOT_IMPLEMENTED_ERROR, err_message: method_url});
    }

    ApiMiddleware.initServiceEndpoints(app, {
      service_id: service_id,
      service: service,
      auth_service_ids: auth_service_ids,
      schema: schema,
      method_name: method_name,
      method_url: method_url,
      path: path
    });
  });
}