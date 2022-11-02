export const Snowflake = {
  initSnowflakeClient: (params, RPCFramework) => {
    const nodeSnowflake = require('snowflake-sdk');
  
    let Config = RPCFramework.getSingleton().Config;
    let snowflakeConfig = Config.getDBConf(params.id);
  
    const snowflakeConnection = nodeSnowflake.createConnection({
      account: snowflakeConfig.account,
      username: snowflakeConfig.user,
      password: snowflakeConfig.password,
      region: snowflakeConfig.region,
      database:snowflakeConfig.database,
      warehouse:snowflakeConfig.warehouse
    });
  
    return new Promise<void>((resolve, reject) => {
      
      snowflakeConnection.connect(function(err, conn) {
        if (err) {
          console.log('Unable to connect: ' + err.message);
        } else {
          console.log('Successfully connected as id: ' + snowflakeConnection.getId());
        }  
        resolve();
      });
      RPCFramework.addToSingleton(params.id, snowflakeConnection);
    })
  }
}