import _ from 'lodash';
import { getSingleton } from '../singleton';
import * as Mycroft from '@uc-engg/mycroft';
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE, LOGGING_METRIC_CONSTANTS } from '../logging/constants';
import Monitoring from '../monitoring';
import MonitoringConstants from '../monitoring/monitoring_constants';
import Error from '../error';

const RPC_METRICS = Monitoring.CONSTANTS.RPC_METRICS;
const APPLICATION_METRICS = Monitoring.CONSTANTS.APPLICATION_METRICS;
const MIDDLEWARE_METRICS = Monitoring.CONSTANTS.MIDDLEWARE_METRICS;
const METRIC_TYPES = Monitoring.CONSTANTS.METRIC_TYPES;
const Singleton = getSingleton();
const IS_MIDDLEWARE_MONITORING_ENABLED = (process.env.MIDDLEWARE_MONITORING_ENABLED === 'true');


const initMiddlewareMetric = (defaultLabels) => {
  if(!IS_MIDDLEWARE_MONITORING_ENABLED) {
    return;
  }
  Mycroft.createStore({
    storeName: MIDDLEWARE_METRICS.STORE,
    defaultLabels: defaultLabels
  });

  Mycroft.registerMetric.histogram(MIDDLEWARE_METRICS.STORE, {
    name: MIDDLEWARE_METRICS.HTTP_SERVER_REQUEST_MIDDLEWARE_DURATION,
    help: 'Time taken by middleware dependencies',
    labelNames: ['middleware', 'route'],
    buckets: [1, 5, 10, 15, 20, 25, 50, 100, 1000, 60000]
  });
}

const initAPIKeyTrackingMetric = () => {
  const apiKeyTrackingMap = _.get(Singleton, 'Config.CUSTOM.API_KEY_TRACKING_MAP');
    let shouldInitializeMetrics = true;
    _.forEach(_.keys(apiKeyTrackingMap), (api) => {
      if (_.size(apiKeyTrackingMap[api]) > RPC_METRICS.MAX_KEYS_PER_API) {
        shouldInitializeMetrics = false;
        logError(RPC_METRICS.ERROR.MAX_KEYS_ERROR, `api: ${api}`);
      }
    });
    if (!shouldInitializeMetrics) return;
    Mycroft.registerMetric.counter(RPC_METRICS.STORE, {
      name: RPC_METRICS.HTTP_SERVER_REQUEST_KEYS_COUNT,
      help: 'Count of key values',
      labelNames: ['service', 'client', 'route', 'code', 'key', 'value'],
    });
}

const validateConfig = (metric) => {
  if (metric.buckets && metric.buckets.length > APPLICATION_METRICS.MAX_HISTOGRAM_BUCKETS_PER_METRIC) {
    return { isValid: false, error: APPLICATION_METRICS.ERROR.MAX_HISTOGRAM_BUCKETS }
  }
  if (metric.labelNames.length > APPLICATION_METRICS.MAX_LABELS) {
    return { isValid: false, error: APPLICATION_METRICS.ERROR.MAX_LABELS_ERROR };
  }
  return { isValid: true };
}

const logError = (errType, errMessage ?: any) => {
  let logData = {};

  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = errType;

  if (typeof errMessage !== 'string') {
    errMessage = JSON.stringify(errMessage);
  }

  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = errMessage;

  Logger.error(logData)
}

export const MycroftMonitoring = {
  initMonitoringClient: (serviceId, RPCFramework) => {
    const defaultLabels = { 
      'service': _.get(Singleton, 'Config.SUB_SERVICE_ID', serviceId),
      'release_version': process.env.RELEASE_VERSION
    };
    const MycroftPushGatewayConf = Singleton.Config.getExternalConf(MonitoringConstants.PUSHGATEWAY);
    process.env.PUSHGATEWAY_URL = `http://${MycroftPushGatewayConf.uri}:${MycroftPushGatewayConf.port}`;
    try {
      Mycroft.createStore({
        storeName: RPC_METRICS.STORE,
        defaultLabels: defaultLabels,
        isCollectNodeMetrics: true
      });
  
      Mycroft.registerMetric.histogram(RPC_METRICS.STORE, {
        name: RPC_METRICS.HTTP_SERVER_REQUEST_DURATION,
        help: 'Duration of HTTP requests in ms',
        labelNames: ['service', 'client', 'route', 'code', 'env'],
        // buckets for response time from 10ms to 60000ms
        buckets: [10, 25, 50, 100, 200, 400, 600, 1000, 2500, 5000, 10000, 30000, 60000]
      });
  
      Mycroft.registerMetric.counter(RPC_METRICS.STORE, {
        name: RPC_METRICS.HTTP_SERVER_REQUEST_ERROR,
        help: 'Count of errors',
        labelNames: ['service', 'client', 'route', 'code', 'error_type'],
      });
  
      // metric for tracking payload key and values
      initAPIKeyTrackingMetric();
  
      // metric for external service call duration
      Mycroft.registerMetric.histogram(RPC_METRICS.STORE, {
        name: RPC_METRICS.HTTP_CLIENT_REQUEST_DURATION,
        help: 'Duration of external HTTP requests in ms',
        labelNames: ['external_service', 'route', 'code', 'env'],
        // buckets for response time from 10ms to 60000ms
        buckets: [10, 50, 100, 200, 400, 600, 1000, 2500, 5000, 10000, 30000, 60000]
      });
  
      Mycroft.registerMetric.counter(RPC_METRICS.STORE, {
        name: RPC_METRICS.HTTP_CLIENT_REQUEST_ERROR,
        help: 'Count of errors',
        labelNames: ['external_service', 'route', 'code', 'error_type'],
      });
  
      Mycroft.registerMetric.counter(RPC_METRICS.STORE, {
        name: RPC_METRICS.LOGGING_ERROR_COUNT_METRIC,
        help: 'Error Count of logging request',
        labelNames: [LOGGING_METRIC_CONSTANTS.LABEL.STATUS_CODE,
          LOGGING_METRIC_CONSTANTS.LABEL.ERROR_TYPE,
          LOGGING_METRIC_CONSTANTS.LABEL.LOG_TYPE]
      });
  
      Mycroft.registerMetric.gauge(RPC_METRICS.STORE, {
        name: RPC_METRICS.REQUEST_PAYLOAD_SIZE_IN_BYTES,
        help: 'Request payload size in bytes',
        labelNames: ['client', 'route', 'code']
      });
  
      Mycroft.registerMetric.gauge(RPC_METRICS.STORE, {
        name: RPC_METRICS.RESPONSE_PAYLOAD_SIZE_IN_BYTES,
        help: 'Response payload size in bytes',
        labelNames: ['client', 'route', 'code']
      });
      // metric to monitor middlewares.
      initMiddlewareMetric(defaultLabels);
  
      RPCFramework.addToSingleton(Monitoring.CONSTANTS.MONITORING_HANDLER_SERVICE,
        Monitoring.handler);
    } catch (err) {
      logError(Error.DEPENDENCY_INITIALIZATION_ERROR, err);
      throw err;
    }
  },

  initApplicationMonitoringClient: (params) => {
    if (!(params && params.applicationMetrics)) {
      return;
    }
  
    const applicationMetricList = params.applicationMetrics;
  
    if (applicationMetricList.length > APPLICATION_METRICS.MAX_METRICS_PER_SERVICE) {
      logError(APPLICATION_METRICS.ERROR.MAX_METRICS_ERROR);
  
      return;
    }
  
    try {
      const defaultLabels = { 'service': _.get(Singleton, 'Config.SUB_SERVICE_ID') || _.get(Singleton, 'Config.SERVICE_ID', '') };
      Mycroft.createStore({
        storeName: APPLICATION_METRICS.STORE,
        defaultLabels: defaultLabels
      });
  
      const registerMetricStrategy = {
        [METRIC_TYPES.GAUGE] : Mycroft.registerMetric.gauge,
        [METRIC_TYPES.HISTOGRAM] : Mycroft.registerMetric.histogram,
        [METRIC_TYPES.COUNTER] : Mycroft.registerMetric.counter
      }
      applicationMetricList.forEach(metric => {
        if (!metric.enabled) return;
        const ConfigValidation = validateConfig(metric)
        if (!ConfigValidation.isValid) {
          logError(ConfigValidation.error);
        }
  
        const metricType = metric.metricType || METRIC_TYPES.COUNTER;
        // TO DO : Remove default case from above and send metricType from dependency config in case of application metrics
        const params = {
          name: metric.metricName,
          help: metric.help,
          labelNames: metric.labelNames,
          buckets:_.isEmpty(metric.buckets) ? APPLICATION_METRICS.DEFAULT_HISTOGRAM_BUCKETS : metric.buckets,
        };
  
        registerMetricStrategy[metricType](APPLICATION_METRICS.STORE, params)
        
      });
    } catch (err) {
      logError(Error.DEPENDENCY_INITIALIZATION_ERROR, err);
      throw err;
    }
  }
}
