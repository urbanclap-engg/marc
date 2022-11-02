const path = require('path');
const _ = require('lodash');

const { ConfigUtils } = require('../../../common/config_utils');
jest.spyOn(ConfigUtils, 'getGlobalConfigsDir').mockImplementation(() => {
  const REPO_DIR_PATH = _.split(process.cwd(), '/node_modules')[0];
  return path.join(REPO_DIR_PATH, '/test/configs/');
});

const scriptConstants = require('../../../scripts/common/constants');
jest.doMock('../../../scripts/common/constants', () => {
  scriptConstants.SERVICE_PLATFORM_CONFIG.CONFIG_PATH = 
      '/test/configs/platform.config.json';
  return scriptConstants;
});

