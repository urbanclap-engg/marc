export const FeatureConfigManager = {
  initFeatureConfigManager: async (params, RPCFramework) => {
    const featureConfigManger = require('feature-config-manager');
    const Singleton = RPCFramework.getSingleton();
    const XpLib = Singleton['xp_lib'];
    const XpService = XpLib && XpLib['dimensionConfigGetMatching'] ? XpLib : Singleton['xp-service'];
    await featureConfigManger.init({
      mongoConn: Singleton[params.database_id],
      serviceId: Singleton.Config.SERVICE_ID,
      UCError: Singleton.RPCError,
      Logger: Singleton.Logger,
      'xp-service': XpService
    });
    const module = await featureConfigManger.getModule();
    RPCFramework.addToSingleton(params.id, module);
  }
}