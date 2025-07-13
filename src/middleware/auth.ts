import { MiddlewareHandler } from 'hono';
import { verifyJwt } from '../utils/jwt';

export const jwtAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  const token = auth.slice(7);
  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    if (!payload) throw new Error('Invalid');
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};

// Optional JWT middleware: sets user if present, but never returns 401
export const jwtAuthOptional: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const payload = await verifyJwt(token, c.env.JWT_SECRET);
      if (payload) c.set('user', payload);
    } catch (e) {
      // ignore
    }
  }
  await next();
}; 