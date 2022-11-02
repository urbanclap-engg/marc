import _ from 'lodash';
import vaultClientFetcher from '../credential_management/vault/connection';
import CONSTANTS from '../constants';
import { LOG_CONSTANTS } from "../logging/constants";
import { Logger } from "../logging/standard_logger";

export const Securitas = {
  initSecuritasClient: async (params, RPCFramework) => {
    const CREDENTIALS_STORE_TYPE = CONSTANTS.CREDENTIALS_STORE;
    const Singleton = RPCFramework.getSingleton();
    const Config = Singleton.Config;
    let credentialStore = _.get(Config['PLATFORM_CONF'], 'credentialStore') || CREDENTIALS_STORE_TYPE.VAULT;
    if(credentialStore == CREDENTIALS_STORE_TYPE.VAULT) {
      let global_conf = Config['GLOBAL_CONF'];
      let full_metadata_url = CONSTANTS.CMS.AWS_METADATA_URL + process.env['AWS_CONTAINER_CREDENTIALS_RELATIVE_URI'];
      const securitas = require('@uc-engg/securitas');
      let serviceId = Singleton.Config.SERVICE_ID
      const piiTypes = CONSTANTS.CMS.PII_TYPES
      try {
        let vaultClient = await vaultClientFetcher.fetchClient({
          vault_address: global_conf['cms_server'],
          full_metadata_url: full_metadata_url,
          service_id: serviceId
        })
        await securitas.init(
        {
          vaultClient: vaultClient,
          piiTypes: piiTypes,
          UCError: Singleton.RPCError,
          serviceID: serviceId,
          Logger: Singleton.Logger
        }) 
        const securitasModule = await securitas.getModule()
        RPCFramework.addToSingleton(params.singleton_id || 'securitas', securitasModule);
      }
      catch (error) {
        const logData = {};
        logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = error.err_message || 'Securitas Initialization Failed';
        logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = error.err_stack || "NA";
        Logger.error(logData);
        process.exit(1);
      }
    }
  }
}