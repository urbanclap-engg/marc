'use strict'

/*******
 * Utility to convert swagger schemas to type declaration files
 */
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { ScriptUtils } from '../../common/script-utils';
import { ConfigUtils } from '../../../common/config_utils';
const PARENT_SERVICE_PACKAGE_JSON = require(ConfigUtils.getParentWorkingDir() + '/package.json');
import ServiceSchemaDtl from './dependency_schema_provider';
import CONSTANTS from '../../common/constants';
const GLOBAL_CONFIG = CONSTANTS.GLOBAL_CONFIG;
const MONOLITH_SERVICES = CONSTANTS.MONOLITH_SERVICES;
const CURRENT_SERVICE_NAME = PARENT_SERVICE_PACKAGE_JSON.name;
import { dependencyParser, globalConfigParser } from "./parse_config";

// Temporary workaround till every service onboad dependency.config to ts
let DEPENDENCY_CONFIG_PATH = ConfigUtils.getParentWorkingDir() + '/configs/dependency.config';
if(fs.existsSync(ConfigUtils.getParentWorkingDir() + '/configs/dependency.config.ts')){
  DEPENDENCY_CONFIG_PATH = ConfigUtils.getParentWorkingDir() + '/dist/configs/dependency.config';
}


const fetchSchemasForMicroservices = async () => {

  let dependentServices;
  let functionSequence = [
    {
      function: dependencyParser.requireDependencyConfig,
      arguments: [DEPENDENCY_CONFIG_PATH]
    },
    {
      function: dependencyParser.parseDependencyConfig,
      arguments: [DEPENDENCY_CONFIG_PATH]
    },
    {
      function: dependencyParser.grepDependencyConfig,
      arguments: [DEPENDENCY_CONFIG_PATH]
    },
  ]
  const failureMessage = `Unable to parse the dependency config for ${CURRENT_SERVICE_NAME}`;
  try {
    dependentServices = await tryInSequence(functionSequence);
  } catch(err) {
    console.log(failureMessage);
    console.log(err);
  }
  await fetchAndStoreSchemas(dependentServices);
}

const fetchSchemasForMonoliths = async () => {
  let dependentServices;
  const globalConfigPath = path.join(ConfigUtils.getParentWorkingDir(), GLOBAL_CONFIG.RELATIVE_PATH_FROM_ROOT);
  try {
    dependentServices = await globalConfigParser.parseGlobalConfig(globalConfigPath);
  } catch (err) {
    const errMsg = `Unable to parse the global config: ${JSON.stringify(err)}`;
    console.log(errMsg);
  }
  await fetchAndStoreSchemas(dependentServices);
}

const fetchSchemasForOarpc = async () => {
  const dependentServices = require(ConfigUtils.getParentWorkingDir() + '/test/configs/dependency.config.js').Config.service.internal_service;
  await fetchAndStoreSchemas(dependentServices);
}

const fetchAndStoreSchemas = async (dependentServices: any) => {
  let report: {[k:string]: any} = {};
  dependentServices = ScriptUtils.addOtherDependencies(dependentServices, CURRENT_SERVICE_NAME);
  if (!dependentServices || _.isEmpty(dependentServices)) {
    const msg = `No dependent services found using the schema-decentralisation flow`;
    console.log(msg);
  }
  try {
    await ServiceSchemaDtl.fetchServiceSchemas(dependentServices, report);
  } catch (error) {
    console.log(`error while fetching the schemas: ${JSON.stringify(error)}\n`);
  }
  report.successRatio = report.schemasFetched/report.totalSchemasQueried;

  report.message = `Schemas queried: ${report.totalSchemasQueried}, schemas fetched: ${report.schemasFetched}, success ratio: ${report.successRatio}`; 
  console.log(report.message);

  if (MONOLITH_SERVICES.includes(CURRENT_SERVICE_NAME)) {
    if (report.successRatio < CONSTANTS.MONOLITH_SCHEMA_FETCH_SUCCESS_RATIO) {
      report.message = `Schema fetch ratio (${report.successRatio}) is less than the desired ratio: ${CONSTANTS.MONOLITH_SCHEMA_FETCH_SUCCESS_RATIO}`; 
      console.log(report.message);
      throw Error(`Unable to fetch all the schemas`);
    }
  }
  else {
    if (report.successRatio < CONSTANTS.MICROSERVICE_SCHEMA_FETCH_SUCCESS_RATIO) {
      report.message = `Schema fetch ratio (${report.successRatio}) is less than the desired ratio: ${CONSTANTS.MICROSERVICE_SCHEMA_FETCH_SUCCESS_RATIO}`;
      console.log(report.message);
      throw Error(`Unable to fetch all the schemas`);
    }
  }
}

const tryInSequence = async (functions) => {

  let isPassed = false;
  let errThrown;
  let returnValue;

  for (let i in functions) {
    if (isPassed) break;
    let functionJson = functions[i];
    try {
      returnValue = await functionJson.function(...functionJson.arguments);
      isPassed = true;
    } catch (err) {
      errThrown = err;
    }
  }
  if (!isPassed) {
    throw Error(errThrown);
  }
  return returnValue;
}

export const fetchSchemas = async () => {

  console.log(`fetching service schemas...`);
  if (CURRENT_SERVICE_NAME === CONSTANTS.OARPC_SERVICE_NAME) {
    await fetchSchemasForOarpc();
  }
  else if (MONOLITH_SERVICES.includes(CURRENT_SERVICE_NAME)) {
    await fetchSchemasForMonoliths();
  } else {
    await fetchSchemasForMicroservices();
  }
}