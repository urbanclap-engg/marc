export interface ServerMiddlewareInterface {
  debugLogRequest(req, res, next): void;
  getDBDetails(app): void;
  isInternalServiceAuthenticated(app, auth_service_ids: string[], service_id: string): void;
  getEventDataConfig(app, service_id: string): void;
  triggerProfiler(app): void;
  handleUndefinedRouteError(app, service_id: string): void;
  handleApiError(app, service_id: string): void
}