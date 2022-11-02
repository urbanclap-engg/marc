import * as _ from 'lodash';
import { getSingleton } from '../../../singleton';
const Singleton = getSingleton();
import { Logger }  from '../../../logging/standard_logger';

import { convertMySqlSchemaToJson } from './json_schema';

import { SchemaDetailsInterface } from './interface';
import * as RPC_CONSTANTS from '../../../constants';

export const MySqlSchemaDetails: SchemaDetailsInterface = {
  fetchMySqlSchema: async (dbName, tableName) => {
    const mySqlDBList = MySqlSchemaDetails.getAllMySqlDBs();
    const mySqlDB = _.get(mySqlDBList, dbName);

    if (!mySqlDB) {
      Logger.error({
        method_name: 'fetchMySqlSchema',
        error_message: `${dbName} doesn't exist`
      });
      return {};
    }

    try {
      const schemaQuery = `DESC ${mySqlDB?.config?.database}.${tableName}`;
      const tableSchema = await mySqlDB.query(schemaQuery);
      return convertMySqlSchemaToJson(tableSchema[0]);
    } catch (err) {
      Logger.error({
        method_name: 'fetchMySqlSchema',
        error_message: `${tableName} doesn't exist in ${dbName}`
      });
      return {};
    }
  },
  listAllMySqlTables: async (dbName) => {
    const mySqlDBList = MySqlSchemaDetails.getAllMySqlDBs();
    const mySqlDB = _.get(mySqlDBList, dbName);

    if (!mySqlDB) {
      Logger.error({
        method_name: 'listAllMySqlTables',
        error_message: `${dbName} doesn't exist`
      });
      return {};
    }
    const tables = await mySqlDB.getQueryInterface().showAllSchemas();
    const tableList = tables.map(obj => obj[Object.keys(obj)[0]]);
    return {
      [dbName]: tableList
    };
  },
  getAllMySqlDBs: () => {
    const dependencyConfig = require(RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.DEPENDENCY.CONFIG_PATH);
    const mySqlDependencies = _.get(dependencyConfig, `Config.service.${RPC_CONSTANTS.DEPENDENCY.TYPE.MYSQL}`, []);

    return mySqlDependencies.reduce((mySqlDBs, mySqlDependency) => {
      const mySqlSingletonId = mySqlDependency.id;
      const mySqlDB = Singleton[mySqlSingletonId];
      return {
        ...mySqlDBs,
        [mySqlSingletonId]: mySqlDB
      };
    }, {});
  }
};