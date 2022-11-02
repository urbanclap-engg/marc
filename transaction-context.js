var Cls = require('cls-hooked');
let SchemaFilter = require('json-schema-filter')
const trxnHeaderSchema = require('./schema/transaction_context').getHeaderSchema();
const Error = require('./error');
const PrioritizedLoadShed = require('./load_shed/strategy/prioritized')

const ContextConstants = {
  UC_TRXN_CONTEXT_NS: 'uc-txn-context-ns',
  TRXN_ID: 'trxn-id',
  HEADERS: 'headers',
  PRIORITY: 'priority',
  LANGUAGE: 'language'
};

const _ = require('lodash')
const Crypto = require("crypto");
var SessionContext = Cls.createNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
const clsBluebird = require('cls-bluebird');
const { LOG_CONSTANTS } = require('./logging/constants');

var transactionContext = {};

transactionContext.getTrxnId = () => {
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
  return SessionContext.get(ContextConstants.TRXN_ID);
}

transactionContext.getTrxnLanguage = () => {
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
  return SessionContext.get(ContextConstants.LANGUAGE);
}

transactionContext.getPriority = () => {
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
  return SessionContext.get(ContextConstants.PRIORITY);
}

transactionContext.getTrxnHeaders = (request_body) => {
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
  return SessionContext.get(ContextConstants.HEADERS);
}

transactionContext.getNamespace = () => {
  return Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
}

transactionContext.getExpressMiddleware = () => {
  return function transactionContextMiddleware(req, res, next) {
    req.trxn_id = req.query.trxn_id || req.headers['cf-ray'] || Crypto.randomBytes(16).toString("hex");
    req.priority = req.query.priority || PrioritizedLoadShed.assignPriorityToRequest(req);
    req.language = req.query.language || req.headers['x-preferred-language'];
    SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
    SessionContext.bindEmitter(req);
    SessionContext.bindEmitter(res);
    SessionContext.run(function() {  
      SessionContext.set(ContextConstants.TRXN_ID, req.trxn_id);
      SessionContext.set(ContextConstants.PRIORITY, req.priority);
      SessionContext.set(ContextConstants.LANGUAGE, req.language);
      next();
    })
  }
}

transactionContext.setTrxnHeaders = (values) => {
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);
  let headers = SchemaFilter(trxnHeaderSchema, _.extend(SessionContext.get(ContextConstants.HEADERS), values))
  SessionContext.set(ContextConstants.HEADERS, headers);
}

transactionContext.patchBluebird = (bluebird) => {
  if(bluebird != require('bluebird')) {
    clsBluebird(Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS), require('bluebird'));
  }
  if(bluebird) {
    clsBluebird(Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS), bluebird)
  }
}

transactionContext.addTransactionDataToLog = (log) => {
  if(!log || typeof log !== 'object')
    return log;
  
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);

  if(!log[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID]) {
    log[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = SessionContext.get(ContextConstants.TRXN_ID);
  }
  return log;
}

transactionContext.getRandomTrxnId = () => {
  return Crypto.randomBytes(16).toString("hex");
}

transactionContext.wrapTrxnInAsyncFn = (trxn_id, callback, params = []) => {
  SessionContext = Cls.getNamespace(ContextConstants.UC_TRXN_CONTEXT_NS);

  return new Promise((resolve, reject) => {
    SessionContext.run(async () => {
      SessionContext.set(ContextConstants.TRXN_ID, trxn_id);
      try {
        await callback(...params);
      } catch (ex) {
        reject(ex);
      }
      resolve();
    });
  });
}

module.exports = transactionContext;