'use strict';

// Imports start
const _ = require('lodash');
const Singleton = require('../singleton').getSingleton();
const RpcConstants = require('../constants');
const LoadShedConstants = require('./constants');
const ScriptConstants = require('../scripts/common/constants');
const Error = require('../error');
const DateTime = require('luxon').DateTime;
const LoadShedUtil = require('./util');
const PrioritizedLoadShed = require('./strategy/prioritized');
const PercentageLoadShed = require('./strategy/percentage');
const LoadshedFilter = require('./strategy/filter');
// Imports end

// Initialization start
const LoadShed = {};
// Initialization end

LoadShed.loadShedManager = async function loadShedMiddleware(req, res, next){
  try {
    /*
      Allow the request if any one of the below condition matches
      1. loadshed strategy execution order is not defined
      2. loadShedxConfig does not exist for the api and client
      3. req is exceptional request (healthCheck)
      4. if isReqAllowed passes for the current loadshed percentage/priority
      If none of the above conditions meet reject the request with 429
      status code
     */
    if (!LoadShedConstants.LOADSHED_STRATEGY_EXECUTION_ORDER) {
      return next();
    }
    let isReqAllowed = true;
    let prioritizedLoadShed = false;
    const executionOrder = LoadShedConstants.LOADSHED_STRATEGY_EXECUTION_ORDER;
    for (let i = 0; i < executionOrder.length; i += 1) {
      const LoadShedStrategy = require(`./strategy/${executionOrder[i]}`);
      isReqAllowed = LoadShedStrategy.isRequestAllowed(req);
      if (executionOrder[i] === LoadShedConstants.PRIORITIZED_LOAD_SHED && !isReqAllowed) {
        prioritizedLoadShed = true;
      }
      if (isReqAllowed) break;
    }
    if (isReqAllowed) {
      return next();
    } else {
      let message = {};
      if (prioritizedLoadShed) {
        const PrioritizedLoadShed = require('./strategy/prioritized');
        message = PrioritizedLoadShed.getAPIClientLoadShedMap(req);
      }
      return next(new Error.RPCError({
        err_type: Error.REQUEST_LOAD_SHEDED,
        err_message: message ? JSON.stringify(message): "",
        code: RpcConstants.HTTP_RESPONSE_CODE_TOO_MANY_REQUESTS
      }));
    }
  } catch (error) {
    LoadShedUtil.logError(`error in loadshedding ${JSON.stringify(req)}`);
  }
  return next();
};


LoadShed.isDownStreamAPIAllowed = (serviceId, api, reqPriority) => {
  //If loadShedConfig dependency is not initialized allow the request
  const downstreamApiPriorityMap = Singleton[LoadShedConstants.DOWNSTREAM_APIS_PRIORITY_MAP];
  if (_.isEmpty(downstreamApiPriorityMap) || _.isEmpty(reqPriority)) {
    return true;
  }
  const serviceLoadShed = _.get(downstreamApiPriorityMap, serviceId);
  const apiLoadShed = _.get(serviceLoadShed, api);
  if (_.isEmpty(apiLoadShed)) return true;
  if (LoadShedUtil.isRouteExcluded(api)) return true;
  let isRequestAllowed =  PrioritizedLoadShed.isRequestPriorityAllowed(reqPriority, apiLoadShed.priority);
  return isRequestAllowed;
}


LoadShed.updateDownstreamServiceMap = (service, api, priority) => {
  const downstreamServicePriorityMap = Singleton[LoadShedConstants.DOWNSTREAM_APIS_PRIORITY_MAP];
  let serviceMap = _.get(downstreamServicePriorityMap, service);
  if (!serviceMap) serviceMap = {};
  serviceMap[api] = { priority, updatedAt: new Date() };
  downstreamServicePriorityMap[service] = serviceMap;
}

const updateStrategyMaps = async (RPCFramework) => {
  const percentageActiveLoadShedMap = Singleton[LoadShedConstants.PERCENTAGE_LOADSHED_MAP];
  const prioritizedActiveLoadShedMap = Singleton[LoadShedConstants.PRIORITIZED_LOADSHED_MAP];
  const SystemHealingServiceClient = RPCFramework.getSingleton()[ScriptConstants.SYSTEM_HEALING_SERVICE];
  const RPC_CONFIG = RPCFramework.getSingleton().Config;
  const response = await SystemHealingServiceClient.getActiveLoadShedding({ "serviceId": RPC_CONFIG.SERVICE_ID });
  const activeLoadShedDB = _.get(response, 'success.data') || {};
  PercentageLoadShed.updateActiveLoadShedMap(activeLoadShedDB.percentage, percentageActiveLoadShedMap, RPCFramework);
  PrioritizedLoadShed.updateActiveLoadShedMap(activeLoadShedDB.prioritized, prioritizedActiveLoadShedMap, RPCFramework);
}

LoadShed.updateActiveLoadShedMap = async (RPCFramework) => {
  await updateStrategyMaps(RPCFramework);
  await LoadshedFilter.updatePolicyMap(Singleton[LoadShedConstants.LOADSHED_POLICY_MAP], RPCFramework);
  PrioritizedLoadShed.updateDownstreamServiceLoadShedMap(Singleton[LoadShedConstants.DOWNSTREAM_APIS_PRIORITY_MAP], RPCFramework);
};

LoadShed.initLoadShedMaps = (RPCFramework) => {
  RPCFramework.addToSingleton(LoadShedConstants.PERCENTAGE_LOADSHED_MAP, {});
  RPCFramework.addToSingleton(LoadShedConstants.PRIORITIZED_LOADSHED_MAP, {});
  RPCFramework.addToSingleton(LoadShedConstants.DOWNSTREAM_APIS_PRIORITY_MAP, {});
  RPCFramework.addToSingleton(LoadShedConstants.LOADSHED_POLICY_MAP, {});
} 
module.exports = LoadShed;
