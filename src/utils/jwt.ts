import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

export const signJwt = async (payload: Record<string, any>, secret: string): Promise<string> => {
  try {
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(secret));
    return jwt;
  } catch (error) {
    console.error('JWT signing error:', error);
    throw new Error('Failed to sign JWT');
  }
};

export const verifyJwt = async (token: string, secret: string): Promise<any> => {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}; 