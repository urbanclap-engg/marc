'use strict';

// Imports start
const _ = require('lodash');
const Singleton = require('../../singleton').getSingleton();
const LoadShedConstants = require('../constants');
const LoadShedUtil = require('../util');
const ScriptConstants = require('../../scripts/common/constants');
// Imports end

// Initialization start
const FilterLoadShed = {};
// Initialization end

FilterLoadShed.filterRequest = (req, loadShedFilters) => {
  const paramKey = Object.keys(loadShedFilters)[0];
  const filterVals = _.get(loadShedFilters, paramKey);
  if (_.find(filterVals, (filter) => filter === LoadShedConstants.ANY)) return false;
	const paramVal = _.get(req, `body.${paramKey}`);
  if (_.find(filterVals, (filter) => filter === paramVal)) return false;
  return true;
}

FilterLoadShed.isRequestAllowed = (req) => {
  // If loadShedConfig dependency is not initialized allow the request
  const loadShedFilters = Singleton[LoadShedConstants.LOADSHED_POLICY_MAP];
  if (_.isEmpty(loadShedFilters)) return false;
  const api = LoadShedUtil.getAPI(req);
  if (LoadShedUtil.isRouteExcluded(api)) return true;
  const apiFilter = _.get(loadShedFilters, api);
  const client = LoadShedUtil.getClient(req);
  const clientApiLoadShedFilter = _.get(apiFilter, client) || _.get(apiFilter, LoadShedConstants.ANY);
  /*
    Allow the request if the key in loadShedFilters is not ANY or key doesn't exist in req params 
  */
  if (_.isEmpty(clientApiLoadShedFilter)) return false;
  return FilterLoadShed.filterRequest(req, clientApiLoadShedFilter);
};

const getLoadShedPolicy = async (RPCFramework) => {
	const PlatformConfigServiceClient = RPCFramework.getSingleton()[ScriptConstants.PLATFORM_CONFIG_SERVICE];
  const RPC_CONFIG = RPCFramework.getSingleton().Config;
  const response = await PlatformConfigServiceClient.getLoadShedPolicy({ "serviceId": RPC_CONFIG.SERVICE_ID });
  return _.get(response, 'success.data') || [];
}

FilterLoadShed.updatePolicyMap = async (policyMap, RPCFramework) => {
  const newpolicy = {};
  const policyMapDB = await getLoadShedPolicy(RPCFramework);
  policyMapDB.forEach((policy) => {
    const apiClient = `${policy.api}.${policy.client}`;
    let apiClientLoadShedFilter = _.get(policyMap, apiClient);
    newpolicy[policy.api] = policyMap[policy.api] || {};
    if (apiClientLoadShedFilter) {
      apiClientLoadShedFilter = policy.filter;
      newpolicy[policy.api][policy.client] = apiClientLoadShedFilter;
    } else {
      newpolicy[policy.api][policy.client] = policy.filter;
    }
  });
  RPCFramework.addToSingleton(LoadShedConstants.LOADSHED_POLICY_MAP, newpolicy);
}
module.exports = FilterLoadShed;
