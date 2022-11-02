import _ from 'lodash';
import { Utils } from './utils';

const TYPEORM_DB_TYPE = "mysql"


const initSequelizeClient = (params, RPCFramework) => {
  const Sequelize = require('sequelize');
  const Config = RPCFramework.getSingleton().Config;
  const mysqlDb = new Sequelize(Config.getDBConf(params.id).uri, params.sequelize_options);
  if(params.sync) mysqlDb.sync();
  if(params.is_cls) {
    const cls = require('continuation-local-storage');
    const namespace = cls.createNamespace('sequalise-namespace');
    Sequelize.useCLS(namespace);
  }
  if(params.models){
    Utils.logAndRaiseError('models allowed only in params for sequelize-typescript. Please correct dependency.config.json.')
  }
  RPCFramework.addToSingleton(params.singleton_id || params.id, mysqlDb);
};

const initSequelizeTypescriptClient = (params, RPCFramework) => {
  const Sequelize = require('sequelize-typescript').Sequelize
  const Config = RPCFramework.getSingleton().Config;
  const mysqlDb = new Sequelize(Config.getDBConf(params.id).uri, params.sequelize_options);
  if(params.models) mysqlDb.addModels(params.models);
  if(params.sync) mysqlDb.sync();
  RPCFramework.addToSingleton(params.singleton_id || params.id, mysqlDb);
};

const initTypeormClient = async (params, RPCFramework) => {
  const TypeormTransactionalClsHooked = require('typeorm-transactional-cls-hooked');
  TypeormTransactionalClsHooked.initializeTransactionalContext();
  const Typeorm = require('typeorm');
  const Config = RPCFramework.getSingleton().Config;
  const dbURI = Config.getDBConf(params.id).uri;
  const dbName = _.get(Config.GLOBAL_CONF, `${params.id}.db_name`);
  const typeormConfig = {
    "type": TYPEORM_DB_TYPE,
    "url": dbURI,
    "database": dbName
  }

  _.forEach(params.typeorm_options.entities, function(entity, i) {
    params.typeorm_options.entities[i] = Utils.getAbsolutePathFromRelativePath(RPCFramework.SERVICE_TYPE, entity);
  });
  params.typeorm_options = _.defaultsDeep(params.typeorm_options || {}, typeormConfig);
  const connection = await Typeorm.createConnection(params.typeorm_options)
  RPCFramework.addToSingleton(params.singleton_id || params.id, connection);
}

const mysqlClient = {
  "typeorm": initTypeormClient,
  "sequelize": initSequelizeClient,
  "sequelize-typescript": initSequelizeTypescriptClient
}

export const Mysql = {
  initMysqlClient: async (params, RPCFramework) => {
    params.client_type = params.client_type ? params.client_type : "sequelize";
    await mysqlClient[params.client_type](params, RPCFramework)
  }
}