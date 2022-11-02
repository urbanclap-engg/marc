'use strict';

const Constants = {
  ExcludedRoutes : ['healthcheck'],
  ANY: 'ANY',
  LOADSHED_CONFIG: 'LoadShedConfig',
  PERCENTAGE_LOADSHED_MAP: 'PercentageLoadShedMap',
  PRIORITIZED_LOADSHED_MAP: 'PrioritizedLoadShedMap',
  LOADSHED_POLICY_MAP: 'LoadShedPolicyMap',
  DOWNSTREAM_APIS_PRIORITY_MAP: 'DownStreamApisPriorityMap',
  LOADSHED_STRATEGY_EXECUTION_ORDER: ['filter', "percentage"],
  PERCENTAGE_LOAD_SHED: 'percentage',
  PRIORITIZED_LOAD_SHED: 'prioritized'
};

module.exports = Constants;
