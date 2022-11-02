const RateLimitResources = {
  testRateLimitPolicyAPILevel: {
    "serviceType": "microservice",
    "serviceId": "logging-service",
    "rateLimits": [
        {
            "attribute": "api",
            "key": "/pushLogs",
            "requestLimit": 100
        }
    ],
    "timeWindowUnit": "minute",
    "isEnabled": true,
    "updatedBy": "sunishdahiya"
  },
  testRateLimitPoliciesAPILevel: {
    "serviceType": "microservice",
    "serviceId": "logging-service",
    "rateLimits": [
        {
          "attribute": "api",
          "key": "/pushLogs",
          "requestLimit": 100
        },
        {
            "attribute": "api",
            "key": "/pushLogsZero",
            "requestLimit": 0
        }
    ],
    "timeWindowUnit": "minute",
    "isEnabled": true,
    "updatedBy": "sunishdahiya"
  },
  testRateLimitPolicyClientLevel: {
    "serviceType": "microservice",
    "serviceId": "logging-service",
    "rateLimits": [
        {
            "attribute": "api",
            "key": "/pushLogs",
            "rateLimits": [
                {
                    "attribute": "client",
                    "key": "service-market",
                    "requestLimit": 50
                }
            ]
        }
    ],
    "timeWindowUnit": "minute",
    "isEnabled": true,
    "updatedBy": "sunishdahiya"
  },
  testRateLimitPolicySourceLevel: {
    "serviceType": "microservice",
    "serviceId": "logging-service",
    "rateLimits": [
        {
            "attribute": "api",
            "key": "/pushLogs",
            "rateLimits": [
                {
                    "attribute": "client",
                    "key": "service-market",
                    "rateLimits": [
                      {
                        "attribute": "source",
                        "key": "google",
                        "requestLimit": 10
                      }
                    ] 
                }
            ]
        }
    ],
    "timeWindowUnit": "minute",
    "isEnabled": true,
    "updatedBy": "sunishdahiya"
  },
  testRequestObject: {
    _parsedUrl: {
      pathname: '/logging-service/pushLogs'
    },
    base_url: '/logging-service/pushLogs',
    query: {
      client_id: 'service-market'
    },
    headers: {
      'x-device-os': 'Android',
      'source': 'google'
    }
  },
  testRequestObjectWithoutClientId: {
    _parsedUrl: {
      pathname: '/logging-service/pushLogs'
    },
    base_url: '/logging-service/pushLogs',
    headers: {
      'user-agent': 'Mozilla'
    }
  },
  testRequestObjectEmptyHeaders: {
    _parsedUrl: {
      pathname: '/logging-service/pushLogs'
    },
    headers: {}
  },
  testTokenbucket: {
    timestamp: Date.now(),
    tokenCount: 10
  },
  testRequestObjectNotAllowed: {
    _parsedUrl: {
      pathname: '/logging-service/pushLogsZero'
    },
    base_url: '/logging-service/pushLogsZero',
    query: {
      client_id: 'service-market'
    },
    headers: {
      'x-device-os': 'Android',
      'source': 'google'
    }
  }

}

module.exports = RateLimitResources;