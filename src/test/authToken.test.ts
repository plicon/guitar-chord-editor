import { describe, it, expect } from 'vitest';

// Inline auth logic with type casts for Node/Vitest compatibility
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toB64(data: Uint8Array): string {
  let s = '';
  for (let i = 0; i < data.length; i++) s += String.fromCharCode(data[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  const bin = atob(padded);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

interface TokenPayload { sub: string; iat: number; exp: number }

async function createToken(username: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payloadStr = JSON.stringify({ sub: username, iat: now, exp: now + TOKEN_EXPIRY_SECONDS });
  const data = new TextEncoder().encode(payloadStr);
  const k = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', k, data);
  return `${toB64(data)}.${toB64(new Uint8Array(sig))}`;
}

async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const payloadBuf = fromB64(parts[0]);
    const sigBuf = fromB64(parts[1]);
    const k = await getKey(secret);
    if (!await crypto.subtle.verify('HMAC', k, sigBuf, payloadBuf)) return null;
    const payload: TokenPayload = JSON.parse(new TextDecoder().decode(payloadBuf));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

describe('auth token', () => {
  const SECRET = 'test-secret-key-123';

  it('creates a valid token that can be verified', async () => {
    const token = await createToken('admin', SECRET);
    expect(token).toContain('.');
    const payload = await verifyToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('admin');
  });

  it('rejects token with wrong secret', async () => {
    const token = await createToken('admin', SECRET);
    expect(await verifyToken(token, 'wrong-secret')).toBeNull();
  });

  it('rejects tampered token', async () => {
    const token = await createToken('admin', SECRET);
    const tampered = token.slice(0, -2) + 'XX';
    expect(await verifyToken(tampered, SECRET)).toBeNull();
  });

  it('rejects expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const payloadStr = JSON.stringify({ sub: 'admin', iat: now - 100000, exp: now - 1 });
    const data = new TextEncoder().encode(payloadStr);
    const k = await getKey(SECRET);
    const sig = await crypto.subtle.sign('HMAC', k, data);
    const token = `${toB64(data)}.${toB64(new Uint8Array(sig))}`;
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyToken('', SECRET)).toBeNull();
    expect(await verifyToken('just-one-part', SECRET)).toBeNull();
    expect(await verifyToken('a.b.c', SECRET)).toBeNull();
  });

  it('includes correct expiry', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createToken('admin', SECRET);
    const payload = await verifyToken(token, SECRET);
    expect(payload!.exp).toBeGreaterThanOrEqual(before + TOKEN_EXPIRY_SECONDS);
  });
});
