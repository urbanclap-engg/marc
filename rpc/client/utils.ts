import _ from 'lodash';
import Promise from 'bluebird';
import Crypto from "crypto";
import RequestPromise from 'request-promise';
import { Logger } from '../../logging/standard_logger';
import { Response } from '../../common/response';
import TransactionContext from '../../transaction-context';
import AuditContext from '../../audit-context';
import AuditConstants from '../../audit-context/constants';
import ErrorTypes from '../../error';
import RPC_Constants from '../../constants';
import loadShed from '../../load_shed/index';
import * as CircuitBreaker from '../../circuit_breaker';
import { getSingleton } from '../../singleton';
import { ClientUtilsInterface } from './interface';
import { ConfigUtils } from '../../common/config_utils';

const ENV = ConfigUtils.getCurrentEnv();
const Singleton = getSingleton();

// Default timeout.
const TIMEOUT_MSEC = 10 * 10000;

let TRANSIENT_ERROR_CODES = new Set([
  502, // Bad Gateway
  503 // Service Unavailable
]);


export const ClientUtils: ClientUtilsInterface = {

  getApiConfig: (clientOptions) => {
    if (!clientOptions) {
      return {};
    }
    /**
     * to maintain backward compatibility with existing configs in SM
     * TODO remove when SM APIs are also modified to new structure
     */
    if (clientOptions.api_config) {
      return clientOptions.api_config;
    }

    /**
     * We are capitilazing this config because armor understand
     * all caps config as of now.
     * Ideally, armor should be taking in configs in small letters
     * TODO move this to armor
     */
    const api_config = {};
    if (clientOptions.api_configs) {
      _.each(clientOptions.api_configs, apiConfig => {
        api_config[apiConfig.api_name] = {
          CIRCUIT_BREAKER_OPTIONS: CircuitBreaker.transformCircuitBreakerOptions(
            apiConfig.circuit_breaker_options)
        }
      })
    }
    return api_config;
  },

  getSchemaValidator: (methodName, expandedSchema, ajv) => {
    try {
      const methodSchema = _.get(expandedSchema.paths, `/${methodName}.post.parameters.0.schema`, {})
      return ajv.compile(methodSchema)
    } catch (error) {
      Logger.error({
        key_1: 'schema_compilation_failed',
        key_1_value: `failed to compile the schema object using ajv for method: ${methodName}`,
        error: JSON.stringify(error)
      });
    }
  },

  validateSchema: (methodName, payload, schemaValidator) => {
    const validator = _.get(schemaValidator, methodName)
    const valid = validator(payload)
    return { valid: valid, errors: validator.errors }
  },

  getSanitizedPayloadForClient: (err) => {
    if(_.get(err, 'response.request.headers.content-length', 2049) < 2048) {
      return JSON.stringify(_.get(err, 'options.body', ''));
    }
    return undefined;
  },

  getErrorObj: (type, msg) => {
    return { 'error': { 'err_type': type, 'err_message': msg } };
  },

  /**
   * adds audit context to query string
   */
  getQSWithAuditContextVariables: (jsondata) => {
    const key = AuditConstants.CLIENT_USER_ID;
    const val = AuditContext.get(key);
    if (val) jsondata[key] = val;
    return jsondata;
  },

  getRequestPromise: (options) => {
    //handling for downstream
    const service = _.get(options, 'headers.external_service_id');
    const uri = _.get(options, 'uri');
    const api =  _.split(uri, service)[1];
    const reqPriority = _.get(options, 'qs.priority');

    let isAPIAllowed = true;
    if (service && api) {
      isAPIAllowed = loadShed.isDownStreamAPIAllowed(service, api, reqPriority);
    }
    if (isAPIAllowed) { 
      return RequestPromise(options).promise();
    } else {
      return new Promise((resolve, reject) => {
        const errObj = new ErrorTypes.RPCError({
          err_type: ErrorTypes.REQUEST_LOAD_SHEDED,
          code: RPC_Constants.HTTP_RESPONSE_CODE_TOO_MANY_REQUESTS,
        })
        const sanitised_err = ErrorTypes.sanitiseError(errObj);
        const errResp = Response.getErrorResponse(sanitised_err)
        reject(errResp);
      });
    }
  },

  shouldRetryOnError: (err) => {
    return TRANSIENT_ERROR_CODES.has(err.statusCode);
  },

  createTrxnId: () => Crypto.randomBytes(16).toString("hex"),

  getBasicQuery: (serviceId) => {
    const trxn_id = TransactionContext.getTrxnId() || "A-" + ClientUtils.createTrxnId();
    const language = TransactionContext.getTrxnLanguage()
    const priority = TransactionContext.getPriority();
    const basicQuery = {
      trxn_id: trxn_id,
      client_id: serviceId,
      priority,
      language 
    };
    return basicQuery;
  },

  getRequestPromiseOptions: (req, calledServiceId, methodName, serverHost, serverPort, basicQuery) => {
    const overriddenServerString = TransactionContext.getTrxnHeaders(req)?.['x-override-servers'] || "{}"
    const overriddenServerList = JSON.parse(overriddenServerString);
    const finalServer = ENV === 'development' ? (overriddenServerList[calledServiceId] || `${serverHost}:${serverPort}`) : `${serverHost}:${serverPort}`;

    let options = {
      method: 'POST',
      uri: 'http://' + finalServer + '/' + calledServiceId + '/' + methodName,
      qs: ClientUtils.getQSWithAuditContextVariables(basicQuery),
      body: req,
      json: true,
      timeout: TIMEOUT_MSEC,
      headers: {},
      resolveWithFullResponse: true
    };
    
    const debugMode = _.get(Singleton, 'Config.CUSTOM.logging_options.debug_mode');
    if (debugMode) { options['time'] = true; }

    const source = _.get(Singleton, 'Config.SOURCE_TYPE' , RPC_Constants.SOURCE_TYPE.SERVICE);
    const clientId = _.get(Singleton, 'Config.SUB_SERVICE_ID' ,options.qs.client_id);
    options.headers['client_id'] = source === RPC_Constants.SOURCE_TYPE.WORKFLOW ? `${clientId}-${RPC_Constants.SOURCE_TYPE.WORKFLOW}` : clientId;
    options.headers['external_service_id'] = calledServiceId;
    options.headers['method_name'] = methodName;
    options.headers['start_time_ms'] = Date.now();
    options.headers['connection'] = 'keep-alive';
    options['agent'] = _.get(Singleton, 'globalHttpAgent');
    if(ENV === 'development'){
      options.headers['x-override-servers'] = overriddenServerString
    }

    return options;
  },

  requestPromiseCall: (options) => {
    return RequestPromise(options);
  }
}