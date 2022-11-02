export const AuditContext = {
  initAuditContext: (params: ClientMap = {}, RPCFramework) => {
    const AuditContext = require('../audit-context');
    const AuditContextConstants = require('../audit-context/constants');
    AuditContext.patchBluebird();
    RPCFramework.addToSingleton(params.id || 'AuditContext', AuditContext);
    RPCFramework.addToSingleton(params.constants_id || 'AuditContextConstants', AuditContextConstants);
    return AuditContext;
  }
}