module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": [
        "string"
      ]
    },
    "applicationMetrics": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/ApplicationMetric"
      }
    }
  },
  "additionalProperties": false,
  "required": [
    "id"
  ],
  "definitions": {
    "ApplicationMetric": {
      "type": "object",
      "properties": {
        "metricName": {
          "type": "string"
        },
        "help": {
          "type": "string"
        },
        "labelNames": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        },
        "metricType": {
          "type": "string",
          "enum": ["counter", "gauge", "histogram"]
        },
        "buckets": {
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "enabled":{
          "type": "boolean"
        }	
      },
      "additionalProperties": false,
      "required": [
        "metricName", "help", "labelNames", "enabled"
      ]
    }
  }
}

