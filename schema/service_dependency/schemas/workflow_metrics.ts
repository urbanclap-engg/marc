module.exports = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": [
        "string"
      ]
    },
    "workflowMetrics": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/WorkflowMetric"
      }
    }
  },
  "additionalProperties": false,
  "required": [
    "id"
  ],
  "definitions": {
    "WorkflowMetric": {
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
          "enum": ["counter", "gauge"]
        },
	"enabled":{
	  "type": "boolean"
	}	
      },
      "additionalProperties": false
    }
  }
}

