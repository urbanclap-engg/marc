'use strict';

// Project specific mocks start
jest.mock('../../../dependency/mycroft_monitoring');
const testSetup = require('../test-loader')();
// Project specific mocks end

// Module imports start
import RpcFramework from '../../../index';
import * as CredentialManagement from '../../../credential_management';
import { Service } from '../../../server/service';
import { DependencyLoader } from '../../../server/common/dependency_loader';

require('../../../package.json');
// Module imports end

describe('test service', () => {
  let service;

  beforeAll(() => {
    // Arrange - arrange test data and expected result
    service = new Service(RpcFramework);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initialize dependencies of a service', async () => {
    // Act - call function to be tested and receive result
    await service.initDependency();

    // Assert - validate received result with expected result using `expect` matchers
    expect(CredentialManagement.initCredentials).toBeCalled();
    expect(DependencyLoader.init).toBeCalled();
  });

  test('initialize nodejs server for a service', async () => {
    // Act - call function to be tested and receive result
    await service.initServer({});

    // Assert - validate received result with expected result using `expect` matchers
    expect(RpcFramework.createServer).toBeCalled();
  });
});
