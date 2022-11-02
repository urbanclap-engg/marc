import * as _ from 'lodash';
import { LOG_CONSTANTS } from '../constants';
import { Validator as jsonValidator } from 'jsonschema';
import { getLogSchema } from '../../schema/logging';

const logSchema = getLogSchema();
const schemaValidator = new jsonValidator();


const stringifyDataEntries = (data, keysToStringify) => {
  _.values(keysToStringify).forEach(function (key) {
    if(data[key] && typeof data[key] !== "string") {
      data[key] = JSON.stringify(data[key]);
    }
  });
  return data;
}

export const Filter = {
  isSchemaValid: (data) => {
    return schemaValidator.validate(data, logSchema);
  },
  filterKeys: (object) => {
    return stringifyDataEntries(object, _.values(LOG_CONSTANTS.STRINGIFY_OBJECTS));
  }
};
