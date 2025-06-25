import { MiddlewareHandler } from 'hono';

export const jwtAuth: MiddlewareHandler = async (c, next) => {
  // TODO: Implement JWT validation
  await next();
}; 