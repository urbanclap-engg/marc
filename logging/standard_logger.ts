import * as _ from 'lodash';
import { initLogger } from '@uc-engg/logging-repo';
import { LOG_CONSTANTS } from './constants';
import { LOG_TYPE } from './constants';
import Error from '../error';
import {LoggingMetricUtility as LoggingMetricUtil }  from './util/logging_metric';
import { createApiLog, standardizeLog } from './util/standarize_log';
import { StandardLoggerInterface } from './interface';

const loggerInstance = initLogger(process.env.LOG_INDEX_NAME);


export const Logger: StandardLoggerInterface = {
  system: (port, message) => {
    if(typeof message !== 'object')
      message = { message: message };
    let data = {};
    data[LOG_CONSTANTS.SYSTEM_LOGS.SERVICE_PORT] = port;
    data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    data[LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE] = message;
    data = standardizeLog(data);
    if(data) {
      loggerInstance.info(data);
    }
  },
  info: (data) => {
    if (typeof data === 'string' || typeof data === 'number') data = {message: data};
    if(!data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]) {
      data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVICE;
    }
    data = standardizeLog(data);
    if(data) {
      loggerInstance.info(data);
    }
  },
  error: (data) => {
    if (typeof data === 'string' || typeof data === 'number') data = {message: data};
    if(!data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]) {
      data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVICE;
    }
    if(!data[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE]) {
      data[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = _.get(data, 'error.err_type', Error.SERVICE_INTERNAL_ERROR);
    }
  
    data = standardizeLog(data);
    if(data) {
      loggerInstance.error(data);
      // Push the data to prometheus
      LoggingMetricUtil.persistErrorData(data);
    }
  },
  debug: (options, data) => {
    if (typeof data === 'string' || typeof data === 'number') data = {message: data};
    if(!data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]) {
      data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVICE;
    }
    if (options.debug_mode) {
      data = standardizeLog(data);
      if(data) {
        loggerInstance.debug(options, data);
      }
    }
  },
  api_success: (response, extra) => {
    let data = standardizeLog(createApiLog(response, extra));
    if(data) {
      loggerInstance.info(data);
    }
  },
  api_error: (response, extra, error) => {
    let data = standardizeLog(createApiLog(response, extra, error));
    if(data) {
      loggerInstance.error(data);
    }
  },
  exitAfterFlush: () => {
    loggerInstance.exitAfterFlush();
  }
};
