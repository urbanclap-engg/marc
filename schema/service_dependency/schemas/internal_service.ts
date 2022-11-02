module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": ["string"]
    },
    "branch": {
      "type": ["string"]
    },
    "version": {
      "type": ["number"]
    },
    "sub_service_ids": {
      "type": ["array"]
    },
    "isotope": {
      "type": ["object"]
    },
    "singleton_id": {
      "type": ["string"]
    },
    "api_configs": {
      "type": "array",
      "items": {
        "type": {
          "$ref": "#/definitions/api_config"
        }
      }
    }
  },
  "additionalProperties": false,
  "required": ["id", "version"],
  "definitions": {
    "api_config": {
      "properties": {
        "api_name": {
          "type": ["string"]
        },
        "circuit_breaker_options": {
          "type": ["object"],
          "properties": {
            "enable": {"type": ["boolean"]},
            "timeout": {"type": ["number"]},
            "circuit_breaker_force_opened": {"type": ["boolean"]},
            "circuit_breaker_force_closed": {"type":  ["boolean"]},
            "circuit_breaker_sleep_window_in_milliseconds": {"type": ["number"]},
            "circuit_breaker_request_volume_threshold": {"type": ["number"]},
            "circuit_breaker_error_threshold_percentage": {"type": ["number"]},
            "statistical_window_length": {"type": ["number"]},
            "statistical_window_number_of_buckets": {"type": ["number"]},
            "percentile_window_number_of_buckets": {"type": ["number"]},
            "percentile_window_length": {"type": ["number"]}
          },
          "additionalProperties": false,
          "required": ["enable"]
        }
      }
    }
  }
}
