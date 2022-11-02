module.exports = {
    "$schema": "http://json-schema.org/draft-06/schema#",
    "type": "object",
    "properties": {
      "id": {
        "type": ["string"]
      },
      "client_type": {
        "type": ["string"],
        "enum": ["sequelize-typescript", "typeorm", "sequelize"]
      },
      "is_cls": {
        "type": ["boolean"]
      },
      "typeorm_options": {
        "$ref": "#/definitions/TypeormOptions"
      },
      "sequelize_options": {
        "$ref": "#/definitions/SequelizeOptions"
      },
      "sync": {
        "type": ["boolean"]
      }
    },
    "additionalProperties": true,
    "required": ["id"],
    "definitions": {
      "SequelizeOptions": {
        "type": "object",
        "properties": {
          "pool": {
            "type": "object",
            "properties": {
              "min": {"type": ["number"]},
              "max": {"type": ["number"]},
              "idle": {"type": ["number"]}
            }
          }
        }
      },
      "TypeormOptions": {
        "type": "object",
        "properties": {
          "extra": {
            "type": "object",
            "properties": {
              "connectionLimit": {"type": ["number"]}
            }
          },
          "synchronize": {"type": ["boolean"]},
          "logging": {"type": ["boolean"]},
          "entities": {
            "type": "array",
            "items": { "type": "string" },
            "uniqueItems": true
          }
        }
      }
    }
  }
