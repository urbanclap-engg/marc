'use strict';

const constants = {
    "RPC_CLIENT": {
        "INTERNAL": {
            "GATEWAY_URL": "host",
            "TEST_CALLER_SERVICE": "service-market",
            "TEST_CALLED_SERVICE": "logging-service",
            "TEST_CALLED_SERVICE_PORT": "8001",
            "TEST_CALLED_SERVICE_AUTH_IDS": ["service-market"]
        },
        "EXTERNAL": {
            "TEST_CALLER_SERVICE": "communication-service",
            "TEST_CALLED_SERVICE_PORT": "8001",
            "TEST_CALLED_SERVICE": "mgage",
            "TEST_CALLED_SERVICE_CONFIG": {
                "CIRCUIT_BREAKER_OPTIONS": {
                    "ENABLE": true,
                    "TIMEOUT": 2000,
                    "CIRCUIT_BREAKER_FORCE_CLOSED": false
                }
            }
        }
    },
    "RPC_SERVER": {
        "TEST_SERVICE_ID": "logging-service",
        "TEST_SERVICE_AUTH_IDS": ["service-market"],
        "TEST_SERVICE_PORT": "8001"
  }
};

module.exports = constants;
