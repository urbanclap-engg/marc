import { MySqlSchemaDetails } from './schema_details'

import { ACTION_TO_RESULT_KEY } from '../constants';
import { ACTION } from '../interface'

export const getMySQLDetails = async (action: ACTION, dbName: string, tableName: string) => {
  const resultKey = ACTION_TO_RESULT_KEY[action];
  const resultValue = (action === ACTION.LIST) ?
    await MySqlSchemaDetails.listAllMySqlTables(dbName) :
    await MySqlSchemaDetails.fetchMySqlSchema(dbName, tableName);

  return {
    resultKey, resultValue
  };
};