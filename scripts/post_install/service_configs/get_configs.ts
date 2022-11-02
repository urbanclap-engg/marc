import _ from 'lodash';
import requestPromise from 'request-promise';
import { ConfigUtils } from '../../../common/config_utils';
import fs from 'fs';
import CONSTANTS from '../../common/constants';
const GLOBAL_CONFIG = CONSTANTS.GLOBAL_CONFIG;
const GLOBAL_EVENT_CONFIG = CONSTANTS.GLOBAL_EVENT_CONFIG;
const CONFIG_TYPE = CONSTANTS.CONFIG_TYPE;
const CONFIG_SOURCE = CONSTANTS.CONFIG_SOURCE;
const PARENT_WORKING_DIR = ConfigUtils.getParentWorkingDir();
const DEFAULT_CLIENT_ID = 'service-market';
const REQUEST_TIMEOUT_MS = 5000;
const CONFIG_TYPE_TO_CONFIG_FILE_MAPPING = {
  [CONFIG_TYPE.GLOBAL]: GLOBAL_CONFIG.FILE_NAME,
  [CONFIG_TYPE.EVENT]: GLOBAL_EVENT_CONFIG.PLATFORM_FILE_NAME,
  [CONFIG_TYPE.DATA_EVENT]: GLOBAL_EVENT_CONFIG.DATA_FILE_NAME
};

const getPcsEnvUri = () => {
  const globalConfig = ConfigUtils.getGlobalConfig();
  const PCS_ENV_URL = globalConfig["platform-config-service"]["discovery"]["uri"];
  const PCS_ENV_PORT = globalConfig["platform-config-service"]["discovery"]["port"];
  return `${PCS_ENV_URL}:${PCS_ENV_PORT}`;
}

const getConfigFileByType = (configType: any) => {
  let requestBody = {
    configType: configType,
    environment: 'development'
  };
  const PLATFORM_CONFIG_SERVICE_ENV_URI = getPcsEnvUri();
  const options = {
    method: 'POST',
    uri: `http://${PLATFORM_CONFIG_SERVICE_ENV_URI}/platform-config-service/getConfigs?client_id=${DEFAULT_CLIENT_ID}`,
    body: requestBody,
    json: true,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {'Content-Type': 'application/json'}
  };
  return requestPromise(options).promise();
}

const writeConfigFile = (fileName: string, fileObj: any) => {
  fs.writeFileSync(PARENT_WORKING_DIR+ '/' + ConfigUtils.getEnvConfigFileName(fileName),
   JSON.stringify(fileObj, null, 2));
}

const getConfigFilesDev = async () => {
  for(const configType in CONFIG_TYPE_TO_CONFIG_FILE_MAPPING){
    let confObj = (await getConfigFileByType(configType))[configType];
    writeConfigFile(CONFIG_TYPE_TO_CONFIG_FILE_MAPPING[configType], confObj);
  }
}

export const getConfigFiles = async () => {
  const platformConfig =  ConfigUtils.getPlatformConfig();
  const configSource = _.get(platformConfig, 'configSource', CONFIG_SOURCE.S3);
  if(configSource == CONFIG_SOURCE.REPO) {
    return;
  }
  if(process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production'){
    return;
  }
  try {
    console.log('Updating .global.config.json, .event.config.json and .data.event.config.json...');
    await getConfigFilesDev();
    console.log('Succefully updated .global.config.json, .event.config.json and .data.event.config.json.');
  } catch (error) {
    console.log(error);
    console.log('Failed to update one or more config files. Sync with development envrionment Failed. File(s) might be stale.')
  }
}