import _ from 'lodash';
import RPC_CONSTANTS from '../../constants';
import { Logger } from '../../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import PrometheusExporter from '../../monitoring/prometheus_exporter';
import Monitoring from '../../monitoring';
import { getSingleton } from '../../singleton';
import { MonitoringUtils } from '../../common/monitoring_utils';
import { MonitoringMiddlewareInterface } from './interface';

const RPC_METRICS = Monitoring.CONSTANTS.RPC_METRICS;
const APPLICATION_METRICS = Monitoring.CONSTANTS.APPLICATION_METRICS;
const Singleton = getSingleton();

export const MonitoringMiddleware: MonitoringMiddlewareInterface = {
  monitorMiddlewares: (app) => {
    // iterate through all installed layers(midllewares) and proxy them through monitoredMiddleware.
    _.forEach(app._router.stack, (layer) => {
      layer.handle = monitoredMiddleware(layer.handle, layer.name);
    });
  },
  
  healthCheck: (app, service_id) => {
    app.get('/healthcheck', function(req, res, next) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVER_RESPONSE;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = RPC_CONSTANTS.LOAD_BALANCER;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = RPC_CONSTANTS.HEALTH_CHECK;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.headers['user-agent'];
      logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
      Logger.info(logData);
      const monitoringParams = MonitoringUtils.getMonitoringParameters({
        service_id: service_id,
        client_id: 'ALB',
        method_url: '/healthcheck',
        http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK,
        error_type: RPC_CONSTANTS.EMPTY,
        env: Singleton.Config.ENV,
        start_time: req.start_time_ms,
        headers: req.headers,
        path: '/healthcheck',
        body: req.body
      });
      PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
      Monitoring.capture.serverRequestMetric(monitoringParams);
      res.status(200).json({ message: 'health check passed!!!' });
    });
  },
  
  ecsServiceHealthCheck: (app, ecs_service_id, service_id) => {
    const ecs_service_healthcheck_url = `/${ecs_service_id}/healthcheck`;
    app.get(ecs_service_healthcheck_url, function(req, res, next) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVER_RESPONSE;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = RPC_CONSTANTS.LOAD_BALANCER;
      logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = ecs_service_healthcheck_url;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.headers['user-agent'];
      logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
      Logger.info(logData);
      const monitoringParams = MonitoringUtils.getMonitoringParameters({
        service_id: service_id,
        client_id: 'ALB',
        method_url: ecs_service_healthcheck_url,
        http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_OK,
        error_type: RPC_CONSTANTS.EMPTY,
        env: Singleton.Config.ENV,
        start_time: req.start_time_ms,
        headers: req.headers,
        path: ecs_service_healthcheck_url,
        body: req.body
      });
      PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
      Monitoring.capture.serverRequestMetric(monitoringParams);
      res.status(200).json({ message: 'service health check passed!!!' });
    });
  },
  
  exposeOpenapiRpcMetrics: (app) => {
    app.get(RPC_METRICS.ENDPOINT, function (req, res) {
      MonitoringUtils.sendMonitoredMetricsPayload(req, res, Monitoring.exporter.RPCMetrics);
    });
  },
  
  exposeApplicationMetrics: (app) => {
    app.get(APPLICATION_METRICS.ENDPOINT, function (req, res) {
      MonitoringUtils.sendMonitoredMetricsPayload(req, res, Monitoring.exporter.ApplicationMetrics);
    });
  }
}


//Logic for internal use

const monitoredMiddleware = function (handle, name) {
  if (handle.length === 3){
    return function (req, res, next) {
      req.middlewareLatencies = req.middlewareLatencies || [];
      const start = Date.now();
      handle(req, res, function(err) { // overriding the next method
        const duration = Date.now() - start;
        req.middlewareLatencies.push({name: name, duration: duration});
        next(err);
      });
    }
  } else {
    return function (error, req, res, next) {
      req.middlewareLatencies = req.middlewareLatencies || [];
      const start = Date.now();
      handle(error, req, res, function(err) { // overriding the next method
        const duration = Date.now() - start;
        req.middlewareLatencies.push({name: name, duration: duration});
        next(err);
      });
    }
  }
};