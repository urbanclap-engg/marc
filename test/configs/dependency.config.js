'use strict';

const DEPENDENCY = require('../..').getDependencyConfig();

let Config = {
    service: {
        [DEPENDENCY.TYPE.INTERNAL_SERVICE]: [{
            id: DEPENDENCY.ID.INTERNAL_SERVICE['sample-service'],
            version: 0
        }]
    }
};

module.exports = {
    Config: Config
};
