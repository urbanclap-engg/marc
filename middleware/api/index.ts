'use strict';

import _ from 'lodash';
import TransactionContext from '../../transaction-context';
import { LOG_CONSTANTS } from '../../logging/constants';
import RPC_CONSTANTS from '../../constants';
import { Response } from '../../common/response';
import { getSingleton } from '../../singleton';
import PrometheusExporter from '../../monitoring/prometheus_exporter';
import Monitoring from '../../monitoring';
import APMTransactionTracker from '../../monitoring/background-transaction-tracker';
import swaggerValidation from '@uc-engg/openapi-validator-middleware';
import { Utils as dependencyUtils } from '../../dependency/utils';
import { PreApiMiddleware } from '../pre_api';
import { PostApiMiddleware } from '../post_api';
import { MiddlewareUtils } from '../utils';
import { MonitoringUtils } from '../../common/monitoring_utils';
import { ApiMiddlewareInterface } from './interface';

const Singleton = getSingleton();


export const ApiMiddleware: ApiMiddlewareInterface = {
  initServiceEndpoints: (app, params) => {
    PreApiMiddleware.initPreRunMiddleware(app, params.method_url, params.path, {service_id: params.service_id, auth_service_ids: params.auth_service_ids, schema: params.schema})
  
    app[getUrlOperationType(params.schema, params.path)](params.method_url, swaggerValidation.validate, function(req, res, next) {
      const overrideHeaders = Singleton.Config.getOverrideHeaders();
      const headers = {
        'x-override-servers': JSON.stringify(overrideHeaders),
      };
      TransactionContext.setTrxnHeaders({ ...headers, ...req.headers });
      if(getUrlOperationType(params.schema, params.path) === RPC_CONSTANTS.URL_OPERATION.GET) {
        req.body['query_params'] = req.query
        req.body['path_params'] = req.params
      }
      req.method_name = params.method_name;
      dependencyUtils.getMethodImplementation(params.method_name, params.service)(req.body)
        .then(function(result) {
          req.result = result;
          next();
        })
        .catch(function (err) {
          next(err);
        });
    });
    
    PostApiMiddleware.initPostRunMiddleware(app, params.method_url, params.path, {})
    
    // success 
    app.use(params.method_url, function(req, res, next) {
      APMTransactionTracker.setTransactionName(req.method + ' ' + params.method_url)
      res.status(200).json(req.result);
      _.forEach(req.middlewareLatencies, function(middleware) {
        Monitoring.capture.middlewareMetrics(getMiddlewareMonitoringParams(params.method_url, middleware));
      });
    });
  
    // failure
    app.use(params.method_url, function(err, req, res, next) {
      APMTransactionTracker.setTransactionName(req.method + ' ' + params.method_url)
      const error = MiddlewareUtils.createError(req, sanitizedPayloadForServer(req), err);
      const response = Response.getErrorResponse(error)
      res.status(response.code).json(response.body);
      let monitoringParams = MonitoringUtils.getMonitoringParameters({
        service_id: params.service_id, 
        client_id: req.query.client_id,
        method_url: params.method_url,
        http_code: RPC_CONSTANTS.HTTP_RESPONSE_CODE_ERROR,
        error_type: error[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE],
        env: Singleton.Config.ENV,
        start_time: req.start_time_ms,
        headers: req.headers,
        path: params.path,
        body: req.body
      });
      PrometheusExporter.captureServerRequestDurationMetric(monitoringParams);
      Monitoring.capture.serverRequestMetric(monitoringParams);
      _.forEach(req.middlewareLatencies, function(middleware) {
        Monitoring.capture.middlewareMetrics(getMiddlewareMonitoringParams(params.method_url, middleware));
      });
    });
  }
}

//Logic for internal use

const getUrlOperationType = (schema, path) => {
  const pathUrl = _.keys(schema.paths[path])[0];
  return (pathUrl == RPC_CONSTANTS.URL_OPERATION.GET) ? pathUrl : RPC_CONSTANTS.URL_OPERATION.POST
}

const getMiddlewareMonitoringParams = (method_url, middlewareData) => {
  const monitoringParams = {
    route: method_url,
    latency: middlewareData.duration,
    name: middlewareData.name
  };
  return monitoringParams;
}

const sanitizedPayloadForServer = (req) => {
  if(_.get(req, 'headers.content-length', 2049) < 2048) {
    return JSON.stringify(req.body);
  }
  return undefined;
}