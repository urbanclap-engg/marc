import * as _ from 'lodash';
import { getSingleton } from '../../singleton';
const Singleton = getSingleton();
import { Logger } from '../../logging/standard_logger';
import * as Error from '../../error';

import * as MongoDb from './mongodb';
import * as MySQL from './mysql';

import RPC_CONSTANTS from '../../constants';
const DEPENDENCY = RPC_CONSTANTS.DEPENDENCY;
import { ERROR_MESSAGE } from './constants';
import { ACTION } from './interface';

const DatabaseMap = {
  [DEPENDENCY.TYPE.MONGODB]: MongoDb.getMongoDBDetails,
  [DEPENDENCY.TYPE.MYSQL]: MySQL.getMySQLDetails
};

export const getDBDetails = async (req: { body: {
    action: ACTION, db_type: string, db_name: string, schema_name?: string
  }}, res) => {
  const {
    action, db_type: dbType, db_name: dbName, schema_name: schemaName
  } = req?.body || {};

  if (Singleton.GATEWAY_CONFIG) {
    Logger.error({ error_message: ERROR_MESSAGE.GATEWAY_SERVICE_NOT_AUTHORISED });
    res.status(500).json({ err_type: Error.RPC_AUTH_ERROR, err_message: ERROR_MESSAGE.NOT_AUTHORISED });
    return;
  }
  if (!Object.values(ACTION).includes(action)) {
    Logger.error({ error_message: ERROR_MESSAGE.INVALID_ACTION });
    res.status(500).json({ err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: ERROR_MESSAGE.INVALID_ACTION });
    return;
  }
  if (action === ACTION.GET_SCHEMA && _.isEmpty(schemaName)) {
    Logger.error({ error_message: ERROR_MESSAGE.SCHEMA_NAME_MISSING });
    res.status(500).json({ err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: ERROR_MESSAGE.SCHEMA_NAME_MISSING });
    return;
  }
  if (_.isEmpty(dbName)) {
    Logger.error({ error_message: ERROR_MESSAGE.DB_NAME_MISSING });
    res.status(500).json({ err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: ERROR_MESSAGE.DB_NAME_MISSING });
    return;
  }
  if (![DEPENDENCY.TYPE.MONGODB, DEPENDENCY.TYPE.MYSQL].includes(dbType)) {
    Logger.error({ error_message: ERROR_MESSAGE.INVALID_DB_TYPE });
    res.status(500).json({ err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: ERROR_MESSAGE.INVALID_DB_TYPE });
    return;
  }

  const { resultKey, resultValue } = await DatabaseMap[dbType](action, dbName, schemaName);

  return {
    [resultKey]: resultValue
  };
}