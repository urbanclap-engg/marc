/**
 * Validates Upstream Red dependencies for the current service
 */
import _ from 'lodash';
import { ScriptUtils } from '../common/script-utils';
import RequestPromise from 'request-promise';
import CONSTANTS from '../common/constants';
import RPC_CONSTANTS from '../../constants';
import bluebird from 'bluebird';

const PARENT_SERVICE_PLATFORM_CONFIG = ScriptUtils.getServicePlatformConfig();
const SERVICE_NAME = ScriptUtils.getServiceName();

const callPlatformConfigService = (methodName: string, params: object) => {
  const endpoint = RPC_CONSTANTS.PLATFORM_CONFIG_SERVICE.PROD_URI;
  const clientId = SERVICE_NAME;

  const options = {
    method: 'POST',
    uri: `http://${endpoint}/${CONSTANTS.PLATFORM_CONFIG_SERVICE}/${methodName}?client_id=${clientId}`,
    json: true,
    headers: { 'Content-Type': 'application/json' },
    body: params
  };

  return RequestPromise(options).promise().catch(err => console.log('Issue while calling platform config service', err));
}

const isNewDependencyAllowed = async(serviceId: string) => {
  const response = await callPlatformConfigService('isNewDependencyAllowed', {
    service: serviceId,
    downstreamService: SERVICE_NAME
  });
  return !_.get(response, 'success.data', true);
}

export const validateRedDependency = async () => {
  const authorizedServiceIds = _.get(PARENT_SERVICE_PLATFORM_CONFIG, 'authServiceIds', []);
  const redDependencies = await bluebird.filter(authorizedServiceIds, isNewDependencyAllowed, { concurrency: 10 });

  if (_.isEmpty(redDependencies)) {
    console.log(`No red dependencies found for ${SERVICE_NAME}`);
    
    process.exit(0);
  } else {
    console.log('Red dependencies found');
    console.log(`Given services should not be allowed to call ${SERVICE_NAME}: ${redDependencies}`);
    console.log('Red Dependency Classification Rules: ', 'Dependency+Classification#Red page on confluence')
    
    process.exit(1);
  }
}