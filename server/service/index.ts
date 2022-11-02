import _ from 'lodash';
import { DependencyLoader } from '../common/dependency_loader';
import RPC_CONSTANTS from '../../constants';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import { PrometheusMonitoring } from '../../dependency/prometheus_monitoring';
import { MycroftMonitoring } from '../../dependency/mycroft_monitoring';
import { Securitas } from '../../dependency/securitas';
import { LoadShed } from '../../dependency/load_shed';
import Error from '../../error';
import { Slack } from '../../slack';
import Agent from 'agentkeepalive';
import * as Singleton from '../../singleton';
import { OpenApiSchema } from '../../schema/services';
import { Logger } from '../../logging/standard_logger';
import { Profiler } from '../../profiler';
import {Strategy, ProfileType} from '../../profiler/interface'
import * as CredentialManagement from '../../credential_management';

const SERVICE_PACKAGE_JSON = require(RPC_CONSTANTS.REPO_DIR_PATH + '/package.json')
const IS_PROMETHEUS_MONITORING_ENABLED = process.env.PROMETHEUS_MONITORING_ENABLED == 'true' ? true : false;
const IS_LOAD_SHEDDING_INITIALIZED = process.env.IS_LOAD_SHEDDING_INITIALIZED == 'true' ? true : false;
const IS_CONTINUOUS_PROFILER_ENABLED = process.env.CONTINUOUS_PROFILER_ENABLED == 'true' ? true : false;


export class Service {
  SERVICE_ID: string;
  rpcFramework: any;
  config: ClientMap;
  Logger: ClientMap;
  SERVICE_TYPE: string;
  API_SOURCE_PATH: string;
  ISOTOPE: boolean;
  DEPENDENCY_CONFIG_PATH: string;
  GATEWAY_CONFIG_PATH: string;
  PORT: number;
  AUTH_SERVICE_IDS: string[];

  constructor(rpc_framework) {
    this.SERVICE_ID = SERVICE_PACKAGE_JSON.name;
    this.rpcFramework = rpc_framework;

    let options = {
      source_type : RPC_CONSTANTS.SOURCE_TYPE.SERVICE
    }
    this.config = this.rpcFramework.initConfig(this.SERVICE_ID, options);


    Slack.initSlack(this.SERVICE_ID);
    Error.initUCError();
    Error.initRPCError();
    initGlobalHttpAgent(_.get(this.config, 'PLATFORM_CONF.globalHttpAgentOptions'));
    this.Logger = this.rpcFramework.initLogger({ debug_mode: _.get(this.config.CUSTOM, 'logging_options.debug_mode'), service_id: this.SERVICE_ID });

    const ucServiceType = _.get(SERVICE_PACKAGE_JSON, 'urbanclap.service_type', null);
    this.SERVICE_TYPE = (ucServiceType === null) ? _.get(SERVICE_PACKAGE_JSON, 'service_type', 'javascript') : ucServiceType;
    
    this.rpcFramework.SERVICE_TYPE = this.SERVICE_TYPE;

    this.API_SOURCE_PATH = SERVICE_PACKAGE_JSON.main;
    this.ISOTOPE = SERVICE_PACKAGE_JSON.isotope;
    this.DEPENDENCY_CONFIG_PATH = RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.DEPENDENCY.CONFIG_PATH;
    this.GATEWAY_CONFIG_PATH = RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.GATEWAY.CONFIG_PATH;
    this.PORT = this.config.PORT;
    this.AUTH_SERVICE_IDS = this.config.AUTH_SERVICE_IDS;
  }

  initDependency = async () => {
    let self = this;
    let DEPENDENCY_CONFIG = require(this.DEPENDENCY_CONFIG_PATH).Config.service;
    let logData = {}
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'server_type';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = 'service';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'status';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = 'loading';
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    this.Logger.info(logData);

    OpenApiSchema.init(this.SERVICE_ID);
    if(IS_PROMETHEUS_MONITORING_ENABLED) {
      PrometheusMonitoring.initPrometheusMonitoringClient({}, self.rpcFramework);
    }
    MycroftMonitoring.initMonitoringClient(this.SERVICE_ID, self.rpcFramework);

    await Securitas.initSecuritasClient({id: 'Securitas'}, self.rpcFramework);

    const updatedConfig = await CredentialManagement.initCredentials(this.SERVICE_ID);

    if (updatedConfig) {
      self.config = updatedConfig;
    }
    if (_.has(DEPENDENCY_CONFIG, RPC_CONSTANTS.DEPENDENCY.TYPE.EVENT_CONSUMER)) {
      self.rpcFramework.eventConsumerDependency = _.pick(DEPENDENCY_CONFIG, [RPC_CONSTANTS.DEPENDENCY.TYPE.EVENT_CONSUMER])
      DEPENDENCY_CONFIG = _.omit(DEPENDENCY_CONFIG, RPC_CONSTANTS.DEPENDENCY.TYPE.EVENT_CONSUMER)
    }
    await DependencyLoader.init(self.rpcFramework, DEPENDENCY_CONFIG);

    if (IS_LOAD_SHEDDING_INITIALIZED) {
      await LoadShed.initLoadShedding({}, self.rpcFramework);
    }
    
    if (IS_CONTINUOUS_PROFILER_ENABLED) Profiler.triggerProfiler(Strategy.CONTINUOUS, ProfileType.CPU);
  }
  
  initServer = async (serviceController ?: any) => {
    let self = this;
    let Isotope = self.ISOTOPE === true ? require( RPC_CONSTANTS.REPO_DIR_PATH + '/isotope_init') : undefined;
    if(Isotope) {
      Isotope.init();
    }
    let schemaObj, gatewayConfig = null;
    let logData = {}
    try { gatewayConfig = getGatewayConfig(self) }
    catch(err) {}
    Singleton.addToSingleton('GATEWAY_CONFIG', gatewayConfig);
    if(gatewayConfig) self.rpcFramework.initTransactionContext()

    let Service = serviceController ? serviceController : 
        require(RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.SRC_PATH[self.SERVICE_TYPE] + self.API_SOURCE_PATH);
      
    await initializeEventConsumer(self, Service);
    Logger.info({key_1: 'schema_fetch', key_1_value: `fetching from platform-config-service: ${self.SERVICE_ID}`});
    schemaObj = OpenApiSchema.getOpenApiObj(self.SERVICE_ID, 0).schema;

    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'server_type';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = 'service';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'status';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = 'ready';
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    self.Logger.info(logData); 

    self.rpcFramework.createServer(self.SERVICE_ID, self.AUTH_SERVICE_IDS, schemaObj, Service, self.PORT);
      
    console.log("Service running on port: " + self.PORT);
  }
}

//Logic for internal use

function getGatewayConfig(self) {
  let gatewayConfig = require(self.GATEWAY_CONFIG_PATH).Config;
  let config = {
    [RPC_CONSTANTS.GATEWAY.API]: {}
  };
  Object.keys(gatewayConfig).forEach((serviceKey) => {
    config[RPC_CONSTANTS.GATEWAY.API] = _.extend(config[RPC_CONSTANTS.GATEWAY.API], gatewayConfig[serviceKey]);
  })
  return config;
}

const initializeEventConsumer = async (self, service) => {
  if (self.rpcFramework.eventConsumerDependency){
    self.rpcFramework.service = service
    await DependencyLoader.init(self.rpcFramework, self.rpcFramework.eventConsumerDependency)
  }
}

const initGlobalHttpAgent = (options = {}) => {
  const agentOptions = _.assign({}, RPC_CONSTANTS.CLIENT.HTTP_AGENT_DEFAULT_OPTIONS, options);
  Singleton.addToSingleton('globalHttpAgent', new Agent(agentOptions));
}