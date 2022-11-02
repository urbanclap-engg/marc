type intiServiceEndpointsParamsType = {
  service_id: string,
  service: any,
  auth_service_ids: string[],
  schema: any,
  method_name: string,
  method_url: string,
  path: string
}

export interface ApiMiddlewareInterface {
  initServiceEndpoints(app, params: intiServiceEndpointsParamsType): void;
}