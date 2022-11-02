'use strict'

let NewRelicAgent = undefined;
if (process.env.NEW_RELIC_ENABLED === 'true') NewRelicAgent = require('newrelic');

const startBackgroundTransaction = function(transactionName, transactionGroup, transactionFnToBeRecorded) {
  return Promise.resolve()
  .then(function(){
    if (NewRelicAgent) recordTransaction(transactionName, transactionGroup, transactionFnToBeRecorded);
    else transactionFnToBeRecorded()
    return Promise.resolve()
  })
}

const recordTransaction = function(transactionName, transactionGroup, transactionFnToBeRecorded){
  NewRelicAgent.startBackgroundTransaction(transactionName, transactionGroup, function(){
    let transaction = NewRelicAgent.getTransaction();
    return transactionFnToBeRecorded()
    .then(function(){ return transaction.end() })
    .catch(function(){ return transaction.end() })
  })
}

module.exports = {
  startBackgroundTransaction: startBackgroundTransaction
}