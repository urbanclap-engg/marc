'use strict'

import _ from 'lodash';
import requestPromise from 'request-promise';
import fs from 'fs';
import JsonFile from 'jsonfile';
import PATH from 'path';
import { toInteger } from 'lodash';
import CONSTANTS from '../../common/constants';
import { ConfigUtils } from '../../../common/config_utils';
import { ScriptUtils } from '../../common/script-utils';
const DEFAULT_CLIENT_ID = 'service-market';
const PLATFORM_CONFIG_SERVICE_ID = 'platform-config-service';
const PLATFORM_CONFIG_SERVICE_ENV_URI: {[k: string]: any} = {};
const REPO_DIR_PATH = ConfigUtils.getParentWorkingDir();
const CURRENT_SERVICE_NAME = require(REPO_DIR_PATH + '/package.json').name;
const DEPENDENCY_DETAILS = require(PATH.join(REPO_DIR_PATH, CURRENT_SERVICE_NAME == CONSTANTS.OARPC_SERVICE_NAME ? 
                                           'test/configs/platform.config.json' : 'configs/platform.config.json'));

const initConfig = () => {
  let global_conf;
  const globalConfigPath = ScriptUtils.getGlobalConfPath();

  if (CURRENT_SERVICE_NAME === CONSTANTS.OARPC_SERVICE_NAME) {
    global_conf = JsonFile.readFileSync(REPO_DIR_PATH + '/test/configs/global.config.json');
  }
  else {
    global_conf = JsonFile.readFileSync(globalConfigPath);
  }

  PLATFORM_CONFIG_SERVICE_ENV_URI[process.env.NODE_ENV || 'default'] = `${global_conf[PLATFORM_CONFIG_SERVICE_ID].discovery.uri}:${global_conf[PLATFORM_CONFIG_SERVICE_ID].discovery.port}`
}


const getServiceSchema = (repo, branch, filePath, platformConfigServiceUri) => {

  const requestBody = {
    service_name: repo,
    branch: branch,
    schema_path: filePath
  };
  const options = {
    method: 'POST',
    uri: `http://${platformConfigServiceUri}/platform-config-service/getServiceSchema?client_id=${DEFAULT_CLIENT_ID}`,
    body: requestBody,
    json: true,
    timeout: CONSTANTS.REQUEST_TIMEOUT_MS,
    headers: {'Content-Type': 'application/json'}
  };

  return requestPromise(options).promise();
}

const getGitlabProjectIdByName = async (repoName) => {
  const {gitUri, gitToken, gitGroupName} = _.get(DEPENDENCY_DETAILS, 'serviceDependencySchema.properties');
  const url = `${gitUri}/api/v4/projects?search=${repoName}`
  const headers = { 'Content-Type': 'application/json', 'Private-Token': gitToken }

  const response = await ScriptUtils.sendGetRequest(url, { headers: headers })
  const repoNameWithGp = (gitGroupName) ? gitGroupName+'/'+repoName : repoName;
  return _.get(_.find(response, { path_with_namespace: `${repoNameWithGp}`}), 'id');

}

const fetchSchemaFromGitlab = async (repo, branch) => {
  const projectId = await getGitlabProjectIdByName(repo);
  if (projectId === 'undefined') throw Error(`Repository: ${repo} branch: ${branch} not found on gitlab`);

  /*fetch schema json from Gitlab*/
  const { gitUri, gitToken, gitGroupName } = _.get(DEPENDENCY_DETAILS, 'serviceDependencySchema.properties');
  const url = `${gitUri}/api/v4/projects/${projectId}/repository/files/schema%2Fservice_schema.json/raw?ref=${branch}`
  const headers = { 'Content-Type': 'application/json', 'Private-Token': gitToken }
  const schemaJson = await ScriptUtils.sendGetRequest(url, { headers: headers });
  return schemaJson;

}

const getSchemaFromUCService = async (serviceName, branch, filePath) => {
  
  let platformConfigServiceUri = PLATFORM_CONFIG_SERVICE_ENV_URI[process.env.NODE_ENV] || PLATFORM_CONFIG_SERVICE_ENV_URI.default;
  let serviceSchemaDetails;
  serviceSchemaDetails = await getServiceSchema(serviceName, branch, filePath, platformConfigServiceUri);
  
  if (!serviceSchemaDetails.isError) {
    return serviceSchemaDetails.schema; 
  }
  throw Error(`Unable to fetch the schema for service: ${serviceName}, branch: ${branch}`)
}

const storeFetchedSchemas = async (schemaDir, schemaPath, serviceSchemas) => {
  if (!(await fs.existsSync(schemaDir))){
    await fs.mkdirSync(schemaDir);
  }
  await fs.writeFileSync(schemaPath, JSON.stringify(serviceSchemas, null, 2));
}

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 

const createSchemaFile = async (schemaFilePath, serviceSchemas) => {
    console.log("Storing the fetched schemas...");
    const schemaFileName = PATH.basename(schemaFilePath);
    const schemaDir = _.split(schemaFilePath,schemaFileName)[0];
    await storeFetchedSchemas(PATH.join(REPO_DIR_PATH, schemaDir), PATH.join(REPO_DIR_PATH, schemaFilePath), serviceSchemas);
}

const getCombinedSchemaObjects = async (serviceName, version, branch, retries, serviceSchemas, fetchReport) => {

  let serviceSchema;
  let found = false;
  let errorJson;
  const gitRepoName = _.get(CONSTANTS.SERVICE_TO_GIT_NAME_MAPPING, serviceName, serviceName);

  if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') branch = CONSTANTS.DEFAULT_FALLBACK_BRANCH;

  const DEPENDENCY_SCHEMA_SOURCE = _.get(DEPENDENCY_DETAILS, 'serviceDependencySchema.type');
  fetchReport.totalSchemasQueried++;
    while(retries) {
      try {
        switch(DEPENDENCY_SCHEMA_SOURCE) {
          case CONSTANTS.SCHEMA_SOURCE_TYPE.GITLAB:
            serviceSchema = await fetchSchemaFromGitlab(gitRepoName, branch);
            break;

          default:
            serviceSchema = await getSchemaFromUCService(gitRepoName, branch, CONSTANTS.GIT_SCHEMA_FILE_PATH);
        }
        retries = 0;
        found = true;
        fetchReport.schemasFetched++;
      } catch (error) {
        errorJson = error;
        await sleep(2000);
        retries--;
      }
    }
  
  serviceSchemas[serviceName] = serviceSchema;
}

const ServiceSchemaDtl = {
  fetchServiceSchemas: async (dependentServices, fetchReport) => {
    let serviceSchemas = {};
    let retries;
    let fetchSchemaPromises = [];
    let numRequests = 0;
    fetchReport.totalSchemasQueried = fetchReport.schemasFetched = 0;
    const DEF_DEPENDENCY_SCHEMA_PATH = 'node_modules/dependency_schemas.json';
    const schemaFilePath = _.get(DEPENDENCY_DETAILS, 'properties.generatedSchemaFilePath', DEF_DEPENDENCY_SCHEMA_PATH);
    let DEPENDENCY_SCHEMA_SOURCE = _.get(DEPENDENCY_DETAILS, 'serviceDependencySchema.type', undefined);
    if (DEPENDENCY_SCHEMA_SOURCE === CONSTANTS.SCHEMA_SOURCE_TYPE.CUSTOM){ 
      console.log('defined custom logic to fetch dependency schema objects. skipping this...');
      return;
    }
    initConfig();
    for (let i in dependentServices) {
      retries = CONSTANTS.MAX_REQUEST_RETRIES;
      numRequests++;
      let serviceName = dependentServices[i].id;

      let version = toInteger(dependentServices[i].version);
      let branch = dependentServices[i].branch || CONSTANTS.DEFAULT_FALLBACK_BRANCH;
      fetchSchemaPromises.push(getCombinedSchemaObjects(serviceName, version, branch, retries, serviceSchemas, fetchReport));
      if (numRequests == CONSTANTS.MAX_CONCURRENT_REQUESTS) {
        await Promise.all(fetchSchemaPromises);
        numRequests = 0;
        fetchSchemaPromises = [];
      }
      await Promise.all(fetchSchemaPromises);
    }
    console.log("Storing the fetched schemas...");
    await createSchemaFile(schemaFilePath, serviceSchemas);
  }
};

export default ServiceSchemaDtl;