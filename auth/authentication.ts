import _ from 'lodash';
import compose from 'composable-middleware';
import expressJwt from 'express-jwt';
import { getSingleton } from "../singleton";
const Singleton = getSingleton()
const Logger = Singleton.Logger;
import { AuthMetricUtility as AuthMetricUtils } from './auth_metric_utils';
import { AuthUtility as AuthUtils } from './auth_utils';
import { LOG_CONSTANTS } from '../logging/constants';
const Auth = Singleton.auth_service;
const AccessControlService = Singleton["access-control-service"];
const AuditContextConstants = Singleton.AuditContextConstants;
import RPC_CONSTANTS from '../constants';
import Error from '../error';
import * as Mycroft from '@uc-engg/mycroft';
import { CONSTANTS as AuthConstants } from './auth_constants';
const AUTH_CONSTANTS = AuthConstants.AUTH_METRICS;
const AUTH_TOKEN_TYPE = AUTH_CONSTANTS.TOKEN.TYPE;
const AUTH_CAPTCHA_TYPE = AUTH_CONSTANTS.CAPTCHA.TYPE;
const DEVICE_OS_LABEL = AUTH_CONSTANTS.LABEL.DEVICE_OS;
const TYPE_LABEL = AUTH_CONSTANTS.LABEL.TYPE;
const ERROR_TYPE_LABEL = AUTH_CONSTANTS.LABEL.ERROR_TYPE;
const ROUTE_NAME_LABEL = AUTH_CONSTANTS.LABEL.ROUTE;
const GUEST_ROLE_ALLOWED_LABEL = AUTH_CONSTANTS.LABEL.GUEST_ROLE_ALLOWED;
import { RequestHeadersUtil } from '../common/request_headers_util';


const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403
};

const validateJwt = expressJwt({
  secret: RPC_CONSTANTS.GOOGLE_AUTH.session
});

async function authenticateCaptcha(secretKey, captchaKey, ip){

  const CaptchaClient = Singleton['google_captcha'];

  let googleCaptchaAPI = RPC_CONSTANTS.GOOGLE_CAPTHA.CAPTCHA_URI;
  googleCaptchaAPI += '?secret=' + secretKey + '&response=' + captchaKey;
  if (ip) googleCaptchaAPI += '&responseip=' + ip;

  const response = await CaptchaClient.requestPromise({
    method: 'POST',
    uri: googleCaptchaAPI,
    json: true
  });
  return response.success;
}

const handleAuthError = (name, message = 'Authorization Failure') => {
  let code = {
    name,
    message,
    code: ERROR_CODES.UNAUTHORIZED,
    err_type: Error.RPC_AUTH_ERROR
  };
  //Genuine issue with auth 
  throw new Error.RPCError(code);
}

export const Authentication = {
  isCaptchaAuthenticated: (options) => {
    let allowedRoles = options.roles;
    return compose().use( async function( req, res, next ) {
      const DeviceOS = RequestHeadersUtil.getDeviceType(req.headers);
      try{
        const ip = _.get(req, 'headers.x-forwarded-for') || _.get(req, 'connection.remoteAddress') || _.get(req, 'socket.remoteAddress') ||
                  _.get(req, 'connection.socket.remoteAddress');
        const captchaKey = req.headers.ck || '';
        let response;
        if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production'){
          const StartTime = Date.now();
          response = await authenticateCaptcha(Singleton.Config.CUSTOM.credentials.google_api_key, captchaKey, ip);
          AuthMetricUtils.captureResponseTimeMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
            AUTH_CONSTANTS.REQ_TIME_METRIC, {
              [DEVICE_OS_LABEL]: DeviceOS,
              [TYPE_LABEL]: AUTH_CAPTCHA_TYPE,
              [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl'),
              [GUEST_ROLE_ALLOWED_LABEL]: _.includes(allowedRoles, 'guest')
            }, Date.now() - StartTime);
        }
        else{
          response = true;
        }

        if (response){
          next();
        }
        else{
          AuthMetricUtils.captureCounterMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
            AUTH_CONSTANTS.REQ_ERROR_COUNT_METRIC, {
              [DEVICE_OS_LABEL]: DeviceOS,
              [TYPE_LABEL]: AUTH_CAPTCHA_TYPE,
              [ERROR_TYPE_LABEL]: AUTH_CONSTANTS.ERROR.FAILURE_TYPE,
              [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl')
              });
          const err = {
            name: AUTH_CONSTANTS.AUTH_FAILURE,
            message: AUTH_CONSTANTS.CAPTCHA.FAILURE_MSG,
            code: ERROR_CODES.UNAUTHORIZED,
            err_type: Error.RPC_AUTH_ERROR
          };
          next(err);
        }
      }  catch ( err ){
        AuthMetricUtils.captureCounterMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
          AUTH_CONSTANTS.REQ_ERROR_COUNT_METRIC, {
            [DEVICE_OS_LABEL]: DeviceOS,
            [TYPE_LABEL]: AUTH_CAPTCHA_TYPE,
            [ERROR_TYPE_LABEL]: AUTH_CONSTANTS.ERROR.UNHANDLED_TYPE,
            [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl')
          });
          next(err);
        }
    });
  },

  isGoogleAuthenticated: (options) => {
    let { isSkipExternalAuthentication, roles = [], teams = [] } = options;
    return compose().use( function (req, res, next) {
        if (req.query && req.query.hasOwnProperty('access_token')) {
          req.headers.authorization = 'Bearer ' + req.query.access_token;
        }
        validateJwt(req, res, next);
      })
      .use( async function (req, res, next) {
        try {
          let userData = await AccessControlService.getUserDetails({userId: req.user._id});
          let user = _.get(userData, 'data');
          if (!user) {
            handleAuthError('googleAuthFailure', 'User Detail is Empty');
          }
          if(!user || (_.isUndefined(isSkipExternalAuthentication) && _.includes(user.role,'external'))){
            handleAuthError('googleAuthFailure', 'External Authentication Failure');
          }
    
          const myAccesses = await AccessControlService.getMyAccesses({
            user_id: user.email
          });
    
          let userAccesses = myAccesses.data ? myAccesses.data.access : [];
          userAccesses = _.map(userAccesses, userAccess => userAccess.name);
          user.team = user.team.concat(userAccesses);
          let validTeam = true, validRole = true;
          if(teams.length > 0) {
            validTeam = teams.some(authorizedTeam => user.team.includes(authorizedTeam));
          }
          if(roles.length > 0) {
            validRole = roles.some(authorizedRole => user.role.includes(authorizedRole));
          }
          if(!validRole || !validTeam){
            handleAuthError('googleAuthFailure', `Authorization Failure - User doesn't belong to correct team or role.`);
          }
    
          req.headers.auth = {
            id: user._id.toString(),
            id_type: RPC_CONSTANTS.USER_TYPE.DASHBOARD_USER,
            userData: {
              name: user.name,
              email: user.email,
              is_active: user.is_active,
              role: user.role,
              team: user.team,
              handy_home: user.handy_home
            }
          };
          if(AuditContextConstants) {
            req.query[`${AuditContextConstants.CLIENT_USER_ID}`] = user.email;
          }
    
          next();
        }
        catch (err) {
          return next(err);
        }
        
      });
  },

  /**
   * Validate authentication and authorizationof a user
   *
   * @param allowedRoles - Roles that can access a given resource(api)
   */
  isClientAuthenticatedAndAuthorized: (options) => {
    const {
      roles: allowedRoles,
      subRoles: allowedSubRoles
    } = options;
    return compose().use(async function(req, res, next) {
      const StartTime = Date.now();
      let token = AuthUtils.getToken(req.headers);
      const DeviceOS = RequestHeadersUtil.getDeviceType(req.headers);
      try {
        let response = await Auth.verifyAuthenticationAndAuthorization({
          token: token, allowed_roles: allowedRoles, allowedSubRoles 
        });
        if(response && response.success) {
          _.set(req.body, 'headers.auth', response);
          _.set(req, 'headers.auth', response);
          _.set(req, 'headers.auth.token', token);
          next();
        }
        else {
          let errorCode = (response.reason.includes('Authentication')) ? ERROR_CODES.UNAUTHORIZED : ERROR_CODES.FORBIDDEN;
          let code = {
            name: AUTH_CONSTANTS.AUTH_FAILURE,
            message: response.reason,
            code: errorCode,
            err_type: Error.RPC_AUTH_ERROR
          };
          //Genuine issue with auth
          throw new Error.RPCError(code);
        }
      } catch (err) {
        //Issue with auth service
        if(err instanceof Error.RPCError && err.name === AUTH_CONSTANTS.AUTH_FAILURE){
          // Failure response from auth
          AuthMetricUtils.captureCounterMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
            AUTH_CONSTANTS.REQ_ERROR_COUNT_METRIC, {
              [DEVICE_OS_LABEL]: DeviceOS,
              [TYPE_LABEL]: AUTH_TOKEN_TYPE,
              [ERROR_TYPE_LABEL]: AUTH_CONSTANTS.ERROR.FAILURE_TYPE ,
              [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl')
            });
        }else{
          // Unexpected error in auth
          AuthMetricUtils.captureCounterMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
            AUTH_CONSTANTS.REQ_ERROR_COUNT_METRIC, {
              [DEVICE_OS_LABEL]: DeviceOS,
              [TYPE_LABEL]: AUTH_TOKEN_TYPE,
              [ERROR_TYPE_LABEL]: AUTH_CONSTANTS.ERROR.UNHANDLED_TYPE ,
              [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl')
            });
        }
        let logError = {};
        logError[LOG_CONSTANTS.SYSTEM_LOGS.API_NAME] = req.url;
        logError[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_AUTH_ERROR;
        logError[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = RPC_CONSTANTS.GATEWAY.MIDDLEWARE.AUTH_METHOD.CLIENT_AUTHENTICATION;
        logError[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = JSON.stringify(err);
        logError[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'headers';
        logError[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = JSON.stringify(req.headers);
        logError[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'authorization';
        logError[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = JSON.stringify(token);

        Logger.error(logError);
        if(allowedRoles.includes('guest')) {
          _.set(req.body, 'headers.auth', { role: 'guest' });
          _.set(req, 'headers.auth', { role: 'guest', token });
          next();
        }
        else {
          next(err)
        }
      }
      finally{
        AuthMetricUtils.captureResponseTimeMetric(AUTH_CONSTANTS.AUTH_METRIC_STORE,
          AUTH_CONSTANTS.REQ_TIME_METRIC, {
            [DEVICE_OS_LABEL]: DeviceOS,
            [TYPE_LABEL]: AUTH_TOKEN_TYPE,
            [ROUTE_NAME_LABEL]: _.get(req, 'originalUrl'),
            [GUEST_ROLE_ALLOWED_LABEL]: _.includes(allowedRoles, 'guest')
          }, Date.now() - StartTime);
      }
    })
  },

  exportMetrics: () => {
    try {
      return Mycroft.exportMetrics(AUTH_CONSTANTS.AUTH_METRIC_STORE).metrics;

    } catch (err) {
      Logger.error({
        error_type: AUTH_CONSTANTS.ERROR.EXPORT_METRIC_ERROR,
        error_message: err.message || JSON.stringify(err),
        error_stack: err.stack
      });
    }
  }

};