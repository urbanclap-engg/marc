import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { ENVIRONMENT, GLOBAL_CONFIG, OARPC_SERVICE_NAME, PLATFORM_CONFIG, CONFIG_SOURCE } from './constants';


const mergeWithArrayAsLiteral = (destOject, srcObject) => {
  return _.mergeWith(destOject, srcObject, (objValue, srcValue) => {  if(Array.isArray(objValue) || Array.isArray(srcValue)) return srcValue });
}

export const ConfigUtils = {
  readJsonFile: (path: string) => {
    const jsonString = fs.readFileSync(path, "utf8");
    return JSON.parse(jsonString);
  },
  getCurrentEnv: () => {
    if(process.env.NODE_ENV == ENVIRONMENT.PRODUCTION) return ENVIRONMENT.PRODUCTION;
    if(process.env.NODE_ENV == ENVIRONMENT.STAGING) return ENVIRONMENT.STAGING;
    return ENVIRONMENT.DEVELOPMENT;
  },
  getParentWorkingDir: () => _.split(process.cwd(), '/node_modules')[0],
  getGlobalConfigsDir: () => {
    const REPO_DIR_PATH = ConfigUtils.getParentWorkingDir();
    const CURRENT_SERVICE_NAME = require(REPO_DIR_PATH + '/package.json').name;
    if(CURRENT_SERVICE_NAME == OARPC_SERVICE_NAME) {
      return path.join(REPO_DIR_PATH, '/test/configs/');
    }
    const DEPENDENCY_DETAILS = require(path.join(REPO_DIR_PATH, CURRENT_SERVICE_NAME == OARPC_SERVICE_NAME ? 
      'test/configs/platform.config.json' : PLATFORM_CONFIG.RELATIVE_PATH_FROM_ROOT));

    return ((DEPENDENCY_DETAILS.configSource == CONFIG_SOURCE.S3 && (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production')) ? 
            path.join(REPO_DIR_PATH, '/') : path.join(REPO_DIR_PATH, '/configs/'));
  },
  getPlatformConfigDir: () => {
    const REPO_DIR_PATH = ConfigUtils.getParentWorkingDir();
    const CURRENT_SERVICE_NAME = require(REPO_DIR_PATH + '/package.json').name;
    if(CURRENT_SERVICE_NAME == OARPC_SERVICE_NAME) {
      return path.join(REPO_DIR_PATH, '/test/configs/');
    }
    return path.join(REPO_DIR_PATH, '/configs/');
  },
  getEnvConfigFileName: (fileName) => (ConfigUtils.getCurrentEnv() === ENVIRONMENT.DEVELOPMENT) ? '.'.concat(fileName) : fileName,
  getGlobalConfig: () => {
    const REPO_DIR_PATH = ConfigUtils.getParentWorkingDir();
    let config_dir = ConfigUtils.getGlobalConfigsDir();
    let globalConf = ConfigUtils.readJsonFile(path.join(config_dir, GLOBAL_CONFIG.FILE_NAME));
    if(ConfigUtils.getCurrentEnv() === ENVIRONMENT.DEVELOPMENT &&
       fs.existsSync(path.join(REPO_DIR_PATH, ConfigUtils.getEnvConfigFileName(GLOBAL_CONFIG.FILE_NAME)))) {
      let baseGlobalConf = ConfigUtils.readJsonFile(path.join(REPO_DIR_PATH, ConfigUtils.getEnvConfigFileName(GLOBAL_CONFIG.FILE_NAME)));
      return mergeWithArrayAsLiteral(baseGlobalConf, globalConf);
    }
    return globalConf;
  },
  getPlatformConfig: () => {
    const PLATFORM_CONFIG_PATH = path.join(ConfigUtils.getPlatformConfigDir() + PLATFORM_CONFIG.FILE_NAME);
    if (fs.existsSync(PLATFORM_CONFIG_PATH)) {
      return ConfigUtils.readJsonFile(PLATFORM_CONFIG_PATH);
    }
    return {};
  }
};
