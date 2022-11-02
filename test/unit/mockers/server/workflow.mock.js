jest.mock('../../../../server/common/dependency_loader');

const Constants = require('../../../../constants');
jest.doMock('../../../../constants', () => {
  Constants.DEPENDENCY.CONFIG_PATH =
    '/test/unit/resources/dependency.config.test.data.js';
  return Constants;
});

jest.mock('../../../../package.json', () => {
  return {
    name: 'logging-service'
  };
});
jest.mock('../../../../dependency/mycroft_monitoring');
jest.mock('../../../../schema/services/schema_object');
const RpcFramework = require('../../../../index');
const CredentialManagement = require("../../../../credential_management");
jest.spyOn(CredentialManagement, 'initCredentials').mockImplementation(() => {
  return new Promise((resolve) => {
    resolve();
  });
});
jest.spyOn(RpcFramework, 'createServer').mockImplementation(() => {});
jest.spyOn(RpcFramework, 'initConfig').mockImplementation(() => {
  const RPCClientTestConstants = require('../../resources/constants')
    .RPC_CLIENT;
  return {
    PORT: RPCClientTestConstants.INTERNAL.TEST_CALLED_SERVICE_PORT,
    AUTH_SERVICE_IDS:
      RPCClientTestConstants.INTERNAL.TEST_CALLED_SERVICE_AUTH_IDS
  };
});
const { Securitas } = require('../../../../dependency/securitas')
jest.spyOn(Securitas, 'initSecuritasClient').mockImplementation(() => {
  return new Promise((resolve) => {
    resolve();
  })
})


const Logger = {
  info: jest.fn(),
  error: jest.fn()
};
jest.spyOn(RpcFramework, 'initLogger').mockImplementation(() => {
  return Logger;
});

process.argv = ['node', './src/workflow', 'deactivate_users', '{}', new Date(), '1 * * * *', '1']
