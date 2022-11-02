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
      "event_config": {
        "type": ["object"]
      },
      "error_handler": {
        "type": ["string"]
      },
      "schema_type": {
        "type": "string" ,
        "enum": ["avro", "json"]
      }
    },
    "additionalProperties": false,
    "required": ["id"]
  }
  