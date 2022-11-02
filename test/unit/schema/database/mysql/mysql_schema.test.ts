import { MySqlSchemaDetails } from '../../../../../schema/database/mysql/schema_details';
import { getDataType, castDefaultValueToFieldType, convertMySqlSchemaToJson } from '../../../../../schema/database/mysql/json_schema';
import { DATA_TYPES } from '../../../../../schema/database/mysql/constants';
import * as Mocks from '../mock';

describe('Testing fetchMySqlSchema', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(MySqlSchemaDetails, 'getAllMySqlDBs').mockImplementation(() => ({
      mysql_hiring_data: {
        query: () => Promise.resolve(Mocks.MYSQL_SCHEMA)
      }
    }));
  });

  test('Correct db_name but getting empty value returned from getAllMySqlDBs', async () => {
    jest.spyOn(MySqlSchemaDetails, 'getAllMySqlDBs').mockImplementation(() => {
      return {};
    });
    const response = await MySqlSchemaDetails.fetchMySqlSchema('mysql_hiring_data', 'ReviewStores');
    expect(response).toMatchObject({});
  });

  test('Incorrect db_name and getAllMySqlDBs() returning correct mySQLDB object ', async () => {
    const response = await MySqlSchemaDetails.fetchMySqlSchema('wrong_db', 'ReviewStores');
    expect(response).toStrictEqual({});
  });

  test('Correct db_name and getAllMySqlDBs() returning correct mySQLDB object ', async () => {
    const response = await MySqlSchemaDetails.fetchMySqlSchema('mysql_hiring_data', 'ReviewStores');
    expect(response).toStrictEqual(Mocks.JSON_SCHEMA);
  });
});

describe('Testing listAllMySqlTables()', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(MySqlSchemaDetails, 'getAllMySqlDBs').mockImplementation(() => ({
      mysql_hiring_data: {
        getQueryInterface: () => ({
          showAllSchemas: () => Mocks.TABLE_LIST_QUERY_RESULT
        })
      }
    }));
  });

  test('Correct db_name with correct table list', async () => {
    const dbName = 'mysql_hiring_data';
    const response = await MySqlSchemaDetails.listAllMySqlTables(dbName);
    expect(response).toStrictEqual({
      [dbName]: Mocks.TABLE_NAMES_LIST
    });
  });

  test('Wrong db_name with correct table list', async () => {
    const response = await MySqlSchemaDetails.listAllMySqlTables('wrong_db');
    expect(response).toStrictEqual({});
  });
});

describe('Testing getDataType()', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  test('Correct sql data type provided - BOOLEAN', async () => {
    const response = getDataType('BOOLEAN');
    expect(response).toStrictEqual(DATA_TYPES.BOOLEAN);
  });
  test('Correct sql data type provided - DATETIME', async () => {
    const response = getDataType('DATETIME');
    expect(response).toStrictEqual(DATA_TYPES.STRING);
  });
  test('Correct sql data type provided - TINYINT', async () => {
    const response = getDataType('TINYINT');
    expect(response).toStrictEqual(DATA_TYPES.INTEGER);
  });
  test('Correct sql data type provided - bigint', async () => {
    const response = getDataType('FLOAT');
    expect(response).toStrictEqual(DATA_TYPES.NUMBER);
  });
  test('Wrong sql data type provided', async () => {
    const response = getDataType('dummy_type');
    expect(response).toStrictEqual(DATA_TYPES.STRING);
  });
});

describe('Testing castDefaultValueToFieldType()', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  test('Correct conversion of number data type', async () => {
    const response = castDefaultValueToFieldType('3.5', DATA_TYPES.NUMBER);
    expect(response).toStrictEqual(3.5);
  });
  test('Correct conversion of boolean data type', async () => {
    const response = castDefaultValueToFieldType('true', DATA_TYPES.BOOLEAN);
    expect(response).toStrictEqual(true);
  });
  test('Correct conversion of string data type', async () => {
    const response = castDefaultValueToFieldType('PROVIDER', DATA_TYPES.STRING);
    expect(response).toStrictEqual('PROVIDER');
  });
});

describe('Testing convertMySqlSchemaToJson()', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  test('Correct conversion of mysql schema', async () => {
    const response = convertMySqlSchemaToJson(Mocks.MYSQL_SCHEMA[0]);
    expect(response).toStrictEqual(Mocks.JSON_SCHEMA);
  });
});