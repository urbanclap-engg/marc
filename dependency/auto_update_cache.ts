import _ from 'lodash';
import { LOG_CONSTANTS } from '../logging/constants';
import { Logger } from '../logging/standard_logger';
import CONSTANTS from '../constants';
import { Microservice } from './microservice';
const DEPENDENCY = CONSTANTS.DEPENDENCY;

const regionConfigServiceParams = {
    id: DEPENDENCY.ID.INTERNAL_SERVICE["region-config-service"],
    version: '0'
}

const CONMAN_CONFIG_ID = "conmanConfig";

export const AutoUpdateCache = {
  initiate: async (params, RPCFramework) => {
    try {
      const autoUpdateCache = require('@uc-engg/auto-update-cache');
      const Singleton = RPCFramework.getSingleton();
      const defaultParams = _.get(Singleton, `Config.GLOBAL_CONF.${params.id}.value`, {});
      if (params.id === CONMAN_CONFIG_ID) {
        Microservice.initMicroserviceClient(regionConfigServiceParams, RPCFramework);
      }
      const initialiseResult = await autoUpdateCache.initialise({
        singleton: {
          ...Singleton,
          serviceId: Singleton.Config.SERVICE_ID,
        },
        useCase: { ...defaultParams, ...params },
      });
      _.map(initialiseResult, (value, key) => {
        RPCFramework.addToSingleton(key, value);
      });
    } catch (err) {
        let logData = {};
        logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = err;
        logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = 'AutoUpdateCache.initiate';
        logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.err_message || 'AutoUpdateCache Initialization Failed';
        logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err.err_stack || "NA";
        Logger.error(logData);
        process.exit(1);
    }
  }
}