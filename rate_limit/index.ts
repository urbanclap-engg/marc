import _ from 'lodash';
import { getSingleton } from '../singleton';
import RateLimitConstants from './constants';
import RpcConstants from '../constants';
import Error from '../error';
import { RateLimitUtil } from './util';
import { RateLimitInterface } from './interface';

const Singleton = getSingleton();

export const RateLimit: RateLimitInterface = {
  serverRateLimiter: async (req, res, next) => {
    try {
      // If rateLimit dependency is not initialized allow the request
      const rateLimitPolicy = Singleton['RateLimitPolicy'];
      if (!rateLimitPolicy) {
        return next();
      }
      // Initialize token cache
      const { RateLimitCache } = require('./cache');
      /*
        Allow the request if any one of the below condition matches
        1. rateLimit does not exist
        2. rateLimit exists but requestLimit is undefined for the attribute
        3. tokens are available in the cache
        If none of the above conditions meet reject the request with 429
        status code
       */
      const isRequestAllowed = RateLimitConstants.RATE_LIMIT_HIERARCHY.every((attribute) => {
        const rateLimit = RateLimitUtil.getRateLimit(req, attribute, rateLimitPolicy);
        if (!_.isUndefined(_.get(rateLimit, 'requestLimit'))) {
          if (rateLimit.requestLimit <= 0 || !RateLimitCache.isTokenAvailable(RateLimitUtil.getTokenBucketKey(req, attribute))) {
            return false;
          }
        }
        return true;
      });
  
      if (isRequestAllowed) {
        /*
         Decrement token count for each tokenBucketKey against
         attributes mentioned in RateLimitConstants.RATE_LIMIT_HIERARCHY
        */
        for (const attribute of RateLimitConstants.RATE_LIMIT_HIERARCHY) {
          const rateLimit = RateLimitUtil.getRateLimit(req, attribute, rateLimitPolicy);
          const requestLimit = _.get(rateLimit, 'requestLimit');
          if (requestLimit) {
            RateLimitCache.decrementTokens(RateLimitUtil.getTokenBucketKey(req, attribute), requestLimit);
          }
        }
      } else  {
        RateLimitUtil.logInfo(req, rateLimitPolicy);
        return next(new Error.RPCError({
          err_type: Error.REQUEST_RATE_LIMITED,
          err_message: "Too many requests",
          code: RpcConstants.HTTP_RESPONSE_CODE_TOO_MANY_REQUESTS
        }));
      }
    } catch (error) {
      RateLimitUtil.logError(req, Singleton['RateLimitPolicy'], 'Error::'+JSON.stringify(error));
    }
    return next();
  }
};
