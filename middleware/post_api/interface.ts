export interface PostApiMiddlewareInterface {
  initPostRunMiddleware(app, method_url, method_path, options): void
}