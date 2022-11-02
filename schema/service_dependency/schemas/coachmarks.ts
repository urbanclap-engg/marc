module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": ["string"]
    },
    "database_id": {
      "type": ["string"]
    }
  },
  "additionalProperties": false,
  "required": ["id", "database_id"],
  "definitions": {}
}