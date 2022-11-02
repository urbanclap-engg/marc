type singletonMapInterface = {} | (ClientMap & {Logger: LoggerInterface});
type DependencyConstantType = import('./schema/service_dependency_interface/dependency_constants').DependencyType;
type LoggerInterface = import('./logging/interface').LoggerInterface;

type transactionContextInterface = {
  addTransactionDataToLog: Function,
  patchBluebird: Function,
  getExpressMiddleware: Function,
  getTrxnId: Function
}

export interface RpcFrameworkInterface {
  initService(): any;
  getService(): any;
  addToSingleton(key: string, value: any): singletonMapInterface;
  getSingleton(): singletonMapInterface;
  initWorkflow(): any;
  getDependencyConfig(): DependencyConstantType;
  createClient(service_id: string, called_service_id: string, schema: object, server_host: string, server_port: number, client_options: any): object;
  createExternalClient(service_id: string, external_service_id: string, config: ClientMap): any;
  createServer(service_id: string, auth_service_ids: string[], schema: object, service: object, port: number): void;
  initConfig(service_id: string, options?: ClientMap): ClientMap;
  initCredentials(service_id: string): ClientMap;
  initLogger(options: ClientMap | string): object;
  addObjToSingleton(obj: object): any;
  initTransactionContext(params: any): transactionContextInterface;
  getGatewayConstants(): any;
}