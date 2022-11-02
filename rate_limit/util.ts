import _ from 'lodash';
import { getSingleton } from '../singleton';
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE} from '../logging/constants';
import Error from '../error';
import RateLimitConstants from './constants';
import { RateLimitUtilInterface } from './interface';

const Singleton = getSingleton();

const getRateLimitKey = (request, attribute) => {
  let key;
  switch(attribute) {
    case RateLimitConstants.RATE_LIMIT_ATTRIBUTE.API:
      const route = _.get(request._parsedUrl, 'pathname', _.get(request, 'base_url'));
      key = route.split('/'+Singleton.Config['SERVICE_ID'])[1];
      break;
    case RateLimitConstants.RATE_LIMIT_ATTRIBUTE.CLIENT:
      key = _.get(request, 'query.client_id');
      key = key ? key : _.get(request.headers, 'x-device-os');
      if (!key) {
        if (_.includes(_.get(request.headers, 'user-agent'), 'Android')) {
          key = 'android';
        } else if(_.includes(_.get(request.headers, 'user-agent'), 'iPhone')) {
          key = 'ios';
        } else if (_.includes(_.get(request.headers, 'user-agent'), 'Mozilla')) {
          key = 'web';
        }
      }
      break;
    case RateLimitConstants.RATE_LIMIT_ATTRIBUTE.HEADER_SOURCE:
      key = _.get(request.headers, 'source');
  }
  return key;
};

export const RateLimitUtil: RateLimitUtilInterface = {
  logError: (request, rateLimitPolicy, message) => {
    let logData = {};
    let nestedRateLimitKey;
    for(const attribute of  RateLimitConstants.RATE_LIMIT_HIERARCHY) {
      const rateLimitKey = attribute + ":" + getRateLimitKey(request, attribute);
      nestedRateLimitKey = nestedRateLimitKey ? nestedRateLimitKey + "|" + rateLimitKey : rateLimitKey;
    }
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_RATE_LIMIT;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = "rate_limit_key";
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = nestedRateLimitKey;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = "rate_limit_policy";
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = JSON.stringify(rateLimitPolicy);
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RATE_LIMITER_ERROR;
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = message;
    Logger.error(logData);
  },

  logInfo: (request, rateLimitPolicy) => {
    let logData = {};
    let nestedRateLimitKey;
    for(const attribute of  RateLimitConstants.RATE_LIMIT_HIERARCHY) {
      const rateLimitKey = attribute + ":" + getRateLimitKey(request, attribute);
      nestedRateLimitKey = nestedRateLimitKey ? nestedRateLimitKey + "|" + rateLimitKey : rateLimitKey;
    }
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_RATE_LIMIT;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = "rate_limit_key";
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = nestedRateLimitKey;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = "rate_limit_policy";
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = JSON.stringify(rateLimitPolicy);
    Logger.info(logData);
  },

  getTokenBucketKey: (request, rateLimitAttribute) => {
    let tokenBucketKey;
    for(const attribute of  RateLimitConstants.RATE_LIMIT_HIERARCHY) {
      const key = getRateLimitKey(request, attribute);
      if (!key) return key;
      else if(!tokenBucketKey) tokenBucketKey = key;
      else tokenBucketKey += '::' + getRateLimitKey(request, attribute);
      if (attribute == rateLimitAttribute) break;
    }
    return tokenBucketKey;
  },

  getRateLimit: (request, attribute, rateLimitPolicy) => {
    let rateLimits = _.get(rateLimitPolicy, 'rateLimits');
    let rateLimit;
    for (let attr of RateLimitConstants.RATE_LIMIT_HIERARCHY) {
      const rateLimitKey = getRateLimitKey(request, attr);
      rateLimit = rateLimits ? _.filter(rateLimits, rateLimit => rateLimit.key == rateLimitKey)[0] : undefined;
      if (attr == attribute) {
        return rateLimit;
      }
      rateLimits = _.get(rateLimit, 'rateLimits');
    }
    return rateLimit;
  },

  getTimeDuration: timeWindowUnit => {
    let timeDurationMs;
    switch (timeWindowUnit) {
      case RateLimitConstants.TIME_WINDOW_UNIT.MINUTE:
        timeDurationMs = 60 * 1000;
        break;
      case RateLimitConstants.TIME_WINDOW_UNIT.HOUR:
        timeDurationMs = 60 * 60 * 1000;
        break;
      default:
        timeDurationMs = 60 * 1000;
    }
    return timeDurationMs;
  }
}
