export const LOG_CONSTANTS = {
  SERVICE_LEVEL_PARAMS: {
    KEY_1: "key_1",
    KEY_1_VALUE: "key_1_value",
    KEY_2: "key_2",
    KEY_2_VALUE: "key_2_value",
    KEY_3: "key_3",
    KEY_3_VALUE: "key_3_value",
    NUMKEY_1: "numkey_1",
    NUMKEY_1_VALUE: "numkey_1_value",
    NUMKEY_2: "numkey_2",
    NUMKEY_2_VALUE: "numkey_2_value",
    NUMKEY_3: "numkey_3",
    NUMKEY_3_VALUE: "numkey_3_value",
    NUMKEY_4: "numkey_4",
    NUMKEY_4_VALUE: "numkey_4_value",
    NUMKEY_5: "numkey_5",
    NUMKEY_5_VALUE: "numkey_5_value",
    NUMKEY_6: "numkey_6",
    NUMKEY_6_VALUE: "numkey_6_value"
  },
  COMMON_PARAMS: {
    CUSTOMER_REQUEST_ID: "customer_request_id",
    PROVIDER_ID: "provider_id",
    CUSTOMER_ID: "customer_id",
    LEAD_ID: "lead_id",
    METHOD_NAME: "method_name"
  },
  SYSTEM_LOGS: {
    UUID: "uuid",
    ERROR_ID: "error_id",
    API_NAME: "api_name",
    API_PATH: "api_path",
    API_TIME: "api_time",
    TIMESTAMP: "timestamp",
    FILE_NAME: "file_name",
    CONTAINER_ID: "container_id",
    TASK_ID: "task_id",
    CONTAINER_IP: "container_ip",
    SERVICE_PORT: "service_port",
    CONTAINER_PORT: "container_port",
    LOG_TYPE: "log_type",
    SERVICE_NAME: "service_name",
    SUCCESS: "success",
    TRANSACTION_ID: "transaction_id",
    USER_AGENT: "user_agent",
    DEVICE_NAME: "device_name",
    DEVICE_ID: "device_id",
    VERSION_NAME: "version_name",
    VERSION_CODE: "version_code",
    BUILD_VERSION: "build_version",
    CLIENT_ID: "client_id",
    EXTERNAL_SERVICE_ID: "external_service_id",
    URL: "url",
    STATUS: "status",
    ERROR_TYPE: "error_type",
    SOURCE_TYPE: "source_type",
    RELEASE_VERSION: "release_version"
  },
  STRINGIFY_OBJECTS: {
    MESSAGE: "message",
    ERROR_MESSAGE: "error_message",
    ERROR_STACK: "error_stack",
    ERROR_PAYLOAD: "error_payload",
    ERROR: "error"
  }
}

export const LOG_TYPE = {
  RPC_SERVICE: 'rpc_service',
  RPC_SERVER_RESPONSE: 'rpc_server_response',
  RPC_CLIENT: 'rpc_client',
  RPC_SYSTEM: 'rpc_system',
  RPC_RATE_LIMIT: 'rpc_rate_limit',
  RPC_LOAD_SHED: 'rpc_load_shed',
  RPC_PROFILER: 'rpc_profiler'
};

export const LOGGING_METRIC_CONSTANTS = {
  LABEL: {
    STATUS_CODE: 'status_code',
    ERROR_TYPE: 'error_type',
    LOG_TYPE: 'log_type'
  },
  ERROR: {
    CAPTURE_METRIC_ERROR: 'LOGGING_METRIC_CAPTURE_ERROR'
  },
  DEFAULT_STATUS_CODE: 'default_status_code',
  DEFAULT_ERROR_TYPE: 'default_log_type',
  DEFAULT_LOG_TYPE: 'default_log_type'
};
