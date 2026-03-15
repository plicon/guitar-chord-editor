/**
 * Authentication utilities for admin routes.
 * Uses HMAC-SHA256 to sign/verify tokens with the ADMIN_PASSWORD as key.
 */

import type { Env } from '../types';

interface TokenPayload {
  sub: string;   // username
  iat: number;   // issued at (seconds)
  exp: number;   // expires at (seconds)
}

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Create a signed token for the given username.
 */
export async function createToken(username: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: username,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  };

  const payloadStr = JSON.stringify(payload);
  const enc = new TextEncoder();
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadStr));

  const payloadB64 = toBase64Url(enc.encode(payloadStr));
  const sigB64 = toBase64Url(signature);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a token and return the payload if valid, or null if invalid/expired.
 */
export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;

  try {
    const payloadBytes = fromBase64Url(payloadB64);
    const sigBytes = fromBase64Url(sigB64);

    const key = await getKey(secret);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes);

    if (!valid) return null;

    const payload: TokenPayload = JSON.parse(new TextDecoder().decode(payloadBytes));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware: verify the Bearer token on admin requests.
 * Returns null if authorized, or an error Response if not.
 */
/**
 * Check if the request has a valid admin Bearer token (non-blocking).
 * Returns true if authenticated, false otherwise.
 */
export async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  const secret = (env as Record<string, unknown>).ADMIN_PASSWORD as string | undefined;
  if (!secret) return false;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  const payload = await verifyToken(token, secret);
  return payload !== null;
}

/**
 * Middleware: verify the Bearer token on admin requests.
 * Returns null if authorized, or an error Response if not.
 */
export async function requireAdminAuth(request: Request, env: Env): Promise<Response | null> {
  const secret = (env as Record<string, unknown>).ADMIN_PASSWORD as string | undefined;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Admin auth not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token, secret);

  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null; // authorized
}
