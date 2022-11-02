'use strict';

// Project specific mocks start
const testSetup = require('../test-loader')();
// Project specific mocks end

// Module imports start
import { Validator as JsonValidator } from 'jsonschema';
import { Mongodb as MongoDBInitializer } from '../../../dependency/mongodb';
import { Events as EventsConsumerInitializer } from '../../../dependency/events';
import Error from '../../../error';
import { DependencyLoader } from '../../../server/common/dependency_loader';
import DependencyConfig from '../resources/dependency.config.test.data';
import RpcFramework from '../../../index';
// Module imports end

describe('test dependency loader', () => {
  let dependencyConfig;
  let JsonValidatorSpy;
  const VALIDATION_ERROR_MESSAGE = {
    message: 'Dependency validation failed. Exiting..'
  };

  beforeAll(() => {
    // Arrange - arrange test data and expected result
    dependencyConfig = DependencyConfig.Config.service;
    JsonValidatorSpy = jest.spyOn(JsonValidator.prototype, 'validate');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initialize single dependency', async () => {
    // Act - call function to be tested and receive result
    await DependencyLoader.init(RpcFramework, dependencyConfig);

    // Assert - validate received result with expected result using `expect` matchers
    expect(JsonValidatorSpy).toBeCalledTimes(2);
    expect(EventsConsumerInitializer.initEventConsumer).toBeCalled();
  });

  test('initialize array of dependencies', async () => {
    // Act - call function to be tested and receive result
    await DependencyLoader.init(RpcFramework, dependencyConfig);

    // Assert - validate received result with expected result using `expect` matchers
    expect(JsonValidatorSpy).toBeCalledTimes(2);
    expect(MongoDBInitializer.initMongodbClient).toBeCalledTimes(1);
  });

  test('throw error while initializing a dependency with invalid schema', async () => {
    // Arrange - arrange test data and expected result
    JsonValidatorSpy.mockReturnValue(() => {
      return ({
        valid: false
      });
    });

    // Act - call function to be tested and receive result
    try {
      await DependencyLoader.init(RpcFramework, dependencyConfig);
    } catch (error) {
      // Assert - validate received result with expected result using `expect` matchers
      expect(JsonValidatorSpy).toBeCalledTimes(1);
      expect(error).toBeInstanceOf(Error.RPCError)
    }
  });
});
