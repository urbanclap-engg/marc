/// <reference path="types/clients.d.ts" />

declare module '@uc-engg/marc' {
  type DependencyConstantType = import('./schema/service_dependency_interface/dependency_constants').DependencyType;
  type DependencyConfigType = import('./schema/service_dependency_interface/dependency_config').DependencyConfigType;
  export { DependencyConstantType }
  export { DependencyConfigType }
  export type singletonMapInterface = ClientMap & {Logger: LoggerInterface};

  export type localisationInterface = {
    service_id: string,
    singleton_id? : string
  }

  export type transactionContextInterface = {
    addTransactionDataToLog: Function,
    patchBluebird: Function,
    getExpressMiddleware: Function,
    getTrxnId: Function
  }
  
  export type initUCErrorInterface = {
    err_message: string,
    err_stack: object | string,
    err_type: string
  }

  export type initRPCErrorInterface = {
    err_message: string,
    err_stack: object | string,
    err_type: string
  }

  export function initService (): any;
  export function getService (): any;
  export function addToSingleton (key: string, value: any): singletonMapInterface;
  export function getSingleton (): singletonMapInterface;
  export function initWorkflow (): any;
  export function getDependencyConfig (): DependencyConstantType;
  export function createClient (service_id: string, called_service_id: string, schema: object, server_host: string, server_port: number, client_options: any): object;
  export function createExternalClient(service_id: string, external_service_id: string, config: ClientMap): any;
  export function createServer (service_id: string, auth_service_ids: string[], schema: object, service: object, port: number): void;
  export function initConfig (service_id: string, options?: ClientMap): ClientMap;
  export function initCredentials(service_id: string): ClientMap;
  export function initLogger (options: ClientMap | string): object;
  export function addObjToSingleton (obj: object): any;
  export function initTransactionContext (params: any): transactionContextInterface;
  export function getGatewayConstants(): any

  type LoggerInterface = {
    info: (log: LoggingObject) => void;
    error: (log: LoggingObject) => void;
    debug: (log: LoggingObject) => void;
  }

  type LoggingObject = Partial<{
    //SERVICE_LEVEL_PARAMS
    key_1: string;
    key_1_value: string;
    key_2: string;
    key_2_value: string;
    key_3: string;
    key_3_value: string;
    numkey_1: string;
    numkey_1_value: number;
    numkey_2: string;
    numkey_2_value: number;
    numkey_3: string;
    numkey_3_value: number;

    //COMMON_PARAMS
    customer_request_id: string;
    provider_id: string;
    customer_id: string;
    lead_id: string;
    method_name: string;

    //STRINGIFY_OBJECTS
    message: string;
    error_stack: string;
    error_payload: string;
    error: {err_type: string, err_message: string};
    error_message: string;
    error_type: string;
  }> | Record<string, any>
}
