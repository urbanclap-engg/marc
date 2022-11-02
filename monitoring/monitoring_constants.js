module.exports = {
  "PROMETHEUS": {
    "SCRAPPER": "prom-scrapper",
    "CLIENT": "prom-client",
    "APP_METRICS_ENDPOINT": "/metrics",
    "HTTP_SERVER_REQUEST_DURATION_METRIC": "http_request_duration_milliseconds",
    "HTTP_SERVER_REQUEST_ERROR_METRIC": "http_server_request_error_count",
    "HTTP_CLIENT_REQUEST_DURATION_METRIC": "http_client_request_duration_milliseconds",
    "HTTP_CLIENT_REQUEST_ERROR_METRIC": "http_client_request_error_count",
    "PROMETHEUS_EXPORTER_SINGLETON": "prometheus_exporter_service"
  },
  "PROMETHEUS_SERVICE_ID": "prometheus-service",
  "MONITORING_HANDLER_SERVICE": "monitoring_handler_service",
  "RPC_METRICS": {
    "STORE": "openapi_rpc_store",
    "ENDPOINT": "/getRPCMetrics",
    "HTTP_SERVER_REQUEST_DURATION": "http_request_duration_milliseconds",
    "HTTP_SERVER_REQUEST_ERROR": "http_server_request_error_count",
    "HTTP_CLIENT_REQUEST_DURATION": "http_client_request_duration_milliseconds",
    "HTTP_CLIENT_REQUEST_ERROR": "http_client_request_error_count",
    "LOGGING_ERROR_COUNT_METRIC": "logging_event_request_error_count",
    "HTTP_SERVER_REQUEST_KEYS_COUNT": "http_server_request_keys_count",
    "REQUEST_PAYLOAD_SIZE_IN_BYTES": "request_payload_size_bytes",
    "RESPONSE_PAYLOAD_SIZE_IN_BYTES": "response_payload_size_bytes",
    "MAX_KEYS_PER_API": 1,
    "ERROR": {
      "MAX_KEYS_ERROR": "Only 1 key allowed to track!"
    }
  },
  "MIDDLEWARE_METRICS": {
    "STORE": "openapi_middleware_metrics_store",
    "HTTP_SERVER_REQUEST_MIDDLEWARE_DURATION": "http_server_request_middelware_duration_milliseconds"
  },
  "METRIC_TYPES": {
    "GAUGE": "gauge",
    "COUNTER": "counter",
    "HISTOGRAM": "histogram"
  },
  "APPLICATION_METRICS": {
    "STORE" : "openapi_rpc_application_store",
    "ENDPOINT": "/getApplicationMetrics",
    "MAX_METRICS_PER_SERVICE": 15,
    "MAX_HISTOGRAM_BUCKETS_PER_METRIC": 8,
    "DEFAULT_HISTOGRAM_BUCKETS": [25, 50, 100, 200, 500, 1000, 2000, 50000],
    "MAX_LABELS": 7,
    "ERROR" : {
      "MAX_METRICS_ERROR" : "Only max of 5 metrics allowed!",
      "MAX_LABELS_ERROR" : "Unable to initialize as max 7 labels allowed!",
      "MAX_HISTOGRAM_BUCKETS": "Only a max of 13 buckets are allowed"
    }
  },
  "PUSHGATEWAY": "mycroft-push-gateway",
  "CACHE_SINGLETON_IDS": ['cache', 'cache_growth', 'cache_platform', 'cache_supply', 'cache_marketplace', 'AuthServiceCache']
}