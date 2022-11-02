'use strict'

/*******
 * Utility to convert swagger schemas to type declaration files
 */
import { TypeGenerator } from './type_generator';
import _ from 'lodash';
import { ConfigUtils } from '../../../common/config_utils';
const PARENT_SERVICE_PACKAGE_JSON = require(ConfigUtils.getParentWorkingDir() + '/package.json');
const CURRENT_SERVICE_NAME = PARENT_SERVICE_PACKAGE_JSON.name;


const isSwaggerToTsEnabled = (jsonConfig: any) => {
  return _.get(jsonConfig, 'urbanclap.generate_swagger_ts', '') === 'enabled';
}

export const createDtsFilesForServiceSchemas = async () => {
  if (isSwaggerToTsEnabled(PARENT_SERVICE_PACKAGE_JSON)){
    await TypeGenerator.createDtsFilesForServiceSchemas(CURRENT_SERVICE_NAME);
  }
}