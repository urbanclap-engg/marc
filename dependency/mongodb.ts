import { LOG_CONSTANTS, LOG_TYPE } from '../logging/constants';
import RPC_CONSTANTS from '../constants';
import { ConfigUtils } from '../common/config_utils';
import _ from 'lodash';
import { Utils } from './utils';
import path from 'path';

const MONGODB_CONNECTION_OPTIONS = RPC_CONSTANTS.MONGODB_CONNECTION_OPTIONS;


export const Mongodb = {
  initMongodbClient: async (params, RPCFramework) => {
    const Config = RPCFramework.getSingleton().Config;
    const Logger = RPCFramework.getSingleton().Logger;
  
    return new Promise<void>((resolve, reject) => {
      let isConnectedBefore = false;
      let mongoose = require('mongoose');
  
      setMongooseLeanOption(params, mongoose);
  
      mongoose.Promise = Promise;
      
      setTimeoutOptions(params);
  
      let conn = mongoose.createConnection(Config.getDBConf(params.id).uri, params.mongoose_options);
  
      conn.on('open', () => {
        isConnectedBefore = true;
        let logData = {};
        logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = RPC_CONSTANTS.DEPENDENCY.CONNECTION.MONGODB_CONNECTION;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "open";
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'dn_name';
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = params.id;
        Logger.info(logData);
        resolve();
      });
  
      conn.on('error', () => {
        let logData = {};
        logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = RPC_CONSTANTS.DEPENDENCY.CONNECTION.MONGODB_CONNECTION;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "error";
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'dn_name';
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = params.id;
        Logger.error(logData);
  
        if (!isConnectedBefore) {
          process.exit(1);
        }
      });
  
      conn.on('disconnected', () => {
        let logData = {};
        logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = RPC_CONSTANTS.DEPENDENCY.CONNECTION.MONGODB_CONNECTION;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "disconnected";
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'dn_name';
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = params.id;
        Logger.error(logData);
      });
  
      conn.on('reconnected', () => {
        let logData = {};
        logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = RPC_CONSTANTS.DEPENDENCY.CONNECTION.MONGODB_CONNECTION;
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "reconnected";
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'dn_name';
        logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = params.id;
        Logger.info(logData);
      });
      if(params.models){
        _.forEach(params.models, function(model_object) {
          if (model_object.name && model_object.model) conn.model(model_object.name, model_object.model);
          else Utils.logAndRaiseError('Either name or model is missing in model_object. Please check configurations.');
        });
      }
  
      let mongoOptionsData = {};
      mongoOptionsData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      mongoOptionsData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'mongoose_options';
      mongoOptionsData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = JSON.stringify(conn.options || conn._connectionOptions);
      mongoOptionsData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'database_id';
      mongoOptionsData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = params.id;
      Logger.info(mongoOptionsData);
  
      RPCFramework.addToSingleton(params.singleton_id || params.id, conn);
    })
  }
}

//Logic for internal use

const setMongooseLeanOption = (params, mongoose) => {
  if (_.get(params.mongoose_options, 'enableGlobalLean') === true) {
    const __setOptions = mongoose.Query.prototype.setOptions;
    mongoose.Query.prototype.setOptions = function (options, overwrite) {
      __setOptions.apply(this, arguments);
      if (this.mongooseOptions().lean == null)
        this.mongooseOptions({lean: true});
      return this;
    };
  }
}

const setTimeoutOptions = (params) => {
  if (!_.has(params, 'mongoose_options')){
    params.mongoose_options = {}
  }
  let timeoutOptions = {
    socketOptions: {
      socketTimeoutMS: MONGODB_CONNECTION_OPTIONS.DEFAULT_SOCKET_TIMEOUT_MS,
      connectTimeoutMS: MONGODB_CONNECTION_OPTIONS.DEFAULT_CONNECT_TIMEOUT_MS
    }
  }
  if (_.has(params.mongoose_options, MONGODB_CONNECTION_OPTIONS.SOCKET_TIMEOUT_OPTION_KEY)){
    timeoutOptions.socketOptions.socketTimeoutMS = params.mongoose_options[MONGODB_CONNECTION_OPTIONS.SOCKET_TIMEOUT_OPTION_KEY];
  }
  if (_.has(params.mongoose_options, MONGODB_CONNECTION_OPTIONS.CONNECT_TIMEOUT_OPTION_KEY)){
    timeoutOptions.socketOptions.connectTimeoutMS = params.mongoose_options[MONGODB_CONNECTION_OPTIONS.CONNECT_TIMEOUT_OPTION_KEY];
  }
  // requiring package.json
  const pjson = require(path.join(ConfigUtils.getParentWorkingDir(), 'package.json'));
  const mongooseVersion = parseInt(pjson.dependencies.mongoose.replace(/~|\^/g, ''))
  if ( mongooseVersion < 5 ) {
    params.mongoose_options['replset'] = timeoutOptions
  }
  else {
    params.mongoose_options['socketTimeoutMS'] = timeoutOptions.socketOptions.socketTimeoutMS;
    params.mongoose_options['connectTimeoutMS'] = timeoutOptions.socketOptions.connectTimeoutMS;
  }
}