import { ServerMiddleware } from './server';
import { ApiMiddleware } from './api';
import { MonitoringMiddleware } from './monitoring';
import { MiddlewareInterface } from './interface';


export const Middleware: MiddlewareInterface = {
  monitoringMiddleware: MonitoringMiddleware,
  serverMiddleware: ServerMiddleware,
  apiMiddleware: ApiMiddleware
}