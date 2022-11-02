import { ApiMiddlewareInterface } from "./api/interface";
import { MonitoringMiddlewareInterface } from "./monitoring/interface";
import { ServerMiddlewareInterface } from "./server/interface";


export interface MiddlewareInterface {
  monitoringMiddleware: MonitoringMiddlewareInterface;
  serverMiddleware: ServerMiddlewareInterface;
  apiMiddleware: ApiMiddlewareInterface
}