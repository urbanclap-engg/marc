const { RpcClient } = require('../rpc/client');


export const ExternalService = {
  initExternalServiceClient: (params, RPCFramework) => {
    const Config = RPCFramework.getSingleton().Config;
    const client = RpcClient.createExternalClient(Config.SERVICE_ID, params.id, params.options);
    if(params.isotope) {
      params.isotope.bottom({client});
    }
    RPCFramework.addToSingleton(params.singleton_id || params.id, client);
  }
}


