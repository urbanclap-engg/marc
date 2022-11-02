'use strict';

const DEPENDENCY = require('../../../index').getDependencyConfig();

let Config = {
  workflow: {
    deactivate_users: {
      [DEPENDENCY.TYPE.MONGODB]: [
        {
          id: DEPENDENCY.ID.MONGODB.mongo_test,
          mongoose_options: {
            poolSize: 10
          }
        }
      ]
    },
    providers_call_data: {
      [DEPENDENCY.TYPE.REDSHIFT]: [
        {
          id: DEPENDENCY.ID.REDSHIFT.redshift_dev
        }
      ],
      [DEPENDENCY.TYPE.MONGODB]: [
        {
          id: DEPENDENCY.ID.MONGODB.mongo_test,
          mongoose_options: {
            autoIndex: false,
            reconnectTries: Number.MAX_VALUE,
            reconnectInterval: 500,
            poolSize: 10,
            bufferMaxEntries: 0
          }
        }
      ]
    }
  },
  service: {
    [DEPENDENCY.TYPE.MONGODB]: [
      {
        id: DEPENDENCY.ID.MONGODB.mongo_test,
        mongoose_options: {
          autoIndex: false,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 500,
          poolSize: 10,
          bufferMaxEntries: 0
        }
      }
    ],
    [DEPENDENCY.TYPE.EVENT_CONSUMER]: {
      id: DEPENDENCY.ID.event_consumer,
      options: {
        eventProcessingWaitTimeMs: 500,
        concurrency: 1
      },
      message_handler: 'events/handlers/consumer-message',
      error_handler: 'events/handlers/consumer-error'
    }
  }
};

module.exports = {
  Config: Config
};
