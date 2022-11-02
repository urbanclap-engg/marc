const Singleton = require('../../../../singleton');
jest.spyOn(Singleton, 'getSingleton').mockImplementation(() => {
  return {
    Logger: {
      error: (logData) => logData,
      info: (logData) => logData
    }
  }
});