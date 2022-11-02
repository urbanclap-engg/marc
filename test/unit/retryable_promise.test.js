'use strict';

// Project specific mocks start
const testSetup = require('./test-loader')();
// Project specific mocks end

// Module imports start
const { Logger } = require('../../logging/standard_logger');
const retryablePromiseWrapper = require('../../retryable_promise');
// Module imports end

describe('test retryable promise', () => {
  beforeAll(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  function getTestRetryablePromise(testData) {
    let retryablePromise = retryablePromiseWrapper(
      testData.originalFunction,
      testData.maxRetries,
      testData.retryAfterMs,
      testData.backOffFactor,
      testData.shouldRetryOnError,
      testData.timeoutInMs
    );
    return retryablePromise;
  }

  test('resolve retryable promise in 1st attempt', async () => {
    // Arrange - arrange test data and expected result
    expect.assertions(1);
    let testData = {
      originalFunction: () => {
        return new Promise(resolve => {
          // resolve promise and return success
          resolve({ status: 'success' });
        });
      },
      maxRetries: 0,
      retryAfterMs: 0,
      backOffFactor: 0,
      shouldRetryOnError: false,
      timeoutInMs: 0
    };
    let retryablePromise = getTestRetryablePromise(testData);
    // Act - call function to be tested and receive result
    await retryablePromise().then(result => {
      // Assert - validate received result with expected result using `expect` matchers
      expect(result).toEqual({ status: 'success' });
    });
  });

  test('reject retryable promise with 100 ms timeout and do not retry', async () => {
    // Arrange - arrange test data and expected result
    expect.assertions(1);
    let testData = {
      originalFunction: () => {
        return new Promise(resolve => {
          // resolve promise in 500 ms
          setTimeout(resolve, 500);
        });
      },
      maxRetries: 0,
      retryAfterMs: 0,
      backOffFactor: 0,
      shouldRetryOnError: false,
      timeoutInMs: 100
    };
    let retryablePromise = getTestRetryablePromise(testData);

    // Act - call function to be tested and receive result
    await retryablePromise().catch(err => {
      // Assert - validate received result with expected result using `expect` matchers
      expect(err).toEqual({ message: 'Request timed out!' });
    });
  });

  test('reject retryable promise with 100 ms timeout and retry', async () => {
    // Arrange - arrange test data and expected result
    expect.assertions(2);
    let testData = {
      originalFunction: () => {
        return new Promise(resolve => {
          // resolve promise in 500 ms
          setTimeout(resolve, 500);
        });
      },
      maxRetries: 1,
      retryAfterMs: 100,
      backOffFactor: 0,
      shouldRetryOnError: true,
      timeoutInMs: 100
    };
    let retryablePromise = getTestRetryablePromise(testData);

    // Act - call function to be tested and receive result
    await retryablePromise().catch(err => {
      // Assert - validate received result with expected result using `expect` matchers
      expect(err).toEqual({ message: 'Request timed out!' });
    });

    // asserting Logger.error to be called twice due to error upon 1st try and next retry
    expect(Logger.error).toBeCalledTimes(4);
  });
});
