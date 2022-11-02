/* eslint-disable @uc/uc/file-name */

import _ from 'lodash';
import path from 'path';
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../logging/constants';
import RPC_CONSTANTS from '../constants';
import { ConfigUtils as CommanConfigUtils } from '../common/config_utils';
import { ConfigInterface } from './interface'
import { ConfigUtils } from './utils'
import { Slack } from '../slack';
import * as ErrorTypes from "../error"
let config: {[key: string]: any} = {};
import { fetchCredentials} from "../credential_management";

let source_type = RPC_CONSTANTS.SOURCE_TYPE.SERVICE;


/** initConfig(service_id)
 *
 * @param service_id
 *
 * @return 
      {
        SERVICE_ID, APP_PATH, ENV, 
        PORT, URI, AUTH_SERVICE_IDS,
        CUSTOM, 
        getExternalConf(),
        getServiceConf(),
        getS3Conf()
      } 
 */
export const Config: ConfigInterface = {
  initConfig: (service_id, options) => {

    const sub_service_id = process.env.SUB_SERVICE_ID ? process.env.SUB_SERVICE_ID : service_id;
    if (!(config 
      && Object.keys(config).length === 0
      && Object.getPrototypeOf(config) === Object.prototype)) {
      return config;
    }

    source_type = _.get(options, 'source_type', RPC_CONSTANTS.SOURCE_TYPE.SERVICE);

    const custom_conf = CommanConfigUtils.readJsonFile(path.join(CommanConfigUtils.getGlobalConfigsDir(), service_id + '.config.json'));
    const global_conf = CommanConfigUtils.getGlobalConfig();
    const platform_conf = CommanConfigUtils.getPlatformConfig();
    const overrideHeaders = ConfigUtils.getOverrideHeaders(global_conf);

    try {

      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVICE;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'service_id';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = service_id;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'sub_service_id';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = sub_service_id;
      Logger.info(logData);

      config = {
        SERVICE_ID: service_id,
        SUB_SERVICE_ID: sub_service_id,
        APP_PATH: __dirname,
        ENV: process.env.NODE_ENV ? process.env.NODE_ENV : 'development',

        PORT: global_conf[sub_service_id].discovery.port,
        URI: global_conf[sub_service_id].discovery.uri,
        AUTH_SERVICE_IDS: ConfigUtils.getAuthIds(sub_service_id, platform_conf, global_conf),

        CUSTOM: custom_conf,
        GLOBAL_CONF: global_conf,
        EVENT_CONF: ConfigUtils.getEventConfig(),
        INFRA_CONF: ConfigUtils.getInfraConfig(),
        SOURCE_TYPE: source_type,
        PLATFORM_CONF: platform_conf,

        getExternalConf: (id) => {
          return global_conf[id].discovery;
        },
        getServiceConf: (id) => {
          return global_conf[id].discovery;
        },
        getOverrideHeaders: () => {
          return overrideHeaders;
        },
        getS3Conf: (id) => {
          return global_conf[id].discovery;
        },
        getCustomServiceConf: (id) => {
          return _.get(custom_conf, `internal_service_config.${id}`, {});
        },
        getDBConf: (config_id) => {
          return ConfigUtils.getDBConf(config_id, global_conf, config, custom_conf, service_id)
        }
      };
      return config;
    } catch (err) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'message';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "Unable to create config for the service";
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err;
      Logger.error(logData);
      console.log("Unable to create config for the service: ", service_id, err);
      throw err;
    }
  },
  getSourceType: () => {
    return source_type;
  }
}