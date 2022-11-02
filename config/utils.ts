import _ from 'lodash';
import RPC_CONSTANTS from '../constants';
import path from 'path';
import fs from 'fs';
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../logging/constants';
import Error from '../error';
import CONSTANTS from '../scripts/common/constants';
const { DEVELOPMENT } = RPC_CONSTANTS.ENVIRONMENT;
const REPO_DIR_PATH = RPC_CONSTANTS.REPO_DIR_PATH;
const GLOBAL_EVENT_CONFIG = RPC_CONSTANTS.GLOBAL_EVENT_CONFIG;
import { ConfigUtils as CommanConfigUtils } from '../common/config_utils';

export const ConfigUtils = {
  getEnvironment: () => {
      return process.env.NODE_ENV ? process.env.NODE_ENV : DEVELOPMENT;
  },
  getOverrideHeaders: (global_conf: object) => {
      const env = ConfigUtils.getEnvironment();
      if (env !== DEVELOPMENT) {
        return {};
      }
      return Object.entries(global_conf)
        .filter(
          ([serviceName, serviceValue]) =>
            serviceValue.discovery?.override && serviceValue.discovery?.uri && serviceValue.discovery?.port
        )
        .reduce((headerItem, [key, value]) => {
          headerItem[key] = `${value.discovery.uri}:${value.discovery.port}`;
          return headerItem;
        }, {});
  },
  /* 
    Get global.config.json file.
    For local and development environment's custom branches, we override global.config.json
    from S3 with one present in repo.  
  */
  getEnvConfigFileName: (fileName: string) => {
    const env = ConfigUtils.getEnvironment();
    return env === DEVELOPMENT ? '.'.concat(fileName) : fileName;
  },
  getAbsoluteFilePath: (relativeRepoFilePath: string) => {
    return path.join(REPO_DIR_PATH, relativeRepoFilePath);
  },
  getEventConfig: () => {
    const platformEventConfigFilePath = ConfigUtils.getAbsoluteFilePath(ConfigUtils.getEnvConfigFileName(GLOBAL_EVENT_CONFIG.PLATFORM_FILE_NAME));
    const dataEventConfigFilePath = ConfigUtils.getAbsoluteFilePath(ConfigUtils.getEnvConfigFileName(GLOBAL_EVENT_CONFIG.DATA_FILE_NAME));

    return {
      platform: fs.existsSync(platformEventConfigFilePath) ? CommanConfigUtils.readJsonFile(platformEventConfigFilePath) : undefined,
      data: fs.existsSync(dataEventConfigFilePath) ? CommanConfigUtils.readJsonFile(dataEventConfigFilePath) : undefined
    }
  },
  getInfraConfig: () => {
    if (fs.existsSync('infra.config.json')){
      return CommanConfigUtils.readJsonFile('infra.config.json')
    }
  },
  getDbUri: (global_conf, path, db_name) => {
    return _.get(global_conf, path).replace(new RegExp(RPC_CONSTANTS.CMS.DB_NAME_PLACEHOLDER), db_name);
  },
  getDWHConfig: (global_conf, config, custom_conf, service_id, db_type, db_cluster_name, db_name, Slack) => {
    let redshift_config = _.get(global_conf, `database-uri.${db_type}.${db_cluster_name}`);
    redshift_config['database'] = db_name;
    let username, password;
    if (db_type == 'snowflake') {
       username = _.get(custom_conf, 'credentials.snowflakeCredentials.username')
       password = _.get(custom_conf, 'credentials.snowflakeCredentials.password')
    }
    username = username || _.get(custom_conf, `credentials.${db_type}.${db_cluster_name}.${db_name}.readwrite.username`) || redshift_config['user']
    password = password || _.get(custom_conf, `credentials.${db_type}.${db_cluster_name}.${db_name}.readwrite.password`) || redshift_config['password']
    if (username && password) {
      redshift_config['user'] = username;
      redshift_config['password'] = password;
      return redshift_config;
    } else {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'cms_status';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "failed";
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_CMS_ERROR;
      const error_message = `Credentials not found for this path: credentials.${db_type}.${db_cluster_name}.${db_name}`;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = error_message;
      Logger.error(logData);
      let err_service_id;
      if (service_id) {
        err_service_id = service_id; 
      }
      const slack_error_message = "Environment : " + config.ENV + ", " + error_message;
      Slack.sendSlackMessage(err_service_id, slack_error_message, RPC_CONSTANTS.CMS.SLACK_ALERT_CHANNEL);
      throw new Error.RPCError({ err_type: Error.RPC_CMS_ERROR, err_message: error_message });
    }
  },
  // TODO: remove fallback of fetching auth_service_ids from global.config.json
  getAuthIds: (sub_service_id, platform_conf, global_conf) => {
    if (CONSTANTS.DEFAULT_DEPENDENCY.includes(sub_service_id)){
      return _.union(_.keys(RPC_CONSTANTS.DEPENDENCY.ID.INTERNAL_SERVICE), platform_conf.authServiceIds)
    }
    if (!_.isNil(platform_conf.authServiceIds)) {
      Logger.info({ key_1: 'get_auth_service_ids', key_1_value: 'fetched the auth_service_ids from platform.config.json' });
      return platform_conf.authServiceIds;
    }
    return global_conf[sub_service_id].deployment.auth_service_ids;
  },
  getCredentialsFromFile: () => {
    const CREDENTIALS_FILE_PATH = path.join(RPC_CONSTANTS.REPO_DIR_PATH, RPC_CONSTANTS.CREDENTIALS_FILE_PATH);
    if (!fs.existsSync(CREDENTIALS_FILE_PATH)) {
      throw new Error.RPCError({ err_type: Error.RPC_CMS_ERROR, err_message: `${RPC_CONSTANTS.CREDENTIALS_FILE_PATH} file not found` });
    }
    return CommanConfigUtils.readJsonFile(CREDENTIALS_FILE_PATH);
  },
  getDBConf: (config_id, global_conf, config, custom_conf, service_id) => {
    const { Slack } = require('../slack');
    const db_type = _.get(global_conf, `${config_id}.db_type`);
    const db_cluster_name = _.get(global_conf, `${config_id}.db_cluster_name`);
    const db_name = _.get(global_conf, `${config_id}.db_name`);

    if (db_type === "redshift" || db_type === "snowflake") {
      return ConfigUtils.getDWHConfig(global_conf, config, custom_conf, service_id, db_type, db_cluster_name, db_name, Slack);
    }

    // One URI is stored for each cluster name in global config, with these placeholders- __db_name__, __username__ and __password__
    let db_uri = ConfigUtils.getDbUri(global_conf, `database-uri.${db_type}.${db_cluster_name}.uri`, db_name);

    // credentials were pre-fetched from CMS
    const username = _.get(custom_conf, `credentials.${db_type}.${db_cluster_name}.${db_name}.readwrite.username`);
    const password = _.get(custom_conf, `credentials.${db_type}.${db_cluster_name}.${db_name}.readwrite.password`);

    if (username && password) {
      db_uri = db_uri.replace(new RegExp(RPC_CONSTANTS.CMS.USERNAME_PLACEHOLDER), username)
        .replace(new RegExp(RPC_CONSTANTS.CMS.PASSWORD_PLACEHOLDER), password);
      return { uri: db_uri };
    } else {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'cms_status';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "failed";
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_CMS_ERROR;
      const error_message = `Credentials not found for this path: credentials.${db_type}.${db_cluster_name}.${db_name}`;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = error_message;
      Logger.error(logData);
      if (config.ENV === 'development') {
        return { uri: db_uri };
      }
      const slack_error_message = "Environment : " + config.ENV + ", " + error_message;
      const err_service_id = service_id;
      Slack.sendSlackMessage(err_service_id, slack_error_message, RPC_CONSTANTS.CMS.SLACK_ALERT_CHANNEL);
      throw new Error.RPCError({ err_type: Error.RPC_CMS_ERROR, err_message: error_message });
    }
  }
}