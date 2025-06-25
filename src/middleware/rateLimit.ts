import { MiddlewareHandler } from 'hono';

export const rateLimit: MiddlewareHandler = async (c, next) => {
  // TODO: Implement rate limiting
  await next();
}; 