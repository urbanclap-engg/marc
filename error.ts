import _ from 'lodash';
import { LOG_CONSTANTS } from './logging/constants';
import * as Singleton from './singleton';
const Error: {[k:string]: any} = {};



/** Server side errors */
Error.RPC_AUTH_ERROR                        = "rpc_auth_error";
Error.RPC_INTERNAL_SERVER_ERROR             = "rpc_internal_server_error";

Error.RPC_SCHEMA_FILE_ERROR                 = "rpc_schema_file_error";
Error.RPC_METHOD_NOT_IMPLEMENTED_ERROR      = "rpc_method_not_implemented_error";
Error.RPC_METHOD_PATH_INVALID_ERROR         = "rpc_invalid_method_path_error";

Error.RPC_METHOD_NOT_FOUND_ERROR            = "rpc_method_not_found_error";
Error.RPC_REQUEST_INVALID_ERROR             = "rpc_request_invalid_error";
Error.RPC_RESPONSE_INVALID_ERROR            = "rpc_response_invalid_error";

Error.RPC_NO_EVENT_HANDLER_ERROR            = "rpc_no_event_handler_error";
Error.RPC_UNHANDLED_SERVER_REJECTION        = "rpc_unhandled_server_rejection";
Error.RPC_UNCAUGHT_SERVER_EXCEPTION         = "rpc_uncaught_server_exception";
Error.RPC_INVALID_ERROR_FORMAT              = "rpc_invalid_error_format";
Error.RPC_EXTERNAL_SERVER_ERROR             = "rpc_external_server_error";
Error.RPC_CMS_ERROR                         = "rpc_cms_error";
Error.RPC_FILE_LOAD_ERROR                   = "rpc_file_load_error";
Error.SERVICE_INTERNAL_ERROR                = "service_internal_error";
Error.INVALID_PARAMS_ERROR                  = "rpc_invalid_parameters";
Error.DEPENDENCY_INITIALIZATION_ERROR       = "rpc_dependency_initialization_error";
Error.METRICS_CAPTURE_ERROR                 = "rpc_application_metrics_capture_error";
Error.METRICS_EXPORT_ERROR                  = "rpc_application_metrics_export_error";
Error.REQUEST_RATE_LIMITED                  = "request_rate_limited";
Error.RATE_LIMITER_ERROR                    = "rate_limiter_error";
Error.REQUEST_LOAD_SHEDED                   = "request_load_sheded";
Error.CIRCUIT_BREAKER_ERROR                 = "circuit_breaker_error";
Error.SERVICE_INIT_ERROR                    = "service_init_error";


Error.UCError = class UCError extends global.Error {
  err_message: string;
  err_stack: any;
  err_type: string;
  code: number;
  is_silent: boolean;
  constructor(data) {
    data = data || {};
    super();
    let message = data.err_message || data.message
    this.err_message = (typeof message === 'string') ? message : ''
    this.err_stack = data.err_stack || this.stack;
    this.err_type = (typeof data.err_type === 'string' && data.err_type.split(' ').length === 1) ?
      data.err_type : Error.RPC_INVALID_ERROR_FORMAT;
    if (data.name) this.name = data.name 
    if (data.code) this.code = data.code
    if (data.is_silent) this.is_silent = data.is_silent
  }
}

Error.RPCError = class RPCError extends global.Error {
  err_message: string;
  err_stack: any;
  err_type: string;
  code: number;
  is_silent: boolean;
  constructor(data) {
    data = data || {};
    super();
    let message = data.err_message || data.message
    this.err_message = (typeof message === 'string') ? message : ''
    this.err_stack = data.err_stack || this.stack;
    this.err_type = (typeof data.err_type === 'string' && data.err_type.split(' ').length === 1) ?
      data.err_type : Error.RPC_INVALID_ERROR_FORMAT;
    if (data.name) this.name = data.name 
    if (data.code) this.code = data.code
    if (data.is_silent) this.is_silent = data.is_silent
  }
}
Error.ExternalError = class ExternalError extends global.Error {
  err_message: string;
  err_stack: any;
  err_name: string;
  err_type: string;
  constructor(data) {
    if (!data || typeof data === 'string') {
      data = {};
    }
    super();
    this.err_message = data.err_message || data.message;
    this.err_stack = data.err_stack || this.stack;
    this.err_name = data.name;
    this.err_type = data.err_type || Error.RPC_EXTERNAL_SERVER_ERROR;
  }
};

/**
 * @param err - Custom errors must be compliant to log schema
 * @returns <err>
 *  or      INTERNAL_APP_ERROR if wrongly formated error.
 */
Error.sanitiseError = function(err) {
  let sanitised_err: {[k:string]: any} = {};
  if (!err) err = {}
  let errorMessage = err.err_message || err.message
  errorMessage = (typeof errorMessage === 'string') ? errorMessage : '';

  if(err instanceof this.UCError || err instanceof this.RPCError) {
    sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = err.err_type;
    sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errorMessage;
    sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err.err_stack;
    if (err.code) sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.STATUS] = err.code
    if (err.name) sanitised_err.error_name = err.name
    if (err.is_silent) sanitised_err.is_silent = err.is_silent
  }
  else if ( (!_.isUndefined(err.err_type) && !_.isNull(err.err_type)) &&
       (typeof err.err_type === 'string' || err.err_type instanceof String && err.err_type.split(' ').length === 1) ) {
    sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = err.err_type;
    sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errorMessage;
    sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err.stack;
  } else {
    sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = this.RPC_INTERNAL_SERVER_ERROR;
    sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errorMessage;
    sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err.stack;
  }
  return sanitised_err;
}

/**
  * Add UCError class to Singleton and global object.
  */
Error.initUCError = () => {
  Singleton.addToSingleton('UCError', Error.UCError);
  return Error.UCError;
}

/**
* Add RPCError class to Singleton and global object.
*/
Error.initRPCError = () => {
  Singleton.addToSingleton('RPCError', Error.RPCError);
  return Error.RPCError;
}

export = Error;