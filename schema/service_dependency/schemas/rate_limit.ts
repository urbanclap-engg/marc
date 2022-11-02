module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
      "id": {
          "type": ["string"]
      },
      "options": {
        "type": "#/definitions/RateLimit",
      }
  },
  "additionalProperties": false,
  "required": ["id"],
  "definitions": {
    "RateLimit": {
      "useEndPoint": {
        "type": ["boolean"]
      },
      "endPoint": {
          "$ref": "#/definitions/RateLimitEndPoint"
      },
      "useStaticConfig": {
        "type": ["boolean"]
      },
      "rateLimitPolicy": {
          "$ref": "#/definitions/RateLimitPolicy"
      }
    },
    "RateLimitPolicy": {
        "type": "object",
        "properties": {}
    },
    "RateLimitEndPoint": {
        "type": "object",
        "properties": {
            "url": "string",
            "authToken": "string",
            "body": {
                "type": "object",
            }
        }
    }
  }
};
