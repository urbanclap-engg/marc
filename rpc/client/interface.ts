export interface RpcClientInterface {
  createClient(serviceId: string, calledServiceId: string, schema: ClientMap, serverHost: string, serverPort: number, clientOptions?: ClientMap): ClientMap;
  createExternalClient(serviceId: string, externalServiceId: string, config?: ClientMap): ClientMap
}

export interface ClientUtilsInterface {
  getApiConfig(clientOptions: ClientMap): ClientMap;
  getSchemaValidator(methodName: string, expandedSchema, ajv): any;
  validateSchema(methodName: string, payload, schemaValidator): ClientMap;
  getSanitizedPayloadForClient(err): any;
  getErrorObj(type: string, msg: string): ClientMap;
  getQSWithAuditContextVariables(jsondata: ClientMap): ClientMap;
  getRequestPromise(options: ClientMap): any;
  shouldRetryOnError(err: ClientMap): boolean;
  createTrxnId(): string;
  getBasicQuery(serviceId: string): ClientMap;
  getRequestPromiseOptions(req, calledServiceId: string, methodName: string, serverHost: string, serverPort: number, basicQuery: ClientMap): ClientMap;
  requestPromiseCall(options: ClientMap): any;
}