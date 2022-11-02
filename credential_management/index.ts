import CONSTANTS from "../constants";
import { fetchCredentialsFromVault } from "./common/credential_retrieval";
import * as _ from "lodash";
import ErrorTypes from "../error";
import * as Singleton from "../singleton";
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../logging/constants';
import { ConfigUtils } from "../config/utils";
import { Slack } from '../slack';

const fetchCredentials = async (serviceId: string, environment: string) => {
  const serviceLevelCredentialsPath = `kv/${environment}/${serviceId}`;
  const globalCredentialsPath = `kv/${environment}/${CONSTANTS.CMS.GLOBAL_CREDENTIALS_FOLDER_NAME}`;
  const snowflakeCredentialsPath = `database/static-creds/${serviceId.replace(/-/g, "_")}_role`
  const commonCredentialsPaths = await fetchCommonCredentialsPaths();
  const allCredentialPaths = [
    {
      secretIdentifier: CONSTANTS.CMS.SERVICE_CREDENTIALS_PATH,
      vaultPath: serviceLevelCredentialsPath,
    },
    {
      secretIdentifier: CONSTANTS.CMS.GLOBAL_CREDENTIALS_PATH,
      vaultPath: globalCredentialsPath,
    },
    {
      secretIdentifier: 'credentials.snowflakeCredentials',
      vaultPath: snowflakeCredentialsPath
    },
    ...commonCredentialsPaths
  ];
  return fetchCredentialsFromVault(allCredentialPaths);
};

const fetchCommonCredentialsPaths = async () => {
  const commonCredentialsPaths = [];
  const commonCredentialsRequired =
    Singleton.getSingleton().Config.PLATFORM_CONF[
      "COMMON_CREDENTIALS_REQUIRED"
    ];
  const commonCredentialsPresent = CONSTANTS.CMS.COMMON_CREDENTIALS;
  if (commonCredentialsRequired) {
    for (const credentialIdentifier of commonCredentialsRequired) {
      if (_.has(commonCredentialsPresent, credentialIdentifier)) {
        commonCredentialsPaths.push(
          _.set(
            commonCredentialsPresent[credentialIdentifier],
            "secretIdentifier",
            `credentials.${credentialIdentifier}`
          )
        );
      } else {
        throw new ErrorTypes.RPCError({
          err_type: ErrorTypes.RPC_CMS_ERROR,
          err_message:
            "Error in retrieving cms keys. Credential path does not exist in global-config",
        });
      }
    }
  }
  return commonCredentialsPaths;
};

/**
 * Initializes connection with cms and loads the service credentials json in custom_conf under the key 'credentials'.
 * This service credentials json structure will exactly same as stored in cms server.
 * @param service_id
 * @returns {Promise.<TResult>} This promise will return the Config object with credentials
 */
 const initCredentials = async (service_id) => {
  const Singleton_OARPC = require('../singleton').getSingleton();
  const Config = Singleton_OARPC.Config;
  let environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  try {
    const CREDENTIALS_STORE_TYPE = CONSTANTS.CREDENTIALS_STORE;
    let credentialStore = _.get(Config['PLATFORM_CONF'], 'credentialStore') || CREDENTIALS_STORE_TYPE.VAULT;
    let credentials;
    switch (credentialStore) {
      case CREDENTIALS_STORE_TYPE.CREDENTIALS_JSON:
        credentials = {
          [CONSTANTS.CMS.SERVICE_CREDENTIALS_PATH]: ConfigUtils.getCredentialsFromFile()
        };
        break;
      case CREDENTIALS_STORE_TYPE.VAULT:
        credentials = await fetchCredentials(service_id, environment)
        break;
      default: 
        throw new ErrorTypes.RPCError({ err_type: ErrorTypes.RPC_CMS_ERROR, err_message: `Invalid credentialStore input ${credentialStore} in platform.config.json` });
    }
    _.assign(Config['CUSTOM'], credentials);
    Logger.info({
      [LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] : LOG_TYPE.RPC_SERVICE,
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] : 'credentials_fetch',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] : 'successful',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] : 'credential_store',
      [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] : credentialStore
    });
  } catch(err) {
    let logData = {};
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'credentials_fetch';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "failed";
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = ErrorTypes.RPC_CMS_ERROR;
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = "Failed to fetch and load credentials "
      + (err ? (err.message || err.err_message) : 'NA');
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err ? (err.stack || err.err_stack) : "NA";
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = err;
    Logger.error(logData);
    Slack.sendSlackMessage(service_id, "Failed to fetch and load credentials", CONSTANTS.CMS.SLACK_ALERT_CHANNEL);
  };
  return Config;
}


export { fetchCredentials, initCredentials };
