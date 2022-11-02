import RateLimitResources from '../resources/rate-limit.test.data';
require('../mockers/rate_limit/rate-limit.mock');
import { RateLimit } from './../../../rate_limit/index';
describe('rate limit util', () => {

  const mockNextFunc = jest.fn().mockImplementation((params) => {
    if(params) {
      return 'failure';
    } else {
      return 'success'
    }
  });

  test('serverRateLimiter function request allowed', async function() {
    expect(await RateLimit.serverRateLimiter(RateLimitResources.testRequestObject, {}, mockNextFunc)).toBe('success');
    expect(mockNextFunc).toBeCalled();
  })

  test('serverRateLimiter function request not allowed', async function() {
    expect(await RateLimit.serverRateLimiter(RateLimitResources.testRequestObjectNotAllowed, {}, mockNextFunc)).toBe('failure');
    expect(mockNextFunc).toBeCalled();
  })
})