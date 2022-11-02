const SERVICE_TO_GIT_NAME_MAPPING = {
  'provider-media-service': 'provider-media',
  'internal-dashboard': 'internal-dashboards',
};

const CONSTANTS = {
  MONOLITH_SERVICES: ['service-market', 'chanakya', 'internal-dashboard'],
  DEFAULT_FALLBACK_BRANCH: 'master',
  MAX_CONCURRENT_REQUESTS: 5,
  MAX_REQUEST_RETRIES: 3,
  MONOLITH_SCHEMA_FETCH_SUCCESS_RATIO: 0.7,
  MICROSERVICE_SCHEMA_FETCH_SUCCESS_RATIO: 1.0,
  SERVICE_TO_GIT_NAME_MAPPING: SERVICE_TO_GIT_NAME_MAPPING,
  OARPC_SERVICE_NAME: '@uc-engg/marc',
  PLATFORM_CONFIG_SERVICE: 'platform-config-service',
  DEFAULT_DEPENDENCY_FOR_GATEWAY: ['access-control-service'],
  DEFAULT_DEPENDENCY: ['platform-config-service', 'system-healing-service', 'xp-service', 'data-event-service', 'region-config-service'],
  SYSTEM_HEALING_SERVICE: 'system-healing-service',
  GLOBAL_CONFIG: {
    FILE_NAME: 'global.config.json',
    RELATIVE_PATH_FROM_ROOT: 'configs/global.config.json'
  },
  GLOBAL_EVENT_CONFIG: {
    PLATFORM_FILE_NAME: 'event.config.json',
    DATA_FILE_NAME: 'data.event.config.json'
  },
  SERVICE_PLATFORM_CONFIG: {
    CONFIG_PATH: '/configs/platform.config.json'
  },
  CONFIG_TYPE: {
    GLOBAL: 'global',
    EVENT: 'event',
    DATA_EVENT: 'data_event'
  },
  CONFIG_SOURCE: {
    REPO: 'Repo',
    S3: 'S3'
  },
  SCHEMA_SOURCE_TYPE: {
    GITLAB: 'gitlab',
    CUSTOM: 'custom'
  },
  GIT_SCHEMA_FILE_PATH: 'schema/service_schema.json',
  REQUEST_TIMEOUT_MS: 5000,
  ENVIRONMENT: {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
  },
  REPO_DIR_PATH: process.cwd()
}

export = CONSTANTS;
