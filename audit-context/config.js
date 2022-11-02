'use strict';

const constants = require("./constants");

const config = {
  UC_AUDIT_CONTEXT_KEYS: [constants.CLIENT_USER_ID, constants.CLIENT_SERVICE_ID],
  UC_AUDIT_CONTEXT_KEYS_TO_QUERY_PARAMS: {
    [constants.CLIENT_USER_ID]: constants.CLIENT_USER_ID,
    [constants.CLIENT_SERVICE_ID]: constants.CLIENT_ID
  },
  NAMESPACE_CREATED: false
};

module.exports = config;
