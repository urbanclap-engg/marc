export interface RateLimit {
  id: string;
  options?: RateLimitOptions;
}

interface RateLimitOptions {
  useEndPoint?: boolean;
  endPoint?: RateLimitEndPoint;
  useStaticConfig?: boolean;
  rateLimitPolicy?: ClientMap;
}

interface RateLimitEndPoint{
  url: string;
  authToken?: string;
  body?: object;
}
