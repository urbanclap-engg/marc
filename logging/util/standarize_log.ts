import * as _ from 'lodash';
import { initLogger } from '@uc-engg/logging-repo';
import { Filter as logFilter } from '../util/filter';
import { LOG_CONSTANTS } from '../constants';
import { LOG_TYPE } from '../constants';

const loggerInstance = initLogger(process.env.LOG_INDEX_NAME);
const LOG_SCHEMA_VALIDATION = 'log_schema_validation';
const STANDARD_LOGGING_STATUS = 'standard_logging_status';
const PASSED = 'passed';
const FAILED = 'failed';
const RELEASE_VERSION = process.env.RELEASE_VERSION;


export const standardizeLog = (data) => {
  const { LoggingUtils } = require('./logging_utils')
  const { Config } = require('../../config');
  try {
    data = logFilter.filterKeys(data);
    let schemaValidationResult = logFilter.isSchemaValid(data);
    if(schemaValidationResult.valid) {
      data[STANDARD_LOGGING_STATUS] = PASSED;
      data[LOG_CONSTANTS.SYSTEM_LOGS.CONTAINER_ID] = LoggingUtils.getContainerId();
      data[LOG_CONSTANTS.SYSTEM_LOGS.CONTAINER_IP] = LoggingUtils.getContainerIp();
      data[LOG_CONSTANTS.SYSTEM_LOGS.BUILD_VERSION] = LoggingUtils.getBuildVersion();
      data[LOG_CONSTANTS.SYSTEM_LOGS.TASK_ID] = LoggingUtils.getTaskId();
      data[LOG_CONSTANTS.SYSTEM_LOGS.CONTAINER_PORT] = LoggingUtils.getContainerPort();
      data[LOG_CONSTANTS.SYSTEM_LOGS.SERVICE_PORT] = LoggingUtils.getServicePort();
      data[LOG_CONSTANTS.SYSTEM_LOGS.SOURCE_TYPE] = Config.getSourceType();
      data[LOG_CONSTANTS.SYSTEM_LOGS.RELEASE_VERSION] = RELEASE_VERSION;
      return data;
    } else {
      let updatedData = {};
      updatedData[LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE] = JSON.stringify(data);
      updatedData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = LOG_SCHEMA_VALIDATION;
      updatedData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = FAILED;
      updatedData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = schemaValidationResult.errors[0] ? schemaValidationResult.errors[0].property + schemaValidationResult.errors[0].message : "";
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVICE;
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.CONTAINER_ID] = LoggingUtils.getContainerId();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.CONTAINER_IP] = LoggingUtils.getContainerIp();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.BUILD_VERSION] = LoggingUtils.getBuildVersion();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.TASK_ID] = LoggingUtils.getTaskId();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.CONTAINER_PORT] = LoggingUtils.getContainerPort();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.SERVICE_PORT] = LoggingUtils.getServicePort();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.SOURCE_TYPE] = Config.getSourceType();
      updatedData[LOG_CONSTANTS.SYSTEM_LOGS.RELEASE_VERSION] = RELEASE_VERSION;
      updatedData[STANDARD_LOGGING_STATUS] = PASSED;
      loggerInstance.error(updatedData);
      return null;
    }
  } catch (error) {
    let errorData = {};
    errorData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = "Error occurred while standardizing logs. error: " + JSON.stringify(error);
    errorData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = JSON.stringify(error.stack);
    errorData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVICE;
    errorData[STANDARD_LOGGING_STATUS] = PASSED;
    loggerInstance.error(errorData);
  }
  return null;
}


export const createApiLog = (response, extra, error?:any) => {
  var request = response.req;
  if (!request) return null;
  if (!_.isEmpty(request.headers)) {
    extra.device = request.headers['x-device-os'] || 'none';
    extra.device_id = request.headers['x-device-id'] || 'none';
  }
  let data = {};
  data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SERVER_RESPONSE;
  return _.extend(data, getApiRequestData(request), getApiResponseData(extra), error ? getApiErrorData(error) : {});
}

const getApiRequestData = (request) => {
  let data = {};
  if (!_.isUndefined(request._startTime)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.API_TIME] = Number(Number(new Date()) - request._startTime);
  }
  if (!_.isUndefined(request.originalUrl)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.API_NAME] = request.originalUrl;
  }
  if(!_.isUndefined(request.trxn_id)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.TRANSACTION_ID] = request.trxn_id;
  }
  if (!_.isEmpty(request.headers)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.USER_AGENT] = request.headers['user-agent'];
    data[LOG_CONSTANTS.SYSTEM_LOGS.VERSION_NAME] = request.headers['x-version-name'];
    data[LOG_CONSTANTS.SYSTEM_LOGS.VERSION_CODE] = request.headers['x-version-code'];
    data[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_ID] = request.headers['x-device-id'];
  }
  if (!_.isUndefined(request.baseUrl) && !_.isUndefined(_.get(request, 'route.path'))) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.API_PATH] = request.baseUrl + request.route.path;
  }
  if (!_.isUndefined(request.method)) {
    data[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = request.method;
  }
  return data;
}

const getApiResponseData = (extra) => {
  let data = {};
  if (!extra) return data;
  if (!_.isUndefined(extra.statusCode)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.STATUS] = extra.statusCode;
  }
  if (!_.isUndefined(extra.logType)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = extra.logType;
  }
  if (!_.isUndefined(extra.device)) {
    data[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_NAME] = extra.device;
    data[LOG_CONSTANTS.SYSTEM_LOGS.DEVICE_ID] = extra.device_id;
  }
  return data;
}

const getApiErrorData = (error) => {
  let data = {};
  if (_.isEmpty(error)) return data;
  if (!_.isUndefined(error.message)) {
    data[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = error.message;
  }
  if (!_.isUndefined(error.stack)) {
    data[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = error.stack;
  }
  return data;
}

