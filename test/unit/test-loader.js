module.exports = () => {
  const path = require('path');
  const fs = require('fs');
  const testSetup = {};
  // Importing common mocks from test/unit/mockers/mocks.js'
  testSetup.commonMock = require('./mockers/mock');

  const unitTestBasePath = require.main.filename.slice(
    0,
    require.main.filename.indexOf('test/unit') + 'test/unit'.length + 1
  );
  const testFileRelativePath = require.main.filename.slice(
    require.main.filename.indexOf('test/unit') + 'test/unit'.length,
    require.main.filename.lastIndexOf(path.sep) + 1
  );

  // Fully qualified path of the file containing mocks specific to a test suite(file)
  const mockFileName =
    require.main.filename.slice(
      require.main.filename.lastIndexOf(path.sep) + 1,
      require.main.filename.length - 8
    ) + '.mock';
  const mockFilePath =
    unitTestBasePath +
    'mockers' +
    testFileRelativePath +
    mockFileName +
    '.js';

  if (fs.existsSync(mockFilePath)) {
    testSetup.mock = require(mockFilePath);
  }

  // Fully qualified path of the file containing test data specific to a test suite(file)
  const testDataFileName =
    require.main.filename.slice(
      require.main.filename.lastIndexOf(path.sep) + 1,
      require.main.filename.length - 8
    ) + '.test.data';
  const testDataFilePath =
    unitTestBasePath +
    'resources' +
    testFileRelativePath +
    testDataFileName +
    '.json';
  if (fs.existsSync(testDataFilePath)) {
    testSetup.testData = require(testDataFilePath);
  }

  return testSetup;
};
