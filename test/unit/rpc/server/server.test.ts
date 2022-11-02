'use strict';

// Project specific mocks start
const testSetup = require('../../test-loader')();
// Project specific mocks end

// Module imports start
require('../../../../logging/standard_logger');
import _ from 'lodash';
import Constants from '../../resources/constants';
import TestSchemas from '../../resources/schema.test.data.json';
import Service from '../../resources/service.test.data';
jest.mock('@uc-engg/openapi-validator-middleware');
import swaggerValidation from '@uc-engg/openapi-validator-middleware';
//import supertest from 'supertest';
const app = testSetup.mock;
// Module imports end

import { RpcServer } from '../../../../rpc/server';
import { Middleware } from '../../../../middleware';
const monitoringMiddleware = Middleware.monitoringMiddleware;
const serverMiddleware = Middleware.serverMiddleware;

describe('test rpc server with correct schema', () => {
  let testData;
 
  beforeAll(() => {
    testData = {
      service_id: Constants.RPC_SERVER.TEST_SERVICE_ID,
      auth_service_ids: Constants.RPC_SERVER.TEST_SERVICE_AUTH_IDS,
      schema: TestSchemas.CorrectSchema,
      service: Service,
      port: Constants.RPC_SERVER.TEST_SERVICE_PORT
    };
    swaggerValidation.init = jest.fn().mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  function initTestServer(RpcServer, testData) {
    return RpcServer.createServer(
      testData.service_id,
      testData.auth_service_ids,
      testData.schema,
      testData.service,
      testData.port
    );
  }

  test('create server and attach event handler', () => {
    // Arrange - arrange test data and expected result
    expect.assertions(12);

    //Spy for different middlewares
    const exposeOpenapiRpcMetricsSpy = jest.spyOn(monitoringMiddleware, 'exposeOpenapiRpcMetrics');
    const exposeApplicationMetricsSpy = jest.spyOn(monitoringMiddleware, 'exposeApplicationMetrics');
    const monitorMiddlewaresSpy = jest.spyOn(monitoringMiddleware, 'monitorMiddlewares');
    const healthCheckSpy = jest.spyOn(monitoringMiddleware, 'healthCheck');
    const getDBDetailsSpy = jest.spyOn(serverMiddleware, 'getDBDetails');
    const isInternalServiceAuthenticatedSpy = jest.spyOn(serverMiddleware, 'isInternalServiceAuthenticated');
    const getEventDataConfigSpy = jest.spyOn(serverMiddleware, 'getEventDataConfig');
    const triggerProfilerSpy = jest.spyOn(serverMiddleware, 'triggerProfiler');
    const handleUndefinedRouteErrorSpy = jest.spyOn(serverMiddleware, 'handleUndefinedRouteError');
    const handleApiErrorSpy = jest.spyOn(serverMiddleware, 'handleApiError');

    // Act - call function to be tested and receive result
    initTestServer(RpcServer, testData);

    // Assert - validate received result with expected result using `expect` matchers
    expect(app.listen).toHaveBeenCalled();
    expect(app.use).toHaveBeenCalled();
    expect(exposeOpenapiRpcMetricsSpy).toHaveBeenCalledTimes(1);
    expect(exposeApplicationMetricsSpy).toHaveBeenCalledTimes(1);
    expect(monitorMiddlewaresSpy).toHaveBeenCalledTimes(1);
    expect(healthCheckSpy).toHaveBeenCalledTimes(1);
    expect(getDBDetailsSpy).toHaveBeenCalledTimes(1);
    expect(isInternalServiceAuthenticatedSpy).toHaveBeenCalledTimes(1);
    expect(getEventDataConfigSpy).toHaveBeenCalledTimes(1);
    expect(triggerProfilerSpy).toHaveBeenCalledTimes(1);
    expect(handleUndefinedRouteErrorSpy).toHaveBeenCalledTimes(1);
    expect(handleApiErrorSpy).toHaveBeenCalledTimes(1);
    // jest.restoreAllMocks();
  });

  // xtest('create server and pass healthcheck', async done => {
  //   // Arrange - arrange test data and expected result
  //   jest.unmock('express');
  //   const express = require('express');
  //   const app = express();
  //   express.prototype.listen = jest.fn(() => {
  //     console.log('listening.................');
  //     return {};
  //   });
  //   // jest.spyOn(app, 'listen').mockImplementation(() => {
  //   // 	console.log('listening.................');
  //   // 	return {};
  //   // });
  //   console.log(app);
  //   const expresss = require('express');
  //   console.log(expresss());
  //   const RpcServer = require('../../../../rpc/server');

  //   // Act - call function to be tested and receive result
  //   const testApp = initTestServer(RpcServer, testData);
  //   const httpResponse = await supertest(testApp).get('/healthcheck');

  //   // Assert - validate received result with expected result using `expect` matchers
  //   expect(app.listen).toHaveBeenCalled();
  //   expect(httpResponse.status).toBe(200);
  //   expect(httpResponse.body.message).toEqual('health check passed!!!');
  //   done();
  // });
});
describe('test rpc server with incorrect schema', () => {
  let testData;

  beforeAll(() => {
    testData = {
      service_id: Constants.RPC_SERVER.TEST_SERVICE_ID,
      auth_service_ids: Constants.RPC_SERVER.TEST_SERVICE_AUTH_IDS,
      service: Service,
      port: Constants.RPC_SERVER.TEST_SERVICE_PORT
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  function initTestServer(RpcServer, testData) {
    return RpcServer.createServer(
        testData.service_id,
        testData.auth_service_ids,
        testData.schema,
        testData.service,
        testData.port
    );
  }

  test('create server should fail with error: rpc_method_not_implemented_error', () => {
    // Arrange - arrange test data and expected result
    expect.assertions(1);

    testData['schema'] = TestSchemas.SchemaWithMethodNotImplemented;
    // Act - call function to be tested and receive result
    try{
      initTestServer(RpcServer, testData);
    }catch(err){
      expect(err.err_type).toEqual('rpc_method_not_implemented_error');
    }
  });

  test('create server should fail with error: rpc_invalid_method_path_error', () => {
    // Arrange - arrange test data and expected result
    expect.assertions(1);

    testData['schema'] = TestSchemas.SchemaWithMoreThanTwoGroups;
    // Act - call function to be tested and receive result
    try{
      initTestServer(RpcServer, testData);
    }catch(err){
      expect(err.err_type).toEqual('rpc_invalid_method_path_error');
    }
  });
});
