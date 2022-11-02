export interface MonitoringMiddlewareInterface {
  monitorMiddlewares(app): void;
  healthCheck(app, service_id: string): void;
  ecsServiceHealthCheck(app, ecs_service_id: string, service_id: string): void;
  exposeOpenapiRpcMetrics(app): void;
  exposeApplicationMetrics(app): void
}