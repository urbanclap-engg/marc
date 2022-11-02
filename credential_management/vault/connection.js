'use strict';

let rp = require('request-promise');
let aws4 = require('aws4');
const aws = require('aws-sdk');
const _ = require("lodash");  
let { Logger } = require('../../logging/standard_logger');
const CONSTANTS = require('../../constants');
const { LOG_CONSTANTS, LOG_TYPE } = require('../../logging/constants');
const ErrorTypes = require('../../error');
const retryablePromise = require('../../retryable_promise');

const SUCCESS = 'success';
const FAILURE = 'failure';
const STANDBY = 'standby';
let Connection = {};

// constants for retryable request promise
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_AFTER_MS = 100;
const DEFAULT_BACKOFF_FACTOR = 2;

function retryableErrorHandler(err) {
  return true;
}

/**
 * Creates a node-vault client
 * @param vault_token
 * @param cms_server_addr
 * @returns {client}
 */
function getClient(vault_token, cms_server_addr) {
  let options = {
    apiVersion: 'v1',
    endpoint: cms_server_addr,
    token: vault_token
  };
  return require('node-vault')(options);
}

/**
 * Get the container authentication credentials from ECS metadata service
 */
async function getContainerAuthenticationCredentials() {
    aws.config.credentials = new aws.ECSCredentials({
      httpOptions: { timeout: 5000 }, // 5 second timeout
      maxRetries: 10, // retry 10 times
      retryDelayOptions: { base: 100 } // its exponential 
    });
    const sts = new aws.STS();
    var rolearn = await sts.getCallerIdentity({}).promise()
    var creds = await aws.config.credentials.getPromise()
    var ecs_creds = JSON.stringify({
                    RoleArn: rolearn.Arn,
                    AccessKeyId: aws.config.credentials.accessKeyId,
                    SecretAccessKey: aws.config.credentials.secretAccessKey,
                    Token: aws.config.credentials.sessionToken
                    });
    return ecs_creds;
}


/*
Create IAM signed request which will be used to make vault http call to get its client
As per: https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html
*/
function createSignedRequestForVaultToken(credentials) {
  const { RoleArn, AccessKeyId, SecretAccessKey, Token } = credentials;
  const accessKeyId = AccessKeyId;
  const secretAccessKey = SecretAccessKey;
  const sessionToken = Token;
  const role = String(RoleArn).split('/')[1];
  const URL = 'https://sts.amazonaws.com/';
  const BODY = 'Action=GetCallerIdentity&Version=2011-06-15';

  const headers = {
    // 'X-Vault-AWS-IAM-Server-ID': '<vault-id>'
  };
  const req = {
    service: 'sts',
    region: 'us-east-1', // https://github.com/hashicorp/vault-ruby/pull/161#issuecomment-355723269
    doNotModifyHeaders: false, // DISABLED temporal workaround to https://github.com/hashicorp/vault/issues/2810#issuecomment-306530386
    body: BODY,
    headers
  };

  aws4.sign(req, { accessKeyId, secretAccessKey, sessionToken });
  // Content-Length header workaround for Vault v0.9.1 and lower
  // https://github.com/hashicorp/vault/issues/3763/
  req.headers['Content-Length'] = req.headers['Content-Length'].toString();

  // construct request for vault
  return {
    role,
    iam_http_request_method: 'POST',
    iam_request_url: Buffer.from(URL).toString('base64'),
    iam_request_body: Buffer.from(BODY).toString('base64'),
    iam_request_headers: Buffer.from(JSON.stringify(req.headers)).toString('base64')
  }
}

Connection.getVaultClient = (options) => {
  let cms_server_addr = options.vault_address;
  return getContainerAuthenticationCredentials()
      .then(function(auth) {
      return JSON.parse(auth)
    })
    .then(function(credentials) {
      return createSignedRequestForVaultToken(credentials);
    })
    .then(function(request) {
      // This is the vault AWS role
      request["role"] = options.service_id;
      /*
      * Verify container with vault. If the container) is permitted, it will receive a temporary token for accessing
      * credentials for the given service_id.
      */
     let rpRetryable = retryablePromise(rp, DEFAULT_RETRIES, DEFAULT_RETRY_AFTER_MS,
      DEFAULT_BACKOFF_FACTOR, retryableErrorHandler, DEFAULT_TIMEOUT_MS);

      return rpRetryable(cms_server_addr + CONSTANTS.CMS.VAULT_LOGIN_URL,
        {
          method:'POST',
          body: request,
          json: true
        })
    })
    .then(function(resp_from_vault) {
      let vault_token = resp_from_vault['auth']['client_token'];
      return(vault_token);
    })
    .then(function(token) {
      return getClient(token, cms_server_addr)
  })
};

async function getLocalToken(service_id) {
  const Singleton = require('../../singleton').getSingleton();
  let pcsConfig = Singleton.Config.GLOBAL_CONF[CONSTANTS.VAULT_CONFIG.SOURCE]
  pcsConfig = _.merge(pcsConfig, CONSTANTS.VAULT_CONFIG)
  let token_url = `http://${pcsConfig.discovery.uri}:${pcsConfig.discovery.port}/${pcsConfig.SOURCE}/${pcsConfig.VAULT_TOKEN_URL}=${service_id}` 
  return rp({
    uri: token_url,
    method: 'POST',
    body: { 'localDevUserInfo': process.env.USER },
    json: true
  }
  )
};

Connection.getVaultLocalClient = async (options) => {
  let cms_server_addr = options.vault_address;
  let token = await getLocalToken(options.service_id);
  let getClientRetryable = retryablePromise(getClient,
    DEFAULT_RETRIES, DEFAULT_RETRY_AFTER_MS, DEFAULT_BACKOFF_FACTOR, retryableErrorHandler,
    DEFAULT_TIMEOUT_MS);
  return getClientRetryable(token.Token, cms_server_addr)
};

Connection.fetchClient = (options) => {
  if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
    return Connection.getVaultClient(options);
  }
  else {
    return Connection.getVaultLocalClient(options);
  }
};
module.exports = Connection;
