'use strict';

// Imports start
const _ = require('lodash');
const Singleton = require('../../singleton').getSingleton();
const LoadShedConstants = require('../constants');
const LoadShedUtil = require('../util');
// Imports end

// Initialization start
const PrioritizedLoadShed = {};
// Initialization end

PrioritizedLoadShed.isRequestPriorityAllowed = (reqPriority, clientApiLoadShed) => {
  const businessPriority = reqPriority.businessPriority
  const userPriority = reqPriority.userPriority
  let isReqAllowed = false;
  if (businessPriority > clientApiLoadShed.businessPriority) {
    isReqAllowed = true;
  } else if (businessPriority < clientApiLoadShed.businessPriority) {
    isReqAllowed = false;
  } else {
    if (userPriority > clientApiLoadShed.userPriority) {
      isReqAllowed = true;
    }
  }
  return isReqAllowed;
}

PrioritizedLoadShed.getAPIClientLoadShedMap = (req) => {
  const prioritizedLoadShedMap = Singleton[LoadShedConstants.PRIORITIZED_LOADSHED_MAP];
  const api = LoadShedUtil.getAPI(req);
  const client = LoadShedUtil.getClient(req);
  const apiLoadShed = _.get(prioritizedLoadShedMap, api);
  const mapClient = _.get(apiLoadShed, client) ? client : LoadShedConstants.ANY;
  const clientApiLoadShed = _.get(apiLoadShed, client) || _.get(apiLoadShed, LoadShedConstants.ANY);
  const apiClientLoadShed = { service: Singleton.Config['SERVICE_ID'], api, client: mapClient, priority: clientApiLoadShed.priority};
  return apiClientLoadShed;
}

PrioritizedLoadShed.isRequestAllowed = (req) => {
  // If loadShedConfig dependency is not initialized allow the request
  const prioritizedLoadShedMap = Singleton[LoadShedConstants.PRIORITIZED_LOADSHED_MAP];
  if (_.isEmpty(prioritizedLoadShedMap)) {
    return true;
  }
  const reqPriority = _.get(req, 'priority');
  if (!reqPriority) return true;
  const api = LoadShedUtil.getAPI(req);
  const client = LoadShedUtil.getClient(req);

  const apiLoadShed = _.get(prioritizedLoadShedMap, api);
  const clientApiLoadShed = _.get(apiLoadShed, client) || _.get(apiLoadShed, LoadShedConstants.ANY);
  if (_.isEmpty(clientApiLoadShed)) return true;
  if (LoadShedUtil.isRouteExcluded(api)) return true;
  let isReqAllowed = PrioritizedLoadShed.isRequestPriorityAllowed(reqPriority, clientApiLoadShed.priority); // loadshedStrategy
  return isReqAllowed;
};

// Assigns lowest priority to the request if no API doesnt have any primary key priority assigned
const assignLowestPriority = (req) => {
  req.priority = {};
  req.priority.businessPriority = 1;
  req.priority.userPriority = _.get(req, 'headers.authorization') ? 2 : 1;
  return req.priority;
}

// Assigns priority as per the incoming request params and apiKeyPriorityMap.
PrioritizedLoadShed.assignPriorityToRequest = (req) => {
  const api = LoadShedUtil.getAPI(req);
  const apiKeyPriorityMap = _.get(Singleton, 'Config.CUSTOM.apiKeyPriorityMap');
  const paramsPriorityOfApi = _.get(apiKeyPriorityMap, api);
  if (!paramsPriorityOfApi) {
    assignLowestPriority(req);
  } else {
    const loadShedPrimaryKey = Object.keys(paramsPriorityOfApi)[0];
    const paramVal = req.body[loadShedPrimaryKey];
    if (!_.get(paramsPriorityOfApi, `${loadShedPrimaryKey}.${paramVal}`)) {
      assignLowestPriority(req)
    } else {
      req.priority = {};
      req.priority.businessPriority = _.get(paramsPriorityOfApi, `${loadShedPrimaryKey}.${paramVal}`);
      req.priority.userPriority = _.get(req, 'headers.authorization') ? 2 : 1;
    }
  }
  return req.priority;
}


PrioritizedLoadShed.isDownStreamAPIAllowed = async (req, serviceId, api, client) => {
  // If loadShedConfig dependency is not initialized allow the request
  const downstreamApiPriorityMap = Singleton[LoadShedConstants.DOWNSTREAM_APIS_PRIORITY_MAP];
  if (_.isEmpty(downstreamApiPriorityMap)) {
    return true;
  }
  const reqPriority = _.get(req, 'priority');
  if (!reqPriority) return true;
  const serviceLoadShed = _.get(downstreamApiPriorityMap, serviceId);
  const apiLoadShed = _.get(serviceLoadShed, api);
  const clientApiLoadShed = _.get(apiLoadShed, client) || _.get(apiLoadShed, LoadShedConstants.ANY);
  if (_.isEmpty(clientApiLoadShed)) return true;
  if (LoadShedUtil.isRouteExcluded(api)) return next();
  let isRequestAllowed = PrioritizedLoadShed.isRequestPriorityAllowed(reqPriority, clientApiLoadShed);
  return isRequestAllowed;
}

PrioritizedLoadShed.updateActiveLoadShedMap = (activeLoadShedDB, activeLoadShedMap, RPCFramework) => {
  const newActiveLoadShed = {};
  activeLoadShedDB.forEach((activeLoadShed) => {
    const apiClient = `${activeLoadShed.api}.${activeLoadShed.client}`;
    let apiClientLoadShed = _.get(activeLoadShedMap, apiClient);
    newActiveLoadShed[activeLoadShed.api] = activeLoadShedMap[activeLoadShed.api] || {};
    if (apiClientLoadShed) {
      apiClientLoadShed.priority = activeLoadShed.admissionControl;
      newActiveLoadShed[activeLoadShed.api][activeLoadShed.client] = apiClientLoadShed;
    } else {
      newActiveLoadShed[activeLoadShed.api][activeLoadShed.client] = {};
      newActiveLoadShed[activeLoadShed.api][activeLoadShed.client].priority = activeLoadShed.admissionControl;
    }
  });
  RPCFramework.addToSingleton(LoadShedConstants.PRIORITIZED_LOADSHED_MAP, newActiveLoadShed);
}

PrioritizedLoadShed.updateDownstreamServiceLoadShedMap = (downstreamServiceMap, RPCFramework) => {
  const newDownstreamServiceMap = {};
  Object.keys(downstreamServiceMap).forEach((service) => {
    Object.keys(downstreamServiceMap[service]).forEach((api) => {
      const currentTime = new Date();
      if (currentTime - downstreamServiceMap[service][api].updatedAt < 60 * 1000) {
        if (!newDownstreamServiceMap[service]) newDownstreamServiceMap[service] = {};
        newDownstreamServiceMap[service][api] = downstreamServiceMap[service][api];
      }
    })
  })
  RPCFramework.addToSingleton(LoadShedConstants.DOWNSTREAM_APIS_PRIORITY_MAP, newDownstreamServiceMap);
}

module.exports = PrioritizedLoadShed;
