import TransactionContext from '../transaction-context';


const getLogger = (loggerType, options) => {
  const logger = {
    info: function(data) { TransactionContext.addTransactionDataToLog(data); loggerType.info(data); },
    debug: function(data) { TransactionContext.addTransactionDataToLog(data); loggerType.debug(options, data); },
    error: function(data) { TransactionContext.addTransactionDataToLog(data); loggerType.error(data); },
    api_success: function(response, extra) { loggerType.api_success(response, extra); },
    api_error: function (response, extra, error) { loggerType.api_error(response, extra, error); },
    exit_after_flush: function () { loggerType.exitAfterFlush(); }
  };
  return logger;
}

export {
  getLogger
}
