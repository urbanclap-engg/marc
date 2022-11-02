import _ from 'lodash';
import Authentication from '../../auth';
import AuditContext from '../../audit-context';
import RPC_CONSTANTS from '../../constants';
import { getSingleton } from '../../singleton';
import multipart from 'connect-multiparty';
import validator from 'swagger-express-validator';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import Error from '../../error';
import { RateLimit } from '../../rate_limit';
import { loadShedManager as loadSheding } from '../../load_shed';
import { expanded as expandSchemaRef } from 'expand-swagger-refs';
import { Logger } from '../../logging/standard_logger';
import { Slack } from '../../slack';
import { PreApiMiddlewareInterface } from './interface';

const Singleton = getSingleton();

export const PreApiMiddleware: PreApiMiddlewareInterface = {
  initPreRunMiddleware: (app, method_url, method_path, options) => {
    initRateLimitMiddleware(app, method_url, method_path);
    initLoadShedMiddleware(app, method_url, method_path);
    if (Singleton.GATEWAY_CONFIG) {
      initResponseValidatorMiddleware(app, method_url, options.schema);
      initAuthMiddlewares(app, method_url, method_path);
      initMultipartMiddleware(app, method_url, method_path);
    }
    else {
      validateServiceAuthId(app, method_url, options.service_id, options.auth_service_ids);
    }
  }
}


//Logic for internal use

const initRateLimitMiddleware = (app, method_url, method_path) => {
  app.use(method_url, RateLimit.serverRateLimiter);
}

const initLoadShedMiddleware = (app, method_url, method_path) => {
  app.use(method_url, loadSheding)
}

const initResponseValidatorMiddleware = (app, method_url, schema) => {
  app.use(method_url, validator({
    schema: expandSchemaRef(schema),
    validateRequest: false,
    validateResponse: true,
    responseValidationFn: responseValidationFn
  }))
}

const initAuthMiddlewares = (app, method_url, method_path) => {

  let authMiddlewares = _.get(Singleton.GATEWAY_CONFIG, `api.${method_path}.${RPC_CONSTANTS.GATEWAY.MIDDLEWARE.TYPE.AUTH}`);

    // Convert to an array, if not already.
    authMiddlewares = (Array.isArray(authMiddlewares)) ? authMiddlewares : [authMiddlewares]

    _.forEach(authMiddlewares, (applyAuthMiddleware) => {
      applyAuthFunctions(app, method_url, applyAuthMiddleware);
    })
}

const initMultipartMiddleware = (app, method_url, method_path) => {
  if (_.get(Singleton.GATEWAY_CONFIG, `api.${method_path}.${RPC_CONSTANTS.GATEWAY.MIDDLEWARE.TYPE.MULTIPART}`)) {
    app.use(method_url, multipart(), multipartHandler());
  }
}

const validateServiceAuthId = (app, method_url, service_id, auth_service_ids) => {
  app.use(method_url, verifyAuthId(service_id, auth_service_ids));
}

const responseValidationFn = (req, data, errors) => {
  req.method_name = req.method_name || req.baseUrl;
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = req.headers.client_id || req.query.client_id;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE] = data;
  logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = req.method_name;
  if (_.get(req, 'start_time_ms')) logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = req.query.trxn_id;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = req.headers['user-agent'];
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_RESPONSE_INVALID_ERROR;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errors.map(function(e) {return e.message}).join(",");
  Singleton.Logger.error(logData);
  throw new Error.RPCError({ err_type: Error.RPC_RESPONSE_INVALID_ERROR, err_message: errors.map(function(e) {return `${e.dataPath} ${e.message}`}).join(",") });
}

const applyAuthFunctions = (app, method_url, api_auth_config) => {

  if(api_auth_config) {
    let authFunction = Authentication[api_auth_config.method];
    if (!authFunction)
      throw new Error.RPCError({ err_type: Error.RPC_AUTH_ERROR, 
        err_message: `Wrong method passed in gateway.config.js, for auth` });
    app.use(method_url, authFunction(api_auth_config.options || {}));
    // TODO @pranavsid: Move audit context as a pre run middleware.
    if (api_auth_config.method === RPC_CONSTANTS.GATEWAY.MIDDLEWARE.AUTH_METHOD.GOOGLE_AUTHENTICATION) {
      app.use(method_url, AuditContext.getExpressMiddleware());
    }
  }
}

const multipartHandler = () => {
  return function multipartHandlerMiddleware(req, res, next) {
      const fileData = _.get(req, 'files.file') || null;
      _.set(req.body, 'multipart.file', fileData);
      next();
  }
}

const verifyAuthId = (service_id, auth_service_ids) => {
  return function verifyAuthIdMiddleware(req, res, next) {
      const passed_client_id = req.query.client_id;
      const user_agent = req.headers['user-agent'];
      if (_.isArray(auth_service_ids) && !_.includes(auth_service_ids, passed_client_id) && !_.includes(auth_service_ids, RPC_CONSTANTS.DEFAULT_AUTH)) {
        let logData = {};
        logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.CLIENT_ID] = passed_client_id;
        logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = req.method_name;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Date.now() - req.start_time_ms;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = req.trxn_id;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = user_agent;
        logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_AUTH_ERROR;
        logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = "client not authorized to query the service";
        Logger.error(logData);
        Slack.serverExceptionAlert(service_id, { method_name: req.method_name, trxn_id: req.trxn_id, error_type: Error.RPC_AUTH_ERROR })
        throw new Error.RPCError({ err_type: Error.RPC_AUTH_ERROR, err_message: `Invalid client id: ${passed_client_id}`});
      }
      next();
    };
}

