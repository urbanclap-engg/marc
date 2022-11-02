module.exports = {
    "$schema": "http://json-schema.org/draft-06/schema#",
    "type": "object",
    "properties": {
      "id": {
        "type": ["string"]
      },
      "mongoose_options": {
        "$ref": "#/definitions/MongooseOptions"
      },
      "models": {
        "type": "array",
        "items": { "$ref": "#/definitions/Model" }
      }
    },
    "additionalProperties": false,
    "required": ["id"],
    "definitions": {
      "MongooseOptions": {
        "type": "object",
        "properties": {
          "useMongoClient": {"type": "boolean"},
          "autoIndex": {"type": "boolean"},
          "reconnectTries": {"type": "number"},
          "reconnectInterval": {"type": "number"},
          "poolSize": {"type": "number"},
          "bufferMaxEntries ": {"type": "number"},
          "readPreference": {"type": "string"},
          "safe": {"type": "boolean"},
          "useNewUrlParser": {"type": "boolean"},
          "useCreateIndex": {"type": "boolean"},
	  "socketTimeoutMS": {"type": "number"},
	  "connectTimeoutMS": {"type": "number"}
        }
      },
      "Model": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "model": {"type": "object"}
        },
        "additionalProperties": false
      }
    }
  }
