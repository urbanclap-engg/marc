require('./rpc-config.mock.js');
jest.doMock('../../../logging/standard_logger');
jest.doMock('@uc-engg/armor');
let executeMock = jest.fn(() => Promise.resolve({ data: {} }));
require('@uc-engg/armor').initCircuitBreaker.mockImplementationOnce(() => ({
  execute: executeMock
}));

module.exports = {
  executeMock
}