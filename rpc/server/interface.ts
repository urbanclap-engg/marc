export interface RpcServerInterface {
  createServer(service_id: string, auth_service_ids: string[], schema, service, port): void;
}
