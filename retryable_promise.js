'use strict';

const { Logger } = require('./logging/standard_logger');
const { LOG_CONSTANTS } = require('./logging/constants');
var Promise = require('bluebird');

const LOG_TYPE = 'RETRYABLE_PROMISE_FAILURE';

const DEFAULT_BACKOFF_DELAY_MS = 0;
const DEFAULT_RETRY_AFTER_MS = 100;
const DEFAULT_BACKOFF_MULTIPLIER = 1;
const DEFAULT_MAX_RETRIES = 0;
const DEFAULT_RETRIES = 0;
const DEFAULT_TIMEOUT_IN_MS = 0;


var RetryablePromise = function (maxRetries, retryAfterMs, backOffMultiplier, shouldRetryOnError, timeoutInMs) {

    if (typeof retryAfterMs === 'number' && retryAfterMs > 0) {
        this.retryAfterMs = retryAfterMs;
    }
    if (typeof backOffMultiplier === 'number' && backOffMultiplier >= 1) {
        this.backOffMultiplier = backOffMultiplier;
    }
    if (typeof maxRetries === 'number' && maxRetries >= 0) {
        this.maxRetries = maxRetries;
    }
    if (typeof shouldRetryOnError === 'function'){
        this.shouldRetryOnError = shouldRetryOnError;
    }
    if (typeof timeoutInMs === 'number' && timeoutInMs > 0) {
        this.timeoutInMs = timeoutInMs;
    }
};

// Defaults
RetryablePromise.prototype.backOffDelayMs = DEFAULT_BACKOFF_DELAY_MS
RetryablePromise.prototype.retryAfterMs = DEFAULT_RETRY_AFTER_MS;
RetryablePromise.prototype.backOffMultiplier = DEFAULT_BACKOFF_MULTIPLIER;
RetryablePromise.prototype.maxRetries = DEFAULT_MAX_RETRIES;
RetryablePromise.prototype.shouldRetryOnError = function() {return true;};
RetryablePromise.prototype.retries = DEFAULT_RETRIES;
RetryablePromise.prototype.timeoutInMs = DEFAULT_TIMEOUT_IN_MS;


RetryablePromise.prototype.calculateBackOff = function () {
    if (this.retries === 1) {
        return Math.floor(this.retryAfterMs * this.backOffMultiplier);
    } else {
        return Math.floor(this.backOffDelayMs * this.backOffMultiplier);
    }
};

function getErrorDetails(err) {
    const errorDetails = {};
    if (err.error === 'object') {
        errorDetails['errorMsg'] = err.error.err_message || err.message;
        errorDetails['errorType'] = err.error.err_type || LOG_TYPE;
    } else {
        errorDetails['errorMsg'] = err.message;
        errorDetails['errorType'] = LOG_TYPE;
    }
    return errorDetails;
}

RetryablePromise.prototype.run = function (originalFunction, retries, ...args) {
    var self = this;
    return delay(this.backOffDelayMs)
        .then(function () {
            return Promise.resolve().then(() => {
                if (retries < 1 && args && args.length > 0 && args[0].headers){
                    args[0].headers['start_time_ms'] = Date.now();
                }
                if(self.timeoutInMs) {
                    return runOriginalFuncWithTimeout(originalFunction, self.timeoutInMs, ...args);
                }
                else {
                    return originalFunction(...args);
                }
            })
        }).catch(function (err) {
            if(self.maxRetries === 0) throw err;
            retries = retries + 1;
            return Promise.resolve()
            .then(function () {

                const errorDetails = getErrorDetails(err);
                Logger.error({
                    [LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]: LOG_TYPE,
                    [LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE]: args && args.length > 0 && args[0].headers ?
                      `Error occurred while calling service: ${args[0].headers.external_service_id}`:
                      'Error occurred while calling original function',
                    [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE]: errorDetails['errorMsg'],
                    [LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE]: errorDetails['errorType']
                });
                if (!self.shouldRetryOnError(err)) {
                    throw err;
                }
                self.backOffDelayMs = self.calculateBackOff();
                if (retries > self.maxRetries) {
                    Logger.error({
                        [LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]: LOG_TYPE,
                        [LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE]: `Max Retry occurred`,
                        [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE]: errorDetails['errorMsg'],
                        [LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE]: errorDetails['errorType']
                    });
                    throw err;
                } else {
                    var logData = {};
                    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE;
                    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = "retry_attempt";
                    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = retries.toString();
                    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errorDetails['errorMsg'];
                    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = errorDetails['errorType'];
                    Logger.error(logData);
                    return self.run(originalFunction, retries, ...args);
                }
            })
        });
};


/**
 * Wraps a function that returns a promise into a retryable promise.
 * It also accepts a few retry options.
 *
 * @param originalFunction A function must return a promise.
 * @param retries Number of retires. The first attempt is not a retry.
 * @param retryAfterMs. Delay in milliseconds before the retry.
 * @param backOffFactor. Exponential back off multiplier.
 * @param shouldRetryOnError. A function that based on error can evaluate a retry should happen or not.
 */
function retryablePromiseWrapper(originalFunction, retries, retryAfterMs, backOffFactor, shouldRetryOnError, timeoutInMs = 0){

    let retryablePromise = new RetryablePromise(retries, retryAfterMs, backOffFactor, shouldRetryOnError, timeoutInMs);

    function decoratedFunction(...args){
        return retryablePromise.run(originalFunction, 0, ...args);
    }

    return decoratedFunction;
}

function delay(timeInMs) {
    return new Promise(function(resolve) {
        setTimeout(resolve, timeInMs);
    });
}

function timeoutDelay (timeInMs) {
    let err_msg = {
        message: "Request timed out!"
    }
    return new Promise(function(resolve, reject) { 
        setTimeout(reject.bind(null, err_msg), timeInMs)
    });
}

let runOriginalFuncWithTimeout = (originalFunc, timeout, ...args) => {
    return Promise.race([originalFunc(...args), timeoutDelay(timeout)]);
};

module.exports = retryablePromiseWrapper;
