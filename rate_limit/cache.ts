import _ from 'lodash';
import LRU from 'lru-cache';
import { getSingleton } from '../singleton';
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE}  from '../logging/constants';
import { RateLimitUtil } from './util';
import { InfraUtil } from '../common/infra_util';
import { RateLimitCacheInterface } from './interface';

const Singleton = getSingleton();

// Initialization start
const MAX_CACHE_ENTRIES = 1000;
const DEFAULT_CACHE_ENTRY_MAX_AGE  = 60 * 1000;
const MIN_CONTAINER_COUNT = 1;
const tokenCache = new LRU({ max: MAX_CACHE_ENTRIES, maxAge:  DEFAULT_CACHE_ENTRY_MAX_AGE});
// Initialization end

const logInfo = (data) => {
  let logData = {};
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_RATE_LIMIT;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = "token_bucket_key";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = data['tokenBucketKey'];
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1] = "container_count";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1_VALUE] = data['containerCount'];
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_2] = "token_limit_per_container";
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_2_VALUE] = data['tokenLimit'];
  Logger.info(logData);
};

export const RateLimitCache: RateLimitCacheInterface = {
  isTokenAvailable: (key) => {
    const RateLimitPolicy = Singleton['RateLimitPolicy'];
    const timeWindowMs = RateLimitUtil.getTimeDuration(RateLimitPolicy.timeWindowUnit);
    const tokenBucket = tokenCache.get(key);
    if (!_.isUndefined(tokenBucket)) {
      if ((tokenBucket.timestamp + timeWindowMs) > Date.now() && tokenBucket.tokenCount <= 0 ) {
        return false;
      }
    }
    return true;
  },

  /**
 * Decrement request token count for this container. If tokens are not
 * available in cache calculate the container level token limit using global
 * requestLimit passed to the function.
 * @param key: cache key created using attribute defined in rateLimitPolicy
 * @param requestLimit: requestLimit set at the attribute level in
 * rateLimitPolicy
 * @returns {Promise<void>}
 */
  decrementTokens: async (key, requestLimit) => {
    let tokenBucket = tokenCache.get(key);
    const RateLimitPolicy = Singleton['RateLimitPolicy'];
    const timeWindowMs = RateLimitUtil.getTimeDuration(RateLimitPolicy.timeWindowUnit);
    if (!_.isUndefined(tokenBucket) && (tokenBucket.timestamp + timeWindowMs) > Date.now()) {
      tokenBucket.tokenCount = tokenBucket.tokenCount - 1;
    } else {
      const containerCount = await InfraUtil.getContainerCount();
      const tokenLimitPerContainer = _.round(requestLimit/ (containerCount | MIN_CONTAINER_COUNT));
      tokenBucket = {
        timestamp: Date.now(),
        tokenCount: (tokenLimitPerContainer - 1)
      };
      logInfo({'tokenBucketKey': key, 'containerCount': containerCount, 'tokenLimit': tokenLimitPerContainer});
    }
    tokenCache.set(key, tokenBucket, timeWindowMs);
  }
}
