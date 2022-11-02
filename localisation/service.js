'use strict';

//------------------------- PACKAGES----------------------------//

const _ = require('lodash');
const Command = require('@uc-engg/armor').initCircuitBreaker();
const Constants = require('./constants');
const LocalisationMetricConstants = Constants.LOCALISATION_METRICS;
const { LOG_CONSTANTS } = require('../logging/constants');
const ERRORS = require('../error');
const StringObjectExtractor = require('./string_object_extractor')
const TranslatedObjectCreator = require('./object_translator')
const Marker = require('./translation_marker');
const { getSingleton } = require('../singleton');
const Singleton = getSingleton();
const LocalisationMetricUtil = require('./localisation_metric_utils');
const TransactionContext = require('../transaction-context')
LocalisationMetricUtil.initMetric();


const LocalisationService = {
  DefaultLanguage : 'english'
};

LocalisationService.getLocalizedResponse = (response, options) => {
  let startTime = Date.now();
  try {
    const Singleton = getSingleton();
    const GrootService = Singleton.GrootService || Singleton['groot-service'];
    const finalResponse = JSON.parse(JSON.stringify(response));
    return Promise.resolve()
      .then(() => {
        const stringObjects = StringObjectExtractor.extractStringObjects(finalResponse);
        LocalisationMetricUtil.captureResponseTimeMetric(LocalisationMetricConstants.LOCALISATION_METRIC_STORE,
          LocalisationMetricConstants.STRING_EXTRACTION_REQ_TIME, {
            [LocalisationMetricConstants.LABEL.ROUTE]: _.get(options, 'originalUrl')
          }, Date.now() - startTime);
        if(stringObjects.length === 0){
          return finalResponse;
        }
        const params = {
          string_objects: stringObjects,
          options: options
        }

        return GrootService.getLocalisedStringsForObject(params);
      })
      .then((valueToTranslationMap) => {
        TranslatedObjectCreator.createTranslatedObject(finalResponse, valueToTranslationMap.data);
        LocalisationMetricUtil.captureResponseTimeMetric(LocalisationMetricConstants.LOCALISATION_METRIC_STORE,
          LocalisationMetricConstants.REQ_TIME_METRIC, {
            [LocalisationMetricConstants.LABEL.ROUTE]: _.get(options,'originalUrl'),
            [LocalisationMetricConstants.LABEL.RESPONSE_TYPE]: LocalisationMetricConstants.SUCCESS_RESPONSE_TYPE
          }, Date.now() - startTime);
        return finalResponse
      })
      .catch((err) => {
        TranslatedObjectCreator.createTranslatedObject(finalResponse, {});
        let errorType;
        if(err && err.err_message === LocalisationMetricConstants.COMMAND_TIME_OUT_MSG){
          errorType = LocalisationMetricConstants.ERROR.TIMEOUT_TYPE;
        }else{
          errorType = LocalisationMetricConstants.ERROR.UNHANDLED_TYPE;
          const LogData = {};
          LogData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'getLocalizedResponse_response';
          LogData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = JSON.stringify(response);
          LogData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'getLocalizedResponse_error';
          LogData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = err.err_message;
          LogData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = 'getLocalizedResponse';
          Singleton.Logger.error(LogData);
        }
        LocalisationMetricUtil.captureResponseTimeMetric(LocalisationMetricConstants.LOCALISATION_METRIC_STORE,
          LocalisationMetricConstants.REQ_TIME_METRIC, {
            [LocalisationMetricConstants.LABEL.ROUTE]: _.get(options,'originalUrl'),
            [LocalisationMetricConstants.LABEL.RESPONSE_TYPE]: errorType
          }, Date.now() - startTime);
        return finalResponse
      })
  } catch(err){

    let logData = {};
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'localization_response';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = JSON.stringify(response);
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'localization_error';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = JSON.stringify(err.message);
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = 'getLocalizedResponse';
    Singleton.Logger.error(logData);

    TranslatedObjectCreator.createTranslatedObject(response, {})
    return response
  }
}

LocalisationService.getLocalizedString = (stringObject, serviceId, parameterMap = {}) => {
  try {
    if(TransactionContext.getTrxnLanguage() === LocalisationService.DefaultLanguage) {
      return Marker.resolveParametersForDefaultLanguage(stringObject.value, parameterMap)
    }
    let stringType = _.get(stringObject, 'source',"")
    let value = _.get(stringObject, 'value')

    if(stringType === Constants.resource && !_.isEmpty(value) && typeof(value) === Constants.STRING_TYPE){
      parameterMap.source = serviceId
      let context = stringObject.context
      if(!_.isEmpty(context)){
        parameterMap.context = context
      }
      return Marker.markForTranslation(value, parameterMap)
    }

    let logData = {};
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'source';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = serviceId;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'key';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = JSON.stringify(stringObject);
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = 'getLocalizedString';
    Singleton.Logger.info(logData);

    return ""
  } catch (err) {
    LocalisationMetricUtil.captureCounterMetric(LocalisationMetricConstants.LOCALISATION_METRIC_STORE,
      LocalisationMetricConstants.MARK_TRANSLATION_REQ_ERROR_COUNT_METRIC, {
        [LocalisationMetricConstants.LABEL.METHOD_NAME]: LocalisationMetricConstants.LOCALISATION_STRING_METHOD
      });
    let logData = {};
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE] = `getLocalizedString - stringObject: ${stringObject} ` +
      `- parameterMap: ${JSON.stringify(parameterMap)} - ERROR - ${err.message}`;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = _.get(err, 'err_type', 'localization_error');
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = ERRORS.RPC_INTERNAL_SERVER_ERROR;
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = 'getLocalizedString';
    Singleton.Logger.error(logData);
    throw err;
  }
}

LocalisationService.getDynamicLocalizedString = (value, parameterMap = {}, serviceId, contextObject) => {
  try {
    if(TransactionContext.getTrxnLanguage() === LocalisationService.DefaultLanguage) {
      return Marker.resolveParametersForDefaultLanguage(value, parameterMap)
    }
    parameterMap.source = serviceId
    let stringType = _.get(contextObject, 'source',"")
    let context = _.get(contextObject, 'context',"")
    if(stringType === Constants.code){
      if(!_.isEmpty(context) && typeof(context) === Constants.STRING_TYPE){
        parameterMap.context = context
      }
    }
    return !_.isEmpty(value) ? Marker.markForTranslation(value, parameterMap) : value
  } catch (err) {
    LocalisationMetricUtil.captureCounterMetric(LocalisationMetricConstants.LOCALISATION_METRIC_STORE,
      LocalisationMetricConstants.MARK_TRANSLATION_REQ_ERROR_COUNT_METRIC, {
        [LocalisationMetricConstants.LABEL.METHOD_NAME]: LocalisationMetricConstants.LOCALISATION_DYNAMIC_STRING_METHOD
      });
    let logData = {};
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.MESSAGE] = `getDynamicLocalizedString - value: ${value} ` +
      `- parameterMap: ${JSON.stringify(parameterMap)} - contextObject: ${JSON.stringify(contextObject)} - ERROR - ${err.message}`;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = _.get(err, 'err_type', 'localization_error');
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = ERRORS.RPC_INTERNAL_SERVER_ERROR;
    logData[LOG_CONSTANTS.COMMON_PARAMS.METHOD_NAME] = 'getDynamicLocalizedString';
    Singleton.Logger.error(logData);
    throw err;
  }
}

module.exports = LocalisationService;
