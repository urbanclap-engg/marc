module.exports = {
    "$schema": "http://json-schema.org/draft-06/schema#",
    "type": "object",
    "properties": {
      "id": {
        "type": ["string"]
      },
      "database_id": {
        "type": ["string"]
      },
      "sequelize_options": {
        "$ref": "#/definitions/SequelizeOptions"
      }
    },
    "additionalProperties": false,
    "required": ["database_id"],
    "definitions": {
      "SequelizeOptions": {
        "type": "object",
        "properties": {
          "logging": {"type": ["boolean", "object"]},
          "pool": {
            "type": "object",
            "properties": {
              "min": {"type": ["number"]},
              "max": {"type": ["number"]},
              "idle": {"type": ["number"]}
            }
          }
        }
      }
  }
}
    