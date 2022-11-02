const callingServiceSchema = {
  "swagger": "2.0",
  "basePath": "/a-service",
  "info": {
    "description": "test schema",
    "version": "0",
    "title": "test schema"
  },
  "paths": {
    "/xyz": {
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

jest.mock('../../../../server/common/dependency_loader');

const Constants = require('../../../../constants');
jest.doMock('../../../../constants', () => {
  Constants.DEPENDENCY.CONFIG_PATH = '/test/unit/resources/dependency.config.test.data.js';
  return Constants;
});

jest.mock('../../../../package.json', () => {
  return {
    name: 'logging-service'
  };
});

const RpcFramework = require('../../../../index');
const CredentialManagement = require("../../../../credential_management");
jest.spyOn(CredentialManagement, 'initCredentials').mockImplementation(() => {
  return new Promise((resolve) => {
    resolve();
  });
});
jest.spyOn(RpcFramework, 'createServer').mockImplementation(() => {});
jest.spyOn(RpcFramework, 'initConfig').mockImplementation(() => {
  const RPCClientTestConstants = require('../../resources/constants').RPC_CLIENT;
  return {
    PORT: RPCClientTestConstants.INTERNAL.TEST_CALLED_SERVICE_PORT,
    AUTH_SERVICE_IDS:
      RPCClientTestConstants.INTERNAL.TEST_CALLED_SERVICE_AUTH_IDS
  };
});
jest.spyOn(RpcFramework, 'initLogger').mockImplementation(() => {
  return {
    info: jest.fn()
  };
});

const { Securitas } = require('../../../../dependency/securitas')
jest.spyOn(Securitas, 'initSecuritasClient').mockImplementation(() => {
  return new Promise((resolve) => {
    resolve();
  })
})

const serviceObject = require('../../../../schema/services/schema_object');
jest.spyOn(serviceObject, 'initDependencyClients').mockImplementation((Repo) => {
  const dependencySchemas = require('../../../../test/schema/dependency_schemas.json');
  const ChangeCase = require('change-case');
  Object.keys(dependencySchemas).forEach((serviceId) => {
    let schema = dependencySchemas[serviceId];
    if (schema.swagger != "2.0" ||
      schema.basePath != '/' + serviceId ||
      schema.info.title != ChangeCase.pascalCase(serviceId)) {
      throw { err_type: "schema_validation_failed" };
    }
    Repo.openapi[serviceId] = {};
    Repo.openapi[serviceId][schema.info.version] = {
      version: schema.info.version,
      service_name: ChangeCase.pascalCase(serviceId),
      schema: schema
    }
  })
})

jest.spyOn(serviceObject, 'initServiceClient').mockImplementation((serviceName, Repo) => {})
