export interface RateLimitCacheInterface {
  isTokenAvailable(key): boolean;
  decrementTokens(key, requestLimit): Promise<void>;
}

export interface RateLimitInterface {
  serverRateLimiter(req, res, next): Promise<any>;
}

export interface RateLimitUtilInterface {
  logError(request, rateLimitPolicy, message): void;
  logInfo(request, rateLimitPolicy): void;
  getTokenBucketKey(request, rateLimitAttribute): any;
  getRateLimit(request, attribute, rateLimitPolicy): any;
  getTimeDuration(timeWindowUnit): any;
}
