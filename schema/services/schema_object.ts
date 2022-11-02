import _ from 'lodash';
import RPC_CONSTANTS from '../../constants';
import * as ChangeCase from 'change-case';
import { ScriptUtils } from '../../scripts/common/script-utils';
import path from 'path';


const SERVICE_PARENT_DIR = _.split(RPC_CONSTANTS.REPO_DIR_PATH, 'node_modules')[0];

const initDependencyClients = (Repo) => {
  let platformConfig = ScriptUtils.getServicePlatformConfig();
  let serviceDependencyPath = _.get(platformConfig, 'serviceDependencySchema.properties.generatedSchemaFilePath', 'node_modules/dependency_schemas.json');

  const dependencySchemas = require(path.join(SERVICE_PARENT_DIR + '/' + serviceDependencyPath));
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
}

const initServiceClient = (serviceName, Repo) => {
  let serviceSchema = require(SERVICE_PARENT_DIR + '/schema/service_schema.json');
  if (serviceSchema.swagger != "2.0" ||
      serviceSchema.basePath != '/' + serviceName ||
      serviceSchema.info.title != ChangeCase.pascalCase(serviceName)) {
    throw { err_type: "schema_validation_failed" };
  }
  Repo.openapi[serviceName] = {};
  Repo.openapi[serviceName][serviceSchema.info.version] = {
    version: serviceSchema.info.version,
    service_name: ChangeCase.pascalCase(serviceName),
    schema: serviceSchema
  }
}

export {
  initDependencyClients,
  initServiceClient
}