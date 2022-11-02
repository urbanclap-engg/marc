'use strict';

import _ from 'lodash';
import Error from '../../error';

export const ServerUtils = {
  isMethodPathValid: (methodPath) => {
    return methodPath.split('/').length <= 3;
  },
  
  isMethodImplemented: (methodPath, service) => {
    const path =  methodPath.split('/').join('.');
    const getPathValue = _.get(service, path);
    return !!getPathValue;
  },
  
  setStartTimeToRequest: (req, res, next) => {
    req.start_time_ms = Date.now();
    next();
  },
  
  requestValidationFn: (errors, options) => {
    throw new Error.RPCError({ err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: errors.map(function(e) {return `${e.dataPath} ${e.message}`}).join(",") });
  },
  
  getPayloadMonitoringParams: (stats) => {
    const monitoringParams = {
      route: stats.req.raw.baseUrl || _.get(stats.req.raw._parsedUrl, 'pathname'),
      request_payload_size: stats.req.bytes,
      response_payload_size: stats.res.bytes,
      client: _.get(stats.req.raw.headers, 'client_id', stats.req.raw.query.client_id || stats.req.raw.client_id),
      code: stats.res.status
    };
    return monitoringParams;
  }
};