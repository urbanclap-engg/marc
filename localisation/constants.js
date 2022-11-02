const Constants = {
  CIRCUIT_BREAKER_OPTIONS: {
    DEFAULT: {
      TIMEOUT: 200,
      CIRCUIT_BREAKER_FORCE_CLOSED: true
    },
    KEY: "groot"
  },
  PLACEHOLDER_OPEN : "#groot ",
  PLACEHOLDER_CLOSE : " groot#",
  QUERY_STRING_START_PLACEHOLDER : "??::",
  QUERY_STRING_ASSIGNMENT_PLACEHOLDER : "=",
  QUERY_STRING_END_PLACEHOLDER : "&&&",
  PARAMETER_OPEN : "{{",
  PARAMETER_CLOSE : "}}",
  KEYS : [
    "source",
    "context"
  ],
  OBJECT_TYPE: "object",
  STRING_TYPE: "string",
  code: "code",
  resource: "resource",
  RECURSION_BREAKER_COUNT: 20,
  NEW_LINE_WITH_ESCAPING_CHARACTER: "\\n",
  NEW_LINE: "\n",
  LOCALISATION_METRICS: {
    LOCALISATION_METRIC_STORE: 'LOCALISATION_METRIC_STORE',
    REQ_TIME_METRIC: 'localisation_event_request_duration_milliseconds',
    STRING_EXTRACTION_REQ_TIME: 'localisation_string_extraction_event_request_duration_milliseconds',
    MARK_TRANSLATION_REQ_ERROR_COUNT_METRIC: 'localisation_mark_translation_event_request_error_count',
    BUCKET_RANGE: [5, 10, 30, 50, 100, 250, 500, 1000, 5000, 10000, 60000],
    LABEL: {
      SERVICE: 'service',
      ROUTE: 'route',
      RESPONSE_TYPE: 'response_type',
      METHOD_NAME: 'method_name'
    },
    ERROR: {
      INIT_METRIC_ERROR: 'LOCALISATION_METRIC_INIT_ERROR',
      CAPTURE_METRIC_ERROR: 'LOCALISATION_CAPTURE_METRIC_ERROR',
      EXPORT_METRIC_ERROR: 'LOCALISATION_EXPORT_METRIC_ERROR',
      TIMEOUT_TYPE: 'TIMEOUT',
      UNHANDLED_TYPE: 'ERROR'
    },
    SUCCESS_RESPONSE_TYPE: 'SUCCESS',
    COMMAND_TIME_OUT_MSG: 'CommandTimeOut',
    LOCALISATION_STRING_METHOD: 'getLocalizedString',
    LOCALISATION_DYNAMIC_STRING_METHOD: 'getDynamicLocalizedString'
  }
};

module.exports = Constants;