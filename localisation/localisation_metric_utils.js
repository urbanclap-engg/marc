const Mycroft = require('@uc-engg/mycroft');
const _ = require('lodash');
const { Logger } = require('../logging/standard_logger');
const LocalisationMetricConstants = require('./constants').LOCALISATION_METRICS;
const Singleton = require('../singleton').getSingleton();
const { LOG_CONSTANTS, LOG_TYPE } = require('../logging/constants');
const MycroftInitUtil = require('../monitoring/mycroft_init_util');
const { ServiceMetaDataUtil } = require('../common/service_metadata_util');
const IS_LOCALISATION_MONITORING_ENABLED = (process.env.LOCALISATION_MONITORING_ENABLED === 'true');

const initCommonConfig = () => {
  const ServiceId = ServiceMetaDataUtil.getServiceId();
  const DefaultLabels = {
    [LocalisationMetricConstants.LABEL.SERVICE]: _.get(Singleton, 'Config.SUB_SERVICE_ID', ServiceId) 
  }
  MycroftInitUtil.storeInitialisation(LocalisationMetricConstants.LOCALISATION_METRIC_STORE, DefaultLabels);
}

const registerMetric = () => {
  Mycroft.registerMetric.histogram(LocalisationMetricConstants.LOCALISATION_METRIC_STORE, {
    name: LocalisationMetricConstants.REQ_TIME_METRIC,
    help: 'Duration of localisation requests',
    labelNames: [LocalisationMetricConstants.LABEL.ROUTE,
      LocalisationMetricConstants.LABEL.RESPONSE_TYPE],
    buckets: LocalisationMetricConstants.BUCKET_RANGE
  });
  Mycroft.registerMetric.histogram(LocalisationMetricConstants.LOCALISATION_METRIC_STORE, {
    name: LocalisationMetricConstants.STRING_EXTRACTION_REQ_TIME,
    help: 'Duration of localisation string extraction',
    labelNames: [LocalisationMetricConstants.LABEL.ROUTE],
    buckets: LocalisationMetricConstants.BUCKET_RANGE
  });
  Mycroft.registerMetric.counter(LocalisationMetricConstants.LOCALISATION_METRIC_STORE, {
    name: LocalisationMetricConstants.MARK_TRANSLATION_REQ_ERROR_COUNT_METRIC,
    help: 'Error Count of localisation mark for translation request',
    labelNames: [LocalisationMetricConstants.LABEL.METHOD_NAME]
  });
}

const LocMetricUtility = {};

LocMetricUtility.initMetric = ()=> {
  if (!IS_LOCALISATION_MONITORING_ENABLED) {
    return;
  }
  try{
    initCommonConfig();
    registerMetric();
  }catch(err){
    Logger.error({
      [LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE]: LocalisationMetricConstants.ERROR.INIT_METRIC_ERROR,
      [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE]: err.message || JSON.stringify(err),
      [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK]: err.stack,
      [LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE]: LOG_TYPE.RPC_SYSTEM
    });
    throw err;
  }
}

LocMetricUtility.captureResponseTimeMetric = async (storeName, metricName, monitoringParams, timeToLog) => {
  if (!IS_LOCALISATION_MONITORING_ENABLED) {
    return;
  }
  try{
    Mycroft.setMetric(storeName, metricName, monitoringParams, timeToLog);
  }catch(err){
    Singleton.Logger.error({
      error_type: LocalisationMetricConstants.ERROR.CAPTURE_METRIC_ERROR,
      error_message: err.message || JSON.stringify(err),
      error_stack: err.stack
    });
  }
}

LocMetricUtility.captureCounterMetric = async (storeName, metricName, monitoringParams) => {
  if (!IS_LOCALISATION_MONITORING_ENABLED) {
    return;
  }
  try {
    Mycroft.incMetric(storeName,
      metricName, monitoringParams);
  } catch (err) {
    Singleton.Logger.error({
      error_type: LocalisationMetricConstants.ERROR.CAPTURE_METRIC_ERROR,
      error_message: err.message || JSON.stringify(err),
      error_stack: err.stack
    });
  }
};

LocMetricUtility.exportMetrics = () => {
  try {
    return Mycroft.exportMetrics(LocalisationMetricConstants.LOCALISATION_METRIC_STORE).metrics;
  } catch (err) {
    Singleton.Logger.error({
      error_type: LocalisationMetricConstants.ERROR.EXPORT_METRIC_ERROR,
      error_message: err.message || JSON.stringify(err),
      error_stack: err.stack
    });
  }
}

module.exports = LocMetricUtility;

