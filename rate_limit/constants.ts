const CONSTANTS = {
  RATE_LIMIT_ATTRIBUTE : {
    API: 'api',
    CLIENT: 'client',
    HEADER_SOURCE: 'source'
  },
  TIME_WINDOW_UNIT : {
    MINUTE: 'minute',
    HOUR: 'hour'
  },
  CACHE_BUCKET_NAME: 'rate-limit',
  RATE_LIMIT_HIERARCHY : ['api', 'client', 'source']
};

export default CONSTANTS;
