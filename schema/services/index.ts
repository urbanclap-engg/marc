import _ from 'lodash';
import { Logger } from '../../logging/standard_logger';
import Error from '../../error';
import { initServiceClient, initDependencyClients } from './schema_object';

let Repo = { proto:{}, openapi:{} };

export const OpenApiSchema = {
  init: (serviceName) => {
    try {
      initDependencyClients(Repo);
      initServiceClient(serviceName, Repo);
    } catch (error) {
      throw new Error.RPCError({ err_type: Error.RPC_SCHEMA_FILE_ERROR, err_message: `failed to initialise service dependency schema. ${error.message}` });
    }
    Logger.info({key_1: 'schema_init', key_1_value: `successful`});
  },

  getOpenApiObj: (serviceId, version) => {
    if (Repo.openapi[serviceId] && Repo.openapi[serviceId][version]) {
      return Repo.openapi[serviceId][version];
    } else {
      throw { err_type: "openapi_obj_not_found" };
    }
  }
}