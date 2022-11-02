import RPC_CONSTANTS from '../constants';
import { Utils } from './utils';
import transactionContext from '../transaction-context';
import _ from 'lodash';
import { Logger } from '../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../logging/constants';
import { startTransaction as BackgroundTransactionTracker } from '../monitoring/background-transaction-tracker';
import { OpenApiSchema } from '../schema/services';
import Error from '../error';

const KAFKA_CLUSTER_ID_MAPPING = RPC_CONSTANTS.KAFKA_CLUSTER_ID_MAPPING;
let isEventInit = false;
const TRANSACTION_ID = '_transaction_id_';


const getPath = (SERVICE_TYPE) => {
  return RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.SRC_PATH[SERVICE_TYPE]
}

const getTopicsToSubscribe = (serviceId, EVENT_CONF) => {
  let topics =  _.get(EVENT_CONF, `topicsToConsume.${serviceId}`, []);
  const schema = OpenApiSchema.getOpenApiObj(serviceId, 0).schema
  const asyncAPIs = _.keys(_.pickBy(schema.paths, [`post.${RPC_CONSTANTS.IS_ASYNC}`, true]))
  const asyncTopics = _.map(asyncAPIs, (api) => { return (serviceId + api.split('/').join('_')).toLowerCase() })
  return _.concat(topics, asyncTopics)
}

const authorizeClient = (producerId, platformConf) => {
  if (!_.get(platformConf, 'authServiceIds', []).includes(producerId)){
    throw new Error.RPCError({
      err_type: Error.RPC_AUTH_ERROR,
      err_message: `${producerId} is not authorized to call this service.`
    })
  }
}

const initProducer = async(params, RPCFramework, inititiateProducer) => {
  let Singleton = RPCFramework.getSingleton();

  //Event Producer already initialised
  if (params.id in Singleton) {
    return;
  }

  let Config = Singleton.Config;
  let Slack = Singleton.Slack;

  let EventErrors;
  if(params.error_handler) {
    EventErrors = require(RPC_CONSTANTS.REPO_DIR_PATH + params.error_handler);
    Utils.validateVariableType(EventErrors, 'error_handler', 'function');
  }
  
  try {
    const EVENT_CONF = getEventConfig(Config.EVENT_CONF, params.id);
    let producer = await inititiateProducer(params.whitelisted_id || Config.SERVICE_ID, EVENT_CONF, EventErrors);
    
    const wrappedProducer = {
      sendEvent: (topic, payload, source, partitionKey, options) => {
        if(_.isEmpty(payload[TRANSACTION_ID])){
          payload[TRANSACTION_ID] = transactionContext.getTrxnId() || transactionContext.getRandomTrxnId();
        }
        return producer.sendEvent(topic, payload, source, partitionKey, options)
      }
    }
    
    RPCFramework.addToSingleton(params.singleton_id || params.id, wrappedProducer);
    isEventInit = true;
  } catch (err) {
    let logData = {};
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = err.err_type;
    logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.err_message;
    Logger.error(logData);
    Slack.sendSlackMessage(Config.SERVICE_ID, "Cannot instantiate producer " + err, RPC_CONSTANTS.DEPENDENCY.SLACK_ALERT_CHANNEL);
    throw err;
  }
}

const getEventConfig = (eventConfig, dependencyId) => {
  if(_.isUndefined(eventConfig[KAFKA_CLUSTER_ID_MAPPING[dependencyId]])) {
    throw new Error.RPCError({
      err_type: Error.DEPENDENCY_INITIALIZATION_ERROR,
      err_message: `${KAFKA_CLUSTER_ID_MAPPING[dependencyId]} event config not present`
    });
  }
  return _.cloneDeep(eventConfig[KAFKA_CLUSTER_ID_MAPPING[dependencyId]]);
}

export const Events ={
  initEventConsumer: async (params, RPCFramework) => {
    const EventLib = require('@uc-engg/trajectory');
    let Singleton = RPCFramework.getSingleton();
    let Config = Singleton.Config;
    let Slack = Singleton.Slack;
    const serviceId = params.whitelisted_id || Config.SERVICE_ID;
  
    let PATH = getPath(RPCFramework.SERVICE_TYPE)
    const EventMessageHandler = require(PATH + params.message_handler);
    const service = RPCFramework.service;
    Utils.validateVariableType(EventMessageHandler, 'message_handler', 'function');
  
    const MonitoredEventMessageHandler = async (topic, payload) => {
      const TRANSACTION_TYPE = 'event';
      const transactionId = payload[TRANSACTION_ID];
      const message = _.omit(payload, TRANSACTION_ID);
      let backgroundTrxnTrackerParams;
      if (_.get(payload, 'metadata.isAsyncApi')) {
        authorizeClient(payload['producerId'], Config.PLATFORM_CONF)
        const methodImplementation = Utils.getMethodImplementation(payload['metadata']['methodName'], service)
        backgroundTrxnTrackerParams = [TRANSACTION_TYPE, topic, methodImplementation, message];
      } else {
        backgroundTrxnTrackerParams = [TRANSACTION_TYPE, topic, EventMessageHandler, topic, message];
      }
  
      if (transactionId) {
        await transactionContext.wrapTrxnInAsyncFn(transactionId, BackgroundTransactionTracker, backgroundTrxnTrackerParams);
      } else {
        await BackgroundTransactionTracker(...backgroundTrxnTrackerParams);
      }
    }
  
    let EventErrors;
    if(params.error_handler) {
      EventErrors = require(PATH + params.error_handler);
      Utils.validateVariableType(EventErrors, 'error_handler', 'function');
    }
  
    try {
      const EVENT_CONF = getEventConfig(Config.EVENT_CONF, params.id);
      if (!params.options) { params.options = {} }
      if (KAFKA_CLUSTER_ID_MAPPING[params.id] === KAFKA_CLUSTER_ID_MAPPING.event_consumer) {
        params.options.whitelistedEvents = getTopicsToSubscribe(serviceId, EVENT_CONF)
      }
      const consumer = await EventLib.initConsumer(
        serviceId,
        EVENT_CONF,
        MonitoredEventMessageHandler,
        EventErrors,
        params.options)
      const wrappedConsumer = {
        close: () => consumer.close()
      }
  
      RPCFramework.addToSingleton(params.id, wrappedConsumer);
      isEventInit = true;
    } catch(err) {
      let logData = {};
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = err.err_type;
      logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = err.err_message;
      Logger.error(logData);
      Slack.sendSlackMessage(Config.SERVICE_ID, "Cannot instantiate consumer " + JSON.stringify(err.message || err) + JSON.stringify(err.stack), RPC_CONSTANTS.DEPENDENCY.SLACK_ALERT_CHANNEL);
      throw err;
    }
  },

  initEventProducer: async (params, RPCFramework) => {
    const EventLib = require('@uc-engg/trajectory');
    // To Do : Restructure avro code for better maintainability
    // let initProducerFunc = (params.schema_type == RPC_CONSTANTS.SCHEMA_TYPE.AVRO) ? EventLib.initAvroProducer : EventLib.initProducer;
  
    await initProducer(params, RPCFramework, EventLib.initProducer);
  },

  isLibraryInitialized: () => {
    return isEventInit;
  }
}