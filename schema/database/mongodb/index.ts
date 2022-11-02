import { MongoSchemaDetails } from './schema_details';

import { ACTION_TO_RESULT_KEY } from '../constants';
import { ACTION } from '../interface';

export const getMongoDBDetails = (action: ACTION, dbName: string, schemaName: string) => {
  const resultKey = ACTION_TO_RESULT_KEY[action];
  const resultValue = (action === ACTION.LIST) ?
    MongoSchemaDetails.listAllMongoDBSchemas() :
    MongoSchemaDetails.fetchMongoDBSchema(dbName, schemaName);

  return {
    resultKey, resultValue
  };
};