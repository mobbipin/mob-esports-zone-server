import { MiddlewareHandler } from 'hono';

export const roleGuard = (role: string): MiddlewareHandler => async (c, next) => {
  // TODO: Check user role from context
  await next();
}; 