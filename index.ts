import 'cls-hooked';
import TransactionContext from './transaction-context';
import { RpcClient } from './rpc/client';
import { RpcServer } from './rpc/server';
import _ from 'lodash';
import {Logger as StandardLogger} from './logging/standard_logger';
import { Config as ConfigHelper } from './config';
import { initCredentials } from './credential_management'
import * as Singleton from './singleton';
import { LOG_CONSTANTS } from './logging/constants';
import RPC_CONSTANTS from './constants';
import Server from './server';
import { RpcFrameworkInterface } from './interface';
import { getLogger } from './logging';


const RpcFramework: RpcFrameworkInterface = {
  /**
  * @param service_id
  *
  * @return <config>
  */
  initConfig: (service_id, options) => {
    const config = ConfigHelper.initConfig(service_id, options);
    Singleton.addToSingleton('Config', config);
    return config;
  },

  //TODO: To be removed once services remove usage
  initCredentials: (service_id) => {
    return initCredentials(service_id);    
  },

  //TODO: To be removed once services remove usage
  createExternalClient: (service_id, external_service_id, config) => {
    return RpcClient.createExternalClient(service_id, external_service_id, config);
  },
  
  /**
   * 
  * Returns a logger for the service.
  * @param service_id
  * @return Logger { info(data), error(data) }
  */
  initLogger: (options) => {
    const loggerType = StandardLogger; 
    const logger = getLogger(loggerType, options);
    Singleton.addToSingleton('LOG_CONSTANTS', LOG_CONSTANTS);
    Singleton.addToSingleton('Logger', logger);
    return logger;
  },

  /**
  * This is to generate a transaction id which is passed in an api call. This is exposed for monoliths. For microservices, its inbuilt.
  */
  initTransactionContext: (params) => {
    const param = params || {};
    TransactionContext.patchBluebird(param.bluebird);
    Singleton.addToSingleton('TransactionContext', TransactionContext);
    return TransactionContext;
  },

  /** createClient(client_id, auth_token, method_names, t_interface, server_host, server_port)
  *
  * @param service_id – Service ID of the 'caller' service
  * @param called_service_id – Service ID of the 'called' service\
  * @param schema – service's openapi schema.
  * @param server_host – IP of the host service
  * @param server_port – Port of the host service
  * @param client_options - additional options for creating this client, includes:
  *            retry : retry options:
  *                retries
  *                retryAfterMs
  *                backOffFactor
  *                errorHandler
  *                timeoutInMs
  *            keep_alive: object with options for http connection keep-alive. Properties:
  *                enabled: set it to true if you want to use keep-alive
  *                maxSockets: max number of open sockets connected to server
  *            api_config: object containing API-level configuration like circuit_breaker_options,
  *             eg:  "getCartItems": {
  *                    "CIRCUIT_BREAKER_OPTIONS": {
  *                        "ENABLE": true, // Circuit breaker will be bypassed if this is set to false
  *                        "TIMEOUT": 2000, // in milliseconds. There will be an error thrown if timeout occurs
  *                        "CIRCUIT_BREAKER_FORCE_CLOSED": true  // if set to true, the circuit will never break, only the timeout will occur
  *                    }
  *                }
  *
  * @return client { method1: function(..) , method2: function(..) , ....... }
  *
  * eg.
  *     var client = createClient(...);
  *     var header = createHeader(...); // read from the docs
  *     client.method( header, arg1, arg2, ... )
  */
  createClient: (service_id, called_service_id, schema, server_host, server_port, client_options) => {
    return RpcClient.createClient(service_id, called_service_id, schema, server_host, server_port, client_options);
  },

  /**
  * Create the RPC (openapi) service.
  *
  * @param service_id
  * @param auth_service_ids – [] Service's that are allowed to query. Undefined means no auth.
  * @param schema – service's openapi schema.
  * @param service – Implementation – { <method_name> : function(..) {..} }
  * @param port
  *
  * @return server { end: function() }
  */
  createServer: (service_id, auth_service_ids, schema, service, port) => {
    return RpcServer.createServer(service_id, auth_service_ids, schema, service, port);
  },

  /**
  * This allows you to store global objects.
  * This is partiularly useful for storing initialised DB connections, config, logger, etc.
  * How to use –
  *   import { getSingleton } from 'marc';
  *   Singleton = getSingleton();
  *   Logger = Singleton.Logger;
  *   Config = Singleton.Config;
  *   MongoMainStore = Singleton.mongoMainStore;
  *   MongoMainStore.getUser(...);
  *   Config.SERVICE_ID;
  *   Logger.SERVICE_ID;
  */
  getSingleton: () => {
    return Singleton.getSingleton();
  },

  /**
  * Add to the singleton.
  * Config (default)
  * Logger (default)
  *
  * eg –
  * DBs / Stores – eg. RedisMainStore, MongoMainStore, MysqlMainStore, MysqlMonetisationStore, etc
  */
  addToSingleton: (key, value) => {
    return Singleton.addToSingleton(key, value);
  },

  /** adds multiple key,value pairs */
  addObjToSingleton: (obj) => {
    return Singleton.addObjToSingleton(obj);
  },

  getDependencyConfig: () => {
    return RPC_CONSTANTS.DEPENDENCY;
  },

  getGatewayConstants: () => {
    return RPC_CONSTANTS.GATEWAY;
  },

  /**
   * Run workflow tasks. src/workflow/index changes example:
   * require('marc').initWorkflow();
   *
  */
  initWorkflow: () => {
    return Server.initWorkflow(RpcFramework);
  },

  /**
   * Run service. server.js file changes example:
   * let RPCFramework = require('marc').initService()
   *
   */
  initService: () => {
    return Server.initService(RpcFramework);
  },
  
  /**
   * Run the service using using the Service object. server.js file changes example:
   *
   *  let Service = require('marc').getService();
   *
   *  Service.initDependency()
   *  .then(function () {
   *    let controller = require('./src/index');
   *    Service.initServer(controller);
   *   })
   *
  */
  getService: () => {
    return new Server.service(RpcFramework);
  }
}

export = RpcFramework


