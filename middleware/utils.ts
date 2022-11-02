import _ from 'lodash';
import Error from '../error';
import { LOG_CONSTANTS } from '../logging/constants';
import { getSingleton } from '../singleton';
import { MonitoringUtils } from '../common/monitoring_utils';

const Singleton = getSingleton();

export const MiddlewareUtils = {
  /**
 * Error Object = { err_type, err_message }
 */
  createError: (req, payload, err) => {
    let logData = MonitoringUtils.getEndpointResponseLog(req);
    var sanitised_err = Error.sanitiseError(err);
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_PAYLOAD] = payload;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE];
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE];
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK];
    logData[LOG_CONSTANTS.SYSTEM_LOGS.STATUS] = (sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.STATUS] || 500).toString();
    Singleton.Logger.error(logData);

    if (_.isUndefined(sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE]) ||
      sanitised_err[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] == Error.RPC_INTERNAL_SERVER_ERROR) {
      sanitised_err[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = null;
    }
    return sanitised_err;
  }
}