import _ from 'lodash';
import RPC_CONSTANTS from '../../constants';
import { Logger } from '../../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import { getSingleton } from '../../singleton';
import { getLocalizedResponse } from '../../localisation/middleware';
import { PostApiMiddlewareInterface } from './interface';

const Singleton = getSingleton();


export const PostApiMiddleware: PostApiMiddlewareInterface = {
  initPostRunMiddleware: (app, method_url, method_path, options) => {
    if (Singleton.GATEWAY_CONFIG) {
      initLocalisationMiddleware(app, method_url, method_path);
    }
  }
}

//Logic for internal use

const initLocalisationMiddleware = (app, method_url, method_path) => {
  try {

      const localisationOptions = _.get(Singleton.GATEWAY_CONFIG, `api.${method_path}.${RPC_CONSTANTS.GATEWAY.MIDDLEWARE.TYPE.LOCALISATION}`);
      
      if (localisationOptions && (typeof localisationOptions === "boolean" || (typeof localisationOptions === "object" && localisationOptions.isAllowed))) {
        
        // localize the success response.
        app.use(method_url, function localisationMiddleware(req, res, next) {
          req.headers["localisation-options"] = localisationOptions;
          getLocalizedResponse(null, req, res, next)
        });
        
        // localize the error response
        app.use(method_url, function localisationMiddleware(err, req, res, next) {
          req.headers["localisation-options"] = localisationOptions;
          getLocalizedResponse(err, req, res, next)
        });
        
      }
  } catch (error) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'initLocalisationMiddlewareError';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] =  JSON.stringify(error);
      Logger.info(logData);
      throw error;
  }
  
}
