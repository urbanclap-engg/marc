// This mock retrieves test-case name from message body field 'log_data.message'
// and uses that to fetch response from test data json
jest.mock('../../../../../retryable_promise', () => {
  const testData = require('../../../resources/rpc-client.test.data.json');
  return () => {
    return options => {
      return new Promise((resolve, reject) => {
        let testCaseName = options['body']['log_data']['message'];
        let response = testData[testCaseName]['response'];
        if (response['status'] != undefined) {
          resolve({
            body: response
          });
        } else {
          let statusCodeError = {
            error: response,
            message: response['err_message']
          };
          reject(statusCodeError);
        }
      });
    };
  };
});
