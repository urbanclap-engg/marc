export const RequestSchema = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "uri": {
      "type": [
        "string"
      ]
    },
    "uriPath": {
      "type": [
        "string"
      ]
    },
    "url": {
      "type": [
        "string"
      ]
    },
    "method": {
      "type": [
        "string"
      ]
    },
    "resolveWithFullResponse": {
      "type": [
        "boolean"
      ]
    },
    "body": {
      "type": ["object", "array"],
      "properties": {
      }
    },
    "qs": {
      "type": "object",
      "properties": {
      }
    },
    "json": {
      "type": [
        "boolean"
      ]
    },
    "timeout": {
      "type": [
        "number"
      ]
    },
    "encoding": {
      "type": [
        "string", "null"
      ]
    },
    "headers": {
      "type": "object",
      "properties": {
      }
    },
    "auth": {
      "type" : "object",
      "properties" : {
        "username" : {
          "type": [
            "string"
          ]
        },
        "password" : {
          "type": [
            "string"
          ]
        }
      }
    },
    "form": {
      "type": "object",
      "properties": {
      }
    },
    "formData": {
      "type": "object",
      "properties": {
      }
    },
    "secureProtocol": {
      "type": [
        "string"
      ]
    },
    "rejectUnauthorized": {
      "type": [
        "boolean"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "method"
  ],
  "oneOf": [
    {
      "required": [
        "uri"
      ]
    },
    {
      "required": [
        "url"
      ]
    }
  ]
}
