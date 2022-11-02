import { ACTION, RESULT_KEY } from './interface';

export const ACTION_TO_RESULT_KEY = {
  [ACTION.LIST]: RESULT_KEY.SCHEMAS_AVAILABLE,
  [ACTION.GET_SCHEMA]: RESULT_KEY.JSON_SCHEMA
};

export const ERROR_MESSAGE = {
  GATEWAY_SERVICE_NOT_AUTHORISED: 'Gateway services are not authorized to use getDBDetails API',
  NOT_AUTHORISED: 'Not Authorised',
  INVALID_ACTION: 'Invalid Action. Use "list" or "getSchema"',
  SCHEMA_NAME_MISSING: 'Missing required params: "schema_name"',
  DB_NAME_MISSING: 'Missing required params: "db_name"',
  INVALID_DB_TYPE: 'Invalid DB Type'
};