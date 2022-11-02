export const CONSTANTS = {
  AUTH_METRICS: {
    AUTH_METRIC_STORE: 'AUTH_METRIC_STORE',
    REQ_ERROR_COUNT_METRIC: 'auth_event_request_error_count',
    REQ_TIME_METRIC: 'auth_event_request_duration_milliseconds',
    BUCKET_RANGE: [2, 5, 10, 30, 50, 100, 250, 500, 1000, 5000, 10000, 60000],
    TOKEN: {
      TYPE: 'TOKEN'
    },
    CAPTCHA: {
      TYPE: 'CAPTCHA',
      FAILURE_MSG: 'Captcha authentication failed'
    },
    ACCESS_CONTROL: {
      TYPE: 'ACCESS_CONTROL'
    },
    LABEL: {
      DEVICE_OS: 'device_os',
      TYPE: 'type',
      SERVICE: 'service',
      ERROR_TYPE: 'error_type',
      ROUTE: 'route',
      GUEST_ROLE_ALLOWED: 'guest_role_allowed'
    },
    ERROR: {
      INIT_METRIC_ERROR: 'AUTH_METRIC_INIT_ERROR',
      CAPTURE_METRIC_ERROR: 'CAPTURE_METRIC_ERROR',
      EXPORT_METRIC_ERROR: 'EXPORT_METRIC_ERROR',
      FAILURE_TYPE: 'FAILURE',
      UNHANDLED_TYPE: 'ERROR'

    },
    AUTH_FAILURE: 'authFailure'
  },

  DEVICE_OS_HEADER_KEY: 'x-device-os'
}