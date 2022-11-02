import RateLimitResources from '../resources/rate-limit.test.data';
require('../mockers/rate_limit/rate-limit.mock');
import { RateLimitUtil } from './../../../rate_limit/util';
import { Logger } from '../../../logging/standard_logger';
describe('rate limit util', () => {

  test('getTimeDuration function for minute timeWindow', function() {
    expect(RateLimitUtil.getTimeDuration('minute')).toBe(60000);
  })

  test('getTimeDuration function for hour timeWindow', function() {
    expect(RateLimitUtil.getTimeDuration('hour')).toBe(3600000);
  })

  test('getTimeDuration function for invalid timeWindow', function() {
    expect(RateLimitUtil.getTimeDuration('hr')).toBe(60000);
  })

  test('getRateLimit function for api level policy', function() {
    expect(RateLimitUtil.getRateLimit(RateLimitResources.testRequestObject, 'api', RateLimitResources.testRateLimitPolicyAPILevel).requestLimit).toBe(RateLimitResources.testRateLimitPoliciesAPILevel.rateLimits[0].requestLimit);
  })

  test('getRateLimit function for client level policy', function() {
    expect(RateLimitUtil.getRateLimit(RateLimitResources.testRequestObject, 'client', RateLimitResources.testRateLimitPolicyClientLevel).requestLimit).toBe(RateLimitResources.testRateLimitPolicyClientLevel.rateLimits[0].rateLimits[0].requestLimit);
  })

  test('getRateLimit function for source level policy', function() {
    expect(RateLimitUtil.getRateLimit(RateLimitResources.testRequestObject, 'source', RateLimitResources.testRateLimitPolicySourceLevel).requestLimit).toBe(RateLimitResources.testRateLimitPolicySourceLevel.rateLimits[0].rateLimits[0].rateLimits[0].requestLimit);
  })

  test('getRateLimit function for client web(policy not present)', function() {
    expect(RateLimitUtil.getRateLimit(RateLimitResources.testRequestObjectWithoutClientId, 'test', RateLimitResources.testRateLimitPolicyClientLevel)).toBe(undefined);
  })

  test('getRateLimit function for client ios(policy not present)', function() {
    let testRequestObject = RateLimitResources.testRequestObjectWithoutClientId;
    testRequestObject.headers['user-agent'] = 'iPhone';
    expect(RateLimitUtil.getRateLimit(testRequestObject, 'test', RateLimitResources.testRateLimitPolicyClientLevel)).toBe(undefined);
  })

  test('getRateLimit function for client Android(policy not present)', function() {
    let testRequestObject = RateLimitResources.testRequestObjectWithoutClientId;
    testRequestObject.headers['user-agent'] = 'Android';
    expect(RateLimitUtil.getRateLimit(testRequestObject, 'test', RateLimitResources.testRateLimitPolicyClientLevel)).toBe(undefined);
  })

  test('logError function', function() {
    RateLimitUtil.logError(RateLimitResources.testRequestObject, RateLimitResources.testRateLimitPolicySourceLevel, 'test error');
    expect(Logger.error).toBeCalled();
  })

  test('logInfo function', function() {
    RateLimitUtil.logInfo(RateLimitResources.testRequestObject, RateLimitResources.testRateLimitPolicySourceLevel);
    expect(Logger.info).toBeCalled();
  })

  test('getTokenBucketKey function for source level policy', function() {
    expect(RateLimitUtil.getTokenBucketKey(RateLimitResources.testRequestObject, 'source')).toBe('/pushLogs::service-market::google')
  })

  test('getTokenBucketKey function with invalid attribute', function() {
    expect(RateLimitUtil.getTokenBucketKey(RateLimitResources.testRequestObjectEmptyHeaders, 'source')).toBe(undefined);
  })

})