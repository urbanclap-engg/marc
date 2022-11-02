import _ from 'lodash';
import { LOG_CONSTANTS } from '../logging/constants';


const getGatewayErrorResponse = (error, statusCode) => {
  const isSilent = _.get(error, 'is_silent', false)
  delete error.is_silent;
  delete error.stack
  delete error.error_stack

  return {
    isError: true,
    error_obj: {
      error_message: error[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE],
      is_silent: isSilent,
      status_code: statusCode
    },
    err_message: error[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE],
    err_type: error[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE]
  }
}

export const Response = {
  getErrorResponse: (error) => {
    let statusCode = _.get(error, LOG_CONSTANTS.SYSTEM_LOGS.STATUS, 500);
    return { body: getGatewayErrorResponse(error, statusCode), code: statusCode }
  }
};