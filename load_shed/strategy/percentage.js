'use strict';

// Imports start
const _ = require('lodash');
const Singleton = require('../../singleton').getSingleton();
const LoadShedConstants = require('../constants');
const LoadShedUtil = require('../util');
// Imports end

// Initialization start
const PercentageLoadShed = {};
// Initialization end

PercentageLoadShed.isRequestAllowed = (req) => {
  // If loadShedConfig dependency is not initialized allow the request
  const activeLoadShedding = Singleton[LoadShedConstants.PERCENTAGE_LOADSHED_MAP];
  if (_.isEmpty(activeLoadShedding)) {
    return true;
  }
  /*
    Allow the request if any one of the below condition matches
    1. loadShedConfig does not exist for the api and client
    2. req is exceptional request (healthCheck)
    3. if toLoadShed passes for the current loadshed percentage
    If none of the above conditions meet reject the request with 429
    status code
   */
  const api = LoadShedUtil.getAPI(req);
  const apiLoadShed = _.get(activeLoadShedding, api);

  const client = LoadShedUtil.getClient(req);
  const clientApiLoadShed = _.get(apiLoadShed, client) || _.get(apiLoadShed, LoadShedConstants.ANY);
  if (_.isEmpty(clientApiLoadShed)) return true;
  if (LoadShedUtil.isRouteExcluded(api)) return true;
  let isReqAllowed = !(toLoadShed(req, clientApiLoadShed.shedPercentage));
  return isReqAllowed;
};


/*
  function to find if the request should be loadsheded by probablisitc approach
*/
const toLoadShed = (request, shedPercentage) => {
  const randomNum = Math.floor(Math.random() * 100) + 1;
  return (randomNum < shedPercentage);
}

PercentageLoadShed.updateActiveLoadShedMap = (activeLoadShedDB, activeLoadShedMap, RPCFramework) => {
  const newActiveLoadShed = {};
  activeLoadShedDB.forEach((activeLoadShed) => {
    const apiClient = `${activeLoadShed.api}.${activeLoadShed.client}`;
    let apiClientLoadShed = _.get(activeLoadShedMap, apiClient);
    newActiveLoadShed[activeLoadShed.api] = activeLoadShedMap[activeLoadShed.api] || {};
    if (apiClientLoadShed) {
      apiClientLoadShed.shedPercentage = activeLoadShed.shedPercentage;
      newActiveLoadShed[activeLoadShed.api][activeLoadShed.client] = apiClientLoadShed;
    } else {
      newActiveLoadShed[activeLoadShed.api][activeLoadShed.client] = {};
      newActiveLoadShed[activeLoadShed.api][activeLoadShed.client].shedPercentage = activeLoadShed.shedPercentage;
    }
  });
  RPCFramework.addToSingleton(LoadShedConstants.PERCENTAGE_LOADSHED_MAP, newActiveLoadShed);
}

module.exports = PercentageLoadShed;
