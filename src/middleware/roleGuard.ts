import { MiddlewareHandler } from 'hono';

export const roleGuard = (allowedRoles: string | string[]): MiddlewareHandler => async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ status: false, error: 'Unauthorized' }, 401);
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(user.role)) {
    return c.json({ status: false, error: 'Insufficient permissions' }, 403);
  }

  await next();
}; 