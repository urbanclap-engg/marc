export interface PreApiMiddlewareInterface {
  initPreRunMiddleware(app, method_url, method_path, options): void
}