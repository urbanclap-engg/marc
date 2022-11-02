module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": ["string"]
    },
    "options": {
      "$ref": "#/definitions/options"
    }
  },
  "additionalProperties": false,
  "required": ["id"],
  "definitions": {
    "options":{
      "requestTimeoutMS": {"type": "number"}
    }
  }
}
