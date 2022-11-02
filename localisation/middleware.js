'use strict';

const Singleton = require('../singleton').getSingleton();
const _ = require('lodash');
const localisation = Singleton.localization;
const LOCALISATION_CONSTANTS = require('../localisation/constants');

let localisationMiddlware = {};

localisationMiddlware.getLocalizedResponse = async (err, req, res, next) => {
    let auth_options = Singleton.TransactionContext.getTrxnHeaders(req.body);
    let options = {};
    options.entity_type = _.get(auth_options, 'auth.id_type');
    options.entity_id = _.get(auth_options, 'auth.id');

    if (_.get(req, "headers['x-preferred-language']")) {
        options.language = _.get(req, "headers['x-preferred-language']");
    }
    options.originalUrl = _.get(req, 'originalUrl');
    options.consumers = _.get(req, "headers['localisation-options'].consumers");
    if(err) {
      err = await getLocalizedError(err,options);
      return next(err);
    }
    const result = await localisation.getLocalizedResponse(req.result, options);
    req.result = result
    return next();
};

async function getLocalizedError(err,options){
  if(_.isEmpty(err.err_type) || _.isEmpty(err.err_message)){
    return err;
  }

  const localizedError = await localisation.getLocalizedResponse({err_type: err.err_type, err_message: err.err_message},options);
  err.err_type = localizedError.err_type;
  err.err_message = localizedError.err_message;
  return err;
}

module.exports = localisationMiddlware;
