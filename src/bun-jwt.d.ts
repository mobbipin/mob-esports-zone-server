declare module 'bun-jwt' {
  export function sign(payload: any, secret: string): Promise<string>;
  export function verify(token: string, secret: string): Promise<any>;
} 