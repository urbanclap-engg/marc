'use strict';

const captureApplicationMetrics = require('./mycroft_capture').applicationMetrics;
const captureWorkflowMetrics = require('./mycroft_capture').workflowMetrics;

module.exports = {
  captureApplicationMetrics,
  captureWorkflowMetrics
}