'use strict';

const calledServiceSchema = {
  "swagger": "2.0",
  "basePath": "/b-service",
  "info": {
    "description": "test schema",
    "version": "0",
    "title": "test schema"
  },
  "paths": {
    "/abc": {
      "post": {
        "summary": "test api",
        "consumes": [
          "application/json"
        ],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": "Request body for test method.",
            "required": true,
            "schema": {
              "$ref": "#/definitions/request"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Response body for pushLogs",
            "schema": {
              "$ref": "#/definitions/response"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "response": {
      "type": "object"
    },
    "request": {
      "type": "object"
    }
  }
};

const apiCircuitBreakerOptions = {
  api_config: {
    abc: {
      CIRCUIT_BREAKER_OPTIONS: {
        ENABLE: true,
        TIMEOUT: 2000
      }
    }
  }
};

const mockRequestPromiseModule = () => {
  jest.mock('request-promise', () => (args) => {
    const Promise = require('bluebird');
    let promiseExecutor = (resolve, reject) => {resolve({body:{}});};
    return {
      promise: () => (new Promise(promiseExecutor))
    };
  });
};

const mockSingleton = () => {
  jest.mock('../../../../singleton', () => {
    const originalModule = jest.requireActual('../../../../singleton');
    return {
      ...originalModule,
      getSingleton: () => ({
        Logger: {
          info: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        event_producer: {
          sendEvent: jest.fn(() => ({ 'status': 'ok' }))
        }
      })
    };
  });
}

const mockCircuitBreaker = () => {
  jest.mock('@uc-engg/armor', () => (args) => {
    const Promise = require('bluebird');
    let promiseExecutor = (resolve, reject) => {resolve({body:{}});};
    return {
      initCircuitBreaker : () => ({execute : () => new Promise(promiseExecutor)})
    };
  });
}

const setupAllMocks = () => {
  mockSingleton();
  mockRequestPromiseModule();
  jest.doMock('../../../../logging/standard_logger');
}

export {
  calledServiceSchema,
  apiCircuitBreakerOptions,
  mockSingleton,
  mockRequestPromiseModule,
  mockCircuitBreaker,
  setupAllMocks
};