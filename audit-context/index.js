const cls = require('cls-hooked');
const constants = require('./constants');
const contextConfig = require('./config');
const _ = require('lodash');
const clsBluebird = require('cls-bluebird');

const auditContext = {};

if (contextConfig.NAMESPACE_CREATED === false) {
  cls.createNamespace(constants.UC_AUDIT_CONTEXT_NS);
  contextConfig.NAMESPACE_CREATED = true;
}

auditContext.getKeys = () => {
  return contextConfig.UC_AUDIT_CONTEXT_KEYS;
};

auditContext.get = (key) => {
  const sessionContext = cls.getNamespace(constants.UC_AUDIT_CONTEXT_NS);
  return sessionContext.get(key);
};

auditContext.getNamespace = () => {
  return cls.getNamespace(constants.UC_AUDIT_CONTEXT_NS);
};

auditContext.getExpressMiddleware = () => {
  return function auditContextMiddleware(req, res, next) {
	const sessionContext = cls.getNamespace(constants.UC_AUDIT_CONTEXT_NS);
	sessionContext.bindEmitter(req);
	sessionContext.bindEmitter(res);
	sessionContext.run(function () {
	  const auditContextKeys = contextConfig.UC_AUDIT_CONTEXT_KEYS;
	  const auditContextKeysToQueryParams = contextConfig.UC_AUDIT_CONTEXT_KEYS_TO_QUERY_PARAMS;
	  
	  for (const key of auditContextKeys) {
		const value = _.get(req, `query.${auditContextKeysToQueryParams[key]}`, 'system');
		sessionContext.set(key, value);
	  }
	  
	  next();
	})
  }
};

auditContext.patchBluebird = (bluebird) => {
  if (bluebird != require('bluebird')) {
	clsBluebird(cls.getNamespace(constants.UC_AUDIT_CONTEXT_NS), require('bluebird'));
  }
  if (bluebird) {
	clsBluebird(cls.getNamespace(constants.UC_AUDIT_CONTEXT_NS), bluebird);
  }
};

module.exports = auditContext;