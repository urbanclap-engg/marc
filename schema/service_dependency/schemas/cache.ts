module.exports = {
    "$schema": "http://json-schema.org/draft-06/schema#",
    "type": "object",
    "properties": {
      "id": {
        "type": ["string"]
      },
      "options": {
        "type": ["object"]
      }
    },
    "additionalProperties": false,
    "required": ["id", "options"]
  }
