'use strict';

import { LOG_CONSTANTS } from '../logging/constants';
import { Logger } from '../logging/standard_logger';

export const Coachmarks = {
  initCoachmarks: async (params, RPCFramework) => {
    try {
      const coachmarks = require('coachmarks');
      const Singleton = RPCFramework.getSingleton();
      await coachmarks.init({
        mongoConn: Singleton[params.database_id],
        serviceId: Singleton.Config.SERVICE_ID,
        UCError: Singleton.RPCError,
        localization: Singleton.localization
      });
      const module = await coachmarks.getModule();
      RPCFramework.addToSingleton(params.id, module);
    } catch (err) {    
      const logData = {};
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.err_message || 'Coachmarks Initialization Failed';
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err.err_stack || "NA";
      Logger.error(logData);
      process.exit(1);
    }
  }
}