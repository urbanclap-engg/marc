import { ServiceMetaDataUtil } from './common/service_metadata_util';
import * as _ from 'lodash';
import { ConfigUtils } from './common/config_utils';
import fs from 'fs';

let globalConfig: {[k: string]: any} = {};

const getGlobalRpcConfig = (constantsType: string, path?: string) => {
  if(globalConfig 
    && Object.keys(globalConfig).length === 0
    && Object.getPrototypeOf(globalConfig) === Object.prototype) {
    globalConfig = ConfigUtils.getGlobalConfig();
  }
  return _.get(globalConfig, path ? `${constantsType}.value.${path}` : `${constantsType}.value`);
}

// Temporary workaround till every service onboad dependency.config to ts
let DEPENDENCY_CONFIG_PATH: string = '/configs/dependency.config';
if(fs.existsSync(ConfigUtils.getParentWorkingDir() + '/dist/configs/dependency.config.js')){
  DEPENDENCY_CONFIG_PATH = '/dist/configs/dependency.config';
}

const constants: {[k:string]: any} = {
  ENVIRONMENT: {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
  },
  VAULT_CONFIG: getGlobalRpcConfig('cms-config', 'VAULT_CONFIG'),
  CMS: {
    AWS_METADATA_URL: 'http://169.254.170.2/',
    VAULT_LOGIN_URL: '/v1/auth/aws/login',
    VAULT_HEALTHCHECK_URL: '/v1/sys/health',
    USERNAME_PLACEHOLDER: '__username__',
    PASSWORD_PLACEHOLDER: '__password__',
    DB_NAME_PLACEHOLDER: '__db_name__',
    SLACK_ALERT_CHANNEL: getGlobalRpcConfig('cms-config', 'SLACK_ALERT_CHANNEL'),
    GLOBAL_CREDENTIALS_FOLDER_NAME: getGlobalRpcConfig('cms-config', 'GLOBAL_CREDENTIALS_FOLDER_NAME'),
    SERVICE_CREDENTIALS_PATH: getGlobalRpcConfig('cms-config', 'SERVICE_CREDENTIALS_PATH'),
    GLOBAL_CREDENTIALS_PATH: getGlobalRpcConfig('cms-config', 'GLOBAL_CREDENTIALS_PATH'),
    COMMON_CREDENTIALS: getGlobalRpcConfig('cms-config', 'COMMON_CREDENTIALS'),
    PII_TYPES: getGlobalRpcConfig('cms-config', 'PII_TYPES')
  },
  DEPENDENCY: {
    SLACK_ALERT_CHANNEL: getGlobalRpcConfig('dependency-config', 'SLACK_ALERT_CHANNEL'),
    CONFIG_PATH: DEPENDENCY_CONFIG_PATH,
    JAVASCRIPT_WORKFLOW_PATH: '/src/workflow/',
    TYPESCRIPT_WORKFLOW_PATH: '/dist/workflow/',
    ID: getGlobalRpcConfig('dependency-config', 'ID'),
    TYPE: _.assign(getGlobalRpcConfig('dependency-config', 'TYPE'), {
      MONGODB: 'mongodb',
      MYSQL: 'mysql',
      INTERNAL_SERVICE: 'internal_service',
      SNOWFLAKE:'snowflake',
      EXTERNAL_SERVICE: 'external_service',
      APPLICATION_METRICS:'application_metrics'
    }),
    CONNECTION: {
      MONGODB_CONNECTION: 'mongodb_connection'
    }
  },
  REPO_DIR_PATH: process.cwd(),
  SRC_PATH: {
    typescript: '/dist/',
    javascript: '/src/'
  },
  SCHEMA_TYPE: {
    AVRO: 'avro',
    JSON: 'json'
  },
  MYSQL_CLIENT_TYPE: {
    SEQUELIZE_TYPESCRIPT: 'sequelize-typescript',
    SEQUELIZE: 'sequelize',
    TYPEORM:'typeorm'
  },
  USER_TYPE: {
    DASHBOARD_USER: 'dashboard-user'
  },
  LOAD_BALANCER: 'ALB',
  DEFAULT_AUTH: 'ALL',
  HTTP_RESPONSE_CODE_OK: 200,
  HTTP_RESPONSE_CODE_ERROR: 500,
  HTTP_RESPONSE_CODE_TOO_MANY_REQUESTS: 429,
  HEALTH_CHECK: 'healthcheck',
  GET_SESSION: 'getEventDataConfig',
  EMPTY: null,
  UNKNOWN: 'unknown',
  ENABLE_ASYNC_API_QUEUE: 'enable_async_api_queue',
  CALL_TYPE_SYNC: 'sync',
  CALL_TYPE_ASYNC: 'async',
  IS_ASYNC: 'x-is-async',
  EVENT_PRIORITY_KEY: 'event_priority',
  EVENT_PRIORITY_LEVELS: ['medium', 'high'],
  WORKFLOW : {
    ERROR_TYPES : {
      WORKFLOW_DEPENDENCY_ERROR: 'workflow_dependency_error',
      WORKFLOW_SERVER_ERROR: 'workflow_server_error',
      UNCAUGHT_EXCEPTION: 'uncaught_exception',
      UNCAUGHT_REJECTION: 'uncaught_rejection'
    },
    DEFAULT_ALERT_CHANNEL: getGlobalRpcConfig('workflow-config', 'DEFAULT_ALERT_CHANNEL'),
    /* execution_time_of_incoming_task - last_scheduled_execution_time should be greater than this threshold.
    Ideally this threshold should be 0, but this extra buffer will help in coping with system time differences */
    EXECUTION_TIME_DIFF_THRESHOLD: -5
  },
  IS_INTERNAL_SERVICE_AUTHENTICATED: 'isInternalServiceAuthenticated',
  SOURCE_TYPE: {
    SERVICE: 'service',
    WORKFLOW: 'workflow'
  },
  GATEWAY: {
    CONFIG_PATH: '/configs/gateway.config',
    MIDDLEWARE: {
      CLIENT_AUTHORISATION: {
        RESOURCE: {
          CUSTOMER_REQUEST: 'customer_request',
          PROVIDER_LEAD: 'provider_lead'
        }
      },
      AUTH_METHOD: {
        CLIENT_AUTHENTICATION: 'client_authentication',
        CLIENT_AUTHORISATION: 'client_authorisation',
        CAPTCHA_AUTHENTICATION: 'captcha_authentication',
        GOOGLE_AUTHENTICATION: 'google_authentication'
      },
      TYPE: {
        AUTH: 'auth',
        MULTIPART: 'multipart',
        LOCALISATION: 'localisation'
      }
    },
    API: 'api',
    DASHBOARD_API: 'dashboard-api',
    PROVIDER_TYPES: {
      OWNER: 'owner',
      COOWNER: 'coOwner',
      OPERATOR: 'operator',
      CAPTAIN: 'captain',
      PARTNER: 'partner',
      HELPER: 'helper',
      INDIVIDUAL: 'individual',
      AGGREGATOR: 'aggregator'
    }
  },
  CREDENTIALS_STORE: {
    CREDENTIALS_JSON: 'credentials_json',
    VAULT: 'vault'
  },
  CREDENTIALS_FILE_PATH: '.credentials.json',
  SERVICE_PLATFORM_CONFIG: {
    CONFIG_PATH: '/configs/platform.config.json'
  },
  GLOBAL_CONFIG: {
    FILE_NAME: 'global.config.json',
    RELATIVE_PATH_FROM_ROOT: 'configs/global.config.json'
  },
  GLOBAL_EVENT_CONFIG: {
    PLATFORM_FILE_NAME: 'event.config.json',
    DATA_FILE_NAME: 'data.event.config.json'
  },
  CONFIG_TYPE: {
    GLOBAL: 'global',
    EVENT: 'event',
    DATA_EVENT: 'data_event'
  },
  URL_OPERATION: {
    GET: 'get',
    POST: 'post'
  },
  GOOGLE_CAPTHA: {
    CAPTCHA_URI: 'https://www.google.com/recaptcha/api/siteverify'
  },
  GOOGLE_AUTH: {
    session: 'servicemarket-internal-dashboard-new'
  },
  KAFKA_CLUSTER_ID_MAPPING: {
    'event_producer': 'platform',
    'event_consumer': 'platform',
    'event_producer_data': 'data',
    'event_consumer_data': 'data',
  },
  MONGODB_CONNECTION_OPTIONS: {
    SOCKET_TIMEOUT_OPTION_KEY: 'socketTimeoutMS',
    DEFAULT_SOCKET_TIMEOUT_MS: 30000,
    CONNECT_TIMEOUT_OPTION_KEY: 'connectTimeoutMS',
    DEFAULT_CONNECT_TIMEOUT_MS: 30000
  },
  PLATFORM_CONFIG_SERVICE : getGlobalRpcConfig('pcs-config'),
  CLIENT: {
    TIMING_PHASES: 'timingPhases',
    HTTP_AGENT_DEFAULT_OPTIONS: {
      keepAlive: ServiceMetaDataUtil.getNodeVersion() >= 14 ? true : false,
      maxFreeSockets: 10,
      timeout: 30 * 1000, // active socket keepalive for 30 seconds
      freeSocketTimeout: 30 * 1000, // free socket keepalive for 30 seconds
    }
  },
  SLACK: getGlobalRpcConfig('slack-config'),
  PROFILER: getGlobalRpcConfig('profiler-config')
};

export = constants;