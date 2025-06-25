// Drizzle ORM setup for Cloudflare D1
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './models';

export const getDb = (env: Env) => drizzle(env.DB, { schema }); 