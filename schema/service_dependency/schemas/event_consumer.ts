module.exports = {
    "$schema": "http://json-schema.org/draft-06/schema#",
    "type": "object",
    "properties": {
      "id": {
        "type": ["string"]
      },
      "whitelisted_id": {
        "type": ["string"]
      },
      "options": {
        "type": ["object"],
        "properties": {
          "eventProcessingWaitTimeMs": {
            "type": ["number"]
          },
          "concurrency": {
            "type": ["number"]
          }
        }
      },
      "message_handler": {
        "type": ["string"]
      },
      "error_handler": {
        "type": ["string"]
      }
    },
    "additionalProperties": false,
    "required": ["id", "message_handler"]
  }
  