'use strict';
const _ = require('lodash');

function getMonitoringParameters(headers, http_code, error_type, env) {

	const monitoringParams = {};
	monitoringParams['http_code'] = http_code;
	monitoringParams['error_type'] = error_type;
	monitoringParams['env'] = env;
	monitoringParams['start_time'] = _.get(headers, 'start_time_ms');
	monitoringParams['nw_start_time'] = _.get(headers, 'nw_start_time_ms');
	monitoringParams['client_id'] = _.get(headers, 'client_id');
	monitoringParams['external_service_id'] = _.get(headers, 'external_service_id');
	monitoringParams['route'] = '/' + _.get(headers, 'external_service_id') + '/' + _.get(headers, 'method_name');
	return monitoringParams;

}


module.exports = {
	getMonitoringParameters,
}