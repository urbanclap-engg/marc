export const Cache = {
  initCacheClient: (params, RPCFramework) => {
    const Flash = require('@uc-engg/flash');
    const Config = RPCFramework.getSingleton().Config;
    const cacheConnectionConfig = Config.getExternalConf((params.id == 'cache' ? 'cache-main' : params.id));
    let cache = new Flash();
    cache.connect(cacheConnectionConfig, params.options, Config.SERVICE_ID);
    cache.setCurrentService(Config.SERVICE_ID);
    RPCFramework.addToSingleton(params.singleton_id || params.id, cache);
  }
}