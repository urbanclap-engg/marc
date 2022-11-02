'use strict'

const getAPMConfig = () => {
  return { asyncHooks : true }
}

let apm = process.env.ELASTIC_APM_ENABLED === 'true' ? require('elastic-apm-node').start(getAPMConfig()) : undefined;

const startTransaction = async (transactionType, transactionName, transactionHandler, ...transactionHandlerArgs) => {
  if (apm) {
    return await recordTransaction(transactionType, transactionName, transactionHandler, ...transactionHandlerArgs);
  }
  else {
    return await transactionHandler(...transactionHandlerArgs);
  }
};

const recordTransaction = async (transactionType, transactionName, transactionHandler, ...transactionHandlerArgs) => {
  const transaction = apm.startTransaction(transactionName, transactionType)
  try{
    await transactionHandler(...transactionHandlerArgs);
    transaction.end()
  } catch(error) {
    await apm.captureError(error)
    transaction.end()
    throw error
  }
};

const setTransactionName = (transactionName) => {
  if(apm) {
    apm.setTransactionName(transactionName);
  }
};

module.exports = {
  startTransaction: startTransaction,
  setTransactionName: setTransactionName
};
