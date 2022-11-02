export const DistributedLock = {
  initDistributedLockManager: (params, RPCFramework) => {
    const distributedLockManager = require('distributed-lock-manager');
    const Config = RPCFramework.getSingleton().Config;
    const auditContextNamespace = require('../audit-context/index').getNamespace();
    const transactionContextNamespace = require('../transaction-context').getNamespace();
    distributedLockManager.Initialization().setNamespaces([auditContextNamespace, transactionContextNamespace]);
    distributedLockManager.Initialization().getInstance(Config.getDBConf(params.database_id).uri, params.sequelize_options);
    distributedLockManager.CheckAndCreateDbs();
  }
}