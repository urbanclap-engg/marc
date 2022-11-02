import CONSTANTS from './constants';
const { DEVELOPMENT } = CONSTANTS.ENVIRONMENT;
const GLOBAL_CONFIG = CONSTANTS.GLOBAL_CONFIG;
import fs from 'fs';
import _ from 'lodash';
import JsonFile from 'jsonfile';
import axios from 'axios';
import { ConfigUtils } from '../../common/config_utils';
const GATEWAY_CONFIG_PATH = ConfigUtils.getParentWorkingDir() + '/configs/gateway.config.js';

const fillServiceDependency = (dependentServices: any, serviceNamesList: any) => {
    // fill placeholder with service name
    let mergedDependencies = _.flattenDeep(serviceNamesList.map(serviceName => { return {id: serviceName, version: 0}}));
    return _.union(mergedDependencies, dependentServices);
  }
  
const addDefaultServicesForGateways = (dependentServices: any, serviceName: string) => {
    try {
        if(fs.existsSync(GATEWAY_CONFIG_PATH)) {
            //file exists
            return fillServiceDependency(dependentServices, CONSTANTS.DEFAULT_DEPENDENCY_FOR_GATEWAY);
        };
        return [];
    } catch (err) { throw Error(err);}
  };
  
  /* Always adds DEFAULT_DEPENDENCY services to dependentServices*/
const addDefaultServices = (dependentServices: any, serviceName: string) => {
    /* Dont want to cut the branch we are sitting on, 
    if platform-config is down fix for it wont be pushed because platform-config is down*/
    if (serviceName === CONSTANTS.PLATFORM_CONFIG_SERVICE) return [];
    return fillServiceDependency(dependentServices, CONSTANTS.DEFAULT_DEPENDENCY);

  }
export const ScriptUtils = {
  addOtherDependencies: (dependentServices: any, serviceName: string): any[] => {
      const functionsForDependencies = [addDefaultServicesForGateways, addDefaultServices];
      return _.flattenDeep(functionsForDependencies.map(func => func(dependentServices, serviceName)));
  },
  getGlobalConfPath: (): string => {
    let configDir = ConfigUtils.getParentWorkingDir() + '/';
    return configDir + ScriptUtils.getEnvConfigFileName(GLOBAL_CONFIG.FILE_NAME);
  },
  getEnvConfigFileName: (fileName: string): string => {
    let env = process.env.NODE_ENV ? process.env.NODE_ENV : DEVELOPMENT;
    return env === DEVELOPMENT ? '.'.concat(fileName) : fileName;
  },
  getServicePlatformConfig: (): any => {
    const platformConfigPath = ConfigUtils.getParentWorkingDir() + CONSTANTS.SERVICE_PLATFORM_CONFIG.CONFIG_PATH;
    return JsonFile.readFileSync(platformConfigPath);
  },
  getParentServicePackageJson: (): any => {
    const packageJsonPath = ConfigUtils.getParentWorkingDir() + '/package.json';
    return JsonFile.readFileSync(packageJsonPath);
  },
  getServiceName: (): string => {
    return ScriptUtils.getParentServicePackageJson().name;
  },
  sendGetRequest: async (url: string, config={}) => {
    try {
          const resp = await axios.get(url, config);
          return resp.data
      } catch (err) {
          return err.response.data;
      }
  }
};