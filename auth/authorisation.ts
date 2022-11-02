import compose from 'composable-middleware';
import { getSingleton } from "../singleton";
const Singleton = getSingleton();
import Error from '../error';
import _ from 'lodash';
import {AuthMetricUtility as AuthMetricUtils} from './auth_metric_utils';
import { CONSTANTS as AuthConstants } from './auth_constants';
const AUTH_CONSTANTS = AuthConstants.AUTH_METRICS;
const AUTH_ACCESS_CONTROL_TYPE = AUTH_CONSTANTS.ACCESS_CONTROL.TYPE;
const DEVICE_OS_LABEL = AUTH_CONSTANTS.LABEL.DEVICE_OS;
const TYPE_LABEL = AUTH_CONSTANTS.LABEL.TYPE;
const ERROR_TYPE_LABEL = AUTH_CONSTANTS.LABEL.ERROR_TYPE;
const ROUTE_NAME_LABEL = AUTH_CONSTANTS.LABEL.ROUTE;
const GUEST_ROLE_ALLOWED_LABEL = AUTH_CONSTANTS.LABEL.GUEST_ROLE_ALLOWED;
import { RequestHeadersUtil } from '../common/request_headers_util';


const ERROR_CODES = {
  UNAUTHORISED: 401
};

const ENTITIES = {
  customer_request: 'customer',
  provider_lead: 'provider'
};

export const clientAuthorisation = {
  isAuthorised: (options) => {

    let rpcAuthorisation = Singleton['access-control-service'];
    let resource = options.resource;
    let entity = ENTITIES[resource];
    let resourceIdPath = options.resource_id_path;
    let allowedRoles = options.roles;
    
    if (!resource || !entity || !resourceIdPath) {
      let error = {err_message: "Invalid options for authorisation in gateway config", err_type: Error.INVALID_PARAMS_ERROR};
      throw new Error.RPCError(error);
    }
    return compose().use(async function(req, res, next) {
      const StartTime = Date.now();
      const DeviceOS = RequestHeadersUtil.getDeviceType(req.headers);
      let requestId = _.get(req.body, resourceIdPath, null)

      if(!requestId) {
        let error = {err_message: "Resource ID not found in the body", err_type: Error.INVALID_PARAMS_ERROR};
        return next(new Error.RPCError(error));
      }
      let payload = {
        request_id: requestId,
        resource: resource,
        entity: entity,
        auth_id: req.body.headers.auth.id || null
      };

      try {
        let response = await rpcAuthorisation.clientAuth.isClientAuthorised(payload);
        let newKey = Object.keys(response.data)[0].split('resource_')[1];
        _.set(req.body, `headers.auth.resource.${newKey}`, response.data[Object.keys(response.data)[0]]);
        _.set(req, `headers.auth.resource.${newKey}`, response.data[Object.keys(response.data)[0]]);
        return next();
      }
      catch(err) {
        AuthMetricUtils.captureCounterMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
          AUTH_CONSTANTS.REQ_ERROR_COUNT_METRIC, {
            [DEVICE_OS_LABEL]: DeviceOS,
            [TYPE_LABEL]: AUTH_ACCESS_CONTROL_TYPE,
            [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl'),
            [ERROR_TYPE_LABEL]: AUTH_CONSTANTS.ERROR.UNHANDLED_TYPE
          });
        let rpc_error = {
          name: 'authFailure',
          message: err.err_message,
          code: ERROR_CODES.UNAUTHORISED,
          err_type: Error.RPC_AUTH_ERROR
        }
        return next(new Error.RPCError(rpc_error));
      }
      finally{
        AuthMetricUtils.captureResponseTimeMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
          AUTH_CONSTANTS.REQ_TIME_METRIC, {
            [DEVICE_OS_LABEL]: DeviceOS,
            [TYPE_LABEL]: AUTH_ACCESS_CONTROL_TYPE,
            [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl'),
            [GUEST_ROLE_ALLOWED_LABEL]: _.includes(allowedRoles, 'guest')
          }, Date.now() - StartTime);
      }
    });
  }
};