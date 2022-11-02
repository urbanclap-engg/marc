'use strict';

import _ from 'lodash';
import { OpenApiSchema } from '../../../schema/services/';
import Constants from '../../../constants';
import fs from 'fs';
const DIR = '../marc/types/';
import { bulkDtsGenerator } from '@uc-engg/type-swagger';
const RPCServices = Constants.DEPENDENCY.ID.INTERNAL_SERVICE;

export const TypeGenerator = {
  /*********
   * this method creates type declaration files from internal service swagger schemas
   * files gets written inside ${DIR}
  */
  createDtsFilesForServiceSchemas: async (currentServiceName: string) => {
    //build input for dts generator
    const dtsInput = createDtsInput(currentServiceName);
    const dtsDetailsArr = await bulkDtsGenerator(dtsInput);
    await Promise.all(_.map(dtsDetailsArr, async dtsDetails => {
      if (!dtsDetails.error) {
        writeToFile(dtsDetails.filename, dtsDetails.fileContent);
      }
    }));
  }
};

/*******
 * utility function to create input for dts generator
 * @returns {
 * [{
 *  key: string,
 *  contents: [object]
 * }]
 * }
 */
const createDtsInput = (currentServiceName: string) => {
  const dtsInput = [];
  OpenApiSchema.init(currentServiceName);
  _.forEach(RPCServices, serviceId => {
    const schema = getSchemaObject(serviceId);
    if (schema){
      dtsInput.push({
        key: serviceId,
        contents: [schema]
      })
    }
  })
  return dtsInput;
}

/*******
 * utility function to return swagger schema for serviceId
 * @param serviceId
 * @returns {schema/void}
 */
const getSchemaObject = (serviceId) => {
  try {
    return OpenApiSchema.getOpenApiObj(serviceId, 0).schema;
  } catch (e) {
    //openapi_obj_not_found error can be thrown from the above call
    //catching it will ignore dts creation for given serviceId
  }
}

/******
 * utility function to write data to files inside ${DIR}
 * @param filename
 * @param fileContent
 */
const writeToFile = (filename: string, fileContent: string) => {
  if (!fs.existsSync(DIR))
    fs.mkdirSync(DIR);
  fs.writeFile(`${DIR}${filename}`, fileContent, (error) => {
    if (error) throw error;
  });
};