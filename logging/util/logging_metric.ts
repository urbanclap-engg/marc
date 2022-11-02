import {LOGGING_METRIC_CONSTANTS} from '../constants';
import { LOG_CONSTANTS } from '../constants';
import * as Mycroft from '@uc-engg/mycroft';
import {RPC_METRICS} from '../../monitoring/monitoring_constants';


/**
 * This method will persist part of error log into prometheus
 *
 * @param errorLogData
 */
export const LoggingMetricUtility = {
  persistErrorData: async (errorLogData) => {
    const errorDataToPersist = {
      [LOGGING_METRIC_CONSTANTS.LABEL.STATUS_CODE]: errorLogData[LOG_CONSTANTS.SYSTEM_LOGS.STATUS] || LOGGING_METRIC_CONSTANTS.DEFAULT_STATUS_CODE,
      [LOGGING_METRIC_CONSTANTS.LABEL.ERROR_TYPE]: errorLogData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] || LOGGING_METRIC_CONSTANTS.DEFAULT_ERROR_TYPE,
      [LOGGING_METRIC_CONSTANTS.LABEL.LOG_TYPE]: errorLogData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] || LOGGING_METRIC_CONSTANTS.DEFAULT_LOG_TYPE
    };
    LoggingMetricUtility.captureCounterMetric(RPC_METRICS.STORE,
      RPC_METRICS.LOGGING_ERROR_COUNT_METRIC, errorDataToPersist);
  },
  captureCounterMetric: (storeName, metricName, monitoringParams) => {
    try {
      Mycroft.incMetric(storeName,
        metricName, monitoringParams);
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }
}
