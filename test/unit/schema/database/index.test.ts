import * as DBDetails from '../../../../schema/database';
import { ERROR_MESSAGE } from '../../../../schema/database/constants';

describe('Testing getDBDetails API', () => {
  let statusCode: number = -1;
  let errType: string = '';
  let errMessage: string = '';
  const jsonObject = {
    json: jest.fn((error) => {
      errType = error.err_type
      errMessage = error.err_message
    })
  };
  const res = {
    status: jest.fn((val) => {
      statusCode = val;
      return jsonObject;
    })
  };

  test('Invalid value of action', () => {
    DBDetails.getDBDetails({
      body: {
        action: 'invalidAction',
        schema_name: 'ReviewStores_test',
        db_type: 'mysql',
        db_name: 'hiring_data'
      } as any
    }, res);
    expect(statusCode).toBe(500);
    expect(errType).toBe('rpc_request_invalid_error');
    expect(errMessage).toBe(ERROR_MESSAGE.INVALID_ACTION);
  });

  test('Action parameter not present', () => {
    DBDetails.getDBDetails({
      body: {
        schema_name: 'ReviewStors',
        db_type: 'mysql',
        db_name: 'hiring_data'
      } as any
    }, res);
    expect(statusCode).toBe(500);
    expect(errType).toBe('rpc_request_invalid_error');
    expect(errMessage).toBe(ERROR_MESSAGE.INVALID_ACTION);
  });

  test('Action = getSchema, schema_name not present', () => {
    DBDetails.getDBDetails({
      body: {
        action: 'getSchema',
        db_type: 'mysql',
        db_name: 'hiring_data',
      } as any
    }, res);
    expect(statusCode).toBe(500);
    expect(errType).toBe('rpc_request_invalid_error');
    expect(errMessage).toBe(ERROR_MESSAGE.SCHEMA_NAME_MISSING);
  });

  test('Action = list, db_name not present', () => {
    DBDetails.getDBDetails({
      body: {
        action: 'list',
        db_type: 'mysql',
        schema_name: 'table'
      } as any
    }, res);
    expect(statusCode).toBe(500);
    expect(errType).toBe('rpc_request_invalid_error');
    expect(errMessage).toBe(ERROR_MESSAGE.DB_NAME_MISSING);
  });

  test('Wrong db_type', () => {
    DBDetails.getDBDetails({
      body: {
        action: 'list',
        db_type: 'mysddql',
        schema_name: 'ReviewStores',
        db_name: 'hiring_data'
      } as any
    }, res);
    expect(statusCode).toBe(500);
    expect(errType).toBe('rpc_request_invalid_error');
    expect(errMessage).toBe(ERROR_MESSAGE.INVALID_DB_TYPE);
  });
});