export const Redshift = {
  initRedshiftClient: (params, RPCFramework) => {
    const nodeRedshift = require('node-redshift');
    const Config = RPCFramework.getSingleton().Config;
    const redshiftConfig = Config.getDBConf(params.id);
  
    const redshiftClient = new nodeRedshift(redshiftConfig, {
      longStackTraces: false
    });
    RPCFramework.addToSingleton(params.id, redshiftClient);
  }
}