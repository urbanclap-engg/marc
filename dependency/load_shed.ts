import LoadShedUtil from '../load_shed/index';
import ScriptConstants from '../scripts/common/constants';
import { Microservice } from './microservice';
import { LOG_TYPE } from '../logging/constants';
import { Logger } from '../logging/standard_logger';

const RELOAD_LOADSHED_CONFIG_MILLISECONDS = 60000


export const LoadShed = {
  initLoadShedding: async (params, RPCFramework) => {
    try {
      if (!RPCFramework.getSingleton()[ScriptConstants.SYSTEM_HEALING_SERVICE]) {
        // Initialize system-healing-service client if dependency is not
        // already initialized via dependency.config.js
        const systemHealingParams = {
          "id": ScriptConstants.SYSTEM_HEALING_SERVICE,
          "version": 0
        };
        Microservice.initMicroserviceClient(systemHealingParams, RPCFramework);
      }
      if (!RPCFramework.getSingleton()[ScriptConstants.PLATFORM_CONFIG_SERVICE]) {
        // Initialize platform-config-service client if dependency is not
        // already initialized via dependency.config.js
        const platfomConfigParams = {
          "id": ScriptConstants.PLATFORM_CONFIG_SERVICE,
          "version": 0
        };
        Microservice.initMicroserviceClient(platfomConfigParams, RPCFramework);
      }
      LoadShedUtil.initLoadShedMaps(RPCFramework);
      setInterval(async () => {
        await LoadShedUtil.updateActiveLoadShedMap(RPCFramework);
      }, RELOAD_LOADSHED_CONFIG_MILLISECONDS);
    } catch (err) {
      Logger.error({
        message: `initLoadShedding -  ERROR - ${JSON.stringify(err)}`,
        method_name: 'initLoadShedding',
        log_type: LOG_TYPE.RPC_LOAD_SHED
      });
    }
  }
}