const testSetup = require('../test-loader')();
const LoggingRepo = require('@uc-engg/logging-repo').initLogger();
const testData = testSetup.testData;


describe('test standard logger', () => {
  let Logger: any = null;
  beforeEach(() => {
    jest.unmock('../../../logging/standard_logger');
    Logger = require('../../../logging/standard_logger').Logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('log api request and successful response', async () => {
    // Arrange - arrange test data and expected result
    const httpResponse = {};
    const metaData = {};
    Object.assign(httpResponse, testData.api.success.response);
    Object.assign(metaData, testData.api.failure.extra);

    // Act - call function to be tested and receive result
    Logger.api_success(httpResponse, metaData);

    // Assert - validate received result with expected result using `expect` matchers
    expect(LoggingRepo.info).toBeCalled();
  });

  test('log api request and error response', async () => {
    // Arrange - arrange test data and expected result
    const httpResponse = {};
    const metaData = {};
    const errorData = {};
    Object.assign(httpResponse, testData.api.success.response);
    Object.assign(metaData, testData.api.failure.extra);
    Object.assign(errorData, testData.api.failure.error);

    // Act - call function to be tested and receive result
    Logger.api_error(httpResponse, metaData, errorData);

    // Assert - validate received result with expected result using `expect` matchers
    expect(LoggingRepo.error).toBeCalled();
  });

  test('log data with DEBUG log level', async () => {
    // Arrange - arrange test data and expected result
    const data = {};
    Object.assign(data, testData.service.dataWithValidSchema);

    // Act - call function to be tested and receive result
    Logger.debug({ debug_mode: true }, data);

    // Assert - validate received result with expected result using `expect` matchers
    expect(LoggingRepo.debug).toBeCalled();
  });

  test('log data with INFO log level', async () => {
    // Arrange - arrange test data and expected result
    const data = {};
    Object.assign(data, testData.service.dataWithValidSchema);

    // Act - call function to be tested and receive result
    Logger.info(data);

    // Assert - validate received result with expected result using `expect` matchers
    expect(LoggingRepo.info).toBeCalled();
  });

  test('log data with ERROR log level', async () => {
    // Arrange - arrange test data and expected result
    const data = {};
    Object.assign(data, testData.service.dataWithValidSchema);

    // Act - call function to be tested and receive result
    Logger.error(data);

    // Assert - validate received result with expected result using `expect` matchers
    expect(LoggingRepo.error).toBeCalled();
  });

  test('log data with invalid log schema', async () => {
    // Arrange - arrange test data and expected result
    const data = {};
    Object.assign(data, testData.service.dataWithInvalidSchema);

    // Act - call function to be tested and receive result
    Logger.error(data);

    // Assert - validate received result with expected result using `expect` matchers
    expect(LoggingRepo.error).toBeCalled();
  });
});
