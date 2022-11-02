module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": ["string"]
    },
    "options": {
      "$ref": "#/definitions/Options"
    },
    "isotope": {
      "type": ["object"]
    }
  },
  "additionalProperties": false,
  "required": ["id", "options"],
  "definitions": {
    "Options": {
      "type": "object",
      "properties": {
        "CIRCUIT_BREAKER_OPTIONS": {
          "type": ["object"],
          "properties": {
            "ENABLE": {"type": ["boolean"]},
            "TIMEOUT": {"type": ["number"]},
            "CIRCUIT_BREAKER_FORCE_CLOSED": {"type": ["boolean"]},
            "CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE": {"type": ["number"]}
          }
        }
      }
    }
  }  
}
