import Localisation from '../localisation';
import Error from '../error';


export const LocalizationService = {
  initLocalizationClient: (params, RPCFramework) => {
    const Config = RPCFramework.getSingleton().Config;
    try {
      let serviceId = Config.SERVICE_ID;
      const singletonId = params.id ? params.id : "localization"
      const localisation = Localisation.initLocalisationService(serviceId)
      RPCFramework.addToSingleton(singletonId, localisation);
    } catch (error) {
      throw new Error.RPCError({err_type: Error.SERVICE_INIT_ERROR, err_message: error});
    }
  }
}