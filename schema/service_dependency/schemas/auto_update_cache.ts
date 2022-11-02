module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": ["string"]
    },
    "cacheKey": {
      "type": ["string"]
    },
    "cronTime": {
      "type": ["string"],
      "pattern": "(@(annually|yearly|monthly|weekly|daily|hourly|reboot|once))|(@every (\\d+(ns|us|µs|ms|s|m|h))+)|((((\\d+,)+\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*) ?){5,7})"
    },
    "updateActivationDelayInSeconds": {
      "type": "number"
    },
    "dataSource": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["SERVICE"]
        },
        "serviceName": {
          "type": "string"
        },
        "api": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "params": {
              "type": "object"
            }
          },
          "required": ["name", "params"]
        }
      },
      "required": ["type"]
    },
    "cacheOptions": {
      "type": "object",
      "properties": {
        "useClones": {
          "type": "boolean"
        }
      }
    }
  },
  "required": ["id"],
  "definitions": {}
}
