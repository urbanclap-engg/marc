import _ from 'lodash';
import { Cache } from './cache';
import { Mysql } from './mysql';
import { Microservice } from './microservice';
import { ExternalService } from './external_service';
import CONSTANTS from '../constants';

const DEPENDENCY = CONSTANTS.DEPENDENCY;


let cacheAuthParams = {
  id: DEPENDENCY.ID.CACHE.cache_platform,
  options: {
    'session-auth': {
      'high_availability' : true,
      'default_ttl' : 2592000,
      'registered_services': []
    }
  },
  singleton_id: 'AuthServiceCache'
}

let mysqlAuthParams = {
  id: DEPENDENCY.ID.MYSQL.mysql_auth_db,
  sequelize_options: {
    logging: false,
    pool: {
      min: 2,
      max: 4,
      idle: 60000
    }
  },
  sync: true,
  singleton_id: 'MysqlAuthDb'
}

const accessControlParams = {
  id: DEPENDENCY.ID.INTERNAL_SERVICE["access-control-service"],
  version: '0'
}

const googleCaptchaParams = {
  id: 'google_captcha',
  options: {}
};

export const AuthService = {
  initAuthService: async (params, RPCFramework) => {
    const Singleton = RPCFramework.getSingleton()
    _.set(mysqlAuthParams, 'sequelize_options.isolationLevel', require('sequelize').Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED)
    await Mysql.initMysqlClient(mysqlAuthParams, RPCFramework)
  
    _.set(cacheAuthParams, 'options.session-auth.registered_services', ['auth_service', Singleton.Config.SERVICE_ID])
    Cache.initCacheClient(cacheAuthParams, RPCFramework)
  
    const client = require('@uc-engg/acropolis')(Singleton);
    RPCFramework.addToSingleton(params.singleton_id || params.id, client); 
  
    // Init authorisation client
    Microservice.initMicroserviceClient(accessControlParams, RPCFramework);
  
    // Init Captcha client
    ExternalService.initExternalServiceClient(googleCaptchaParams, RPCFramework);
  }
}