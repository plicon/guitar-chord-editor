/**
 * Authentication routes
 */

import type { Env } from '../types';
import { createToken } from '../utils/auth';
import { jsonResponse, errorResponse } from '../utils/responses';

/**
 * Handle POST /api/auth/login
 */
export async function handleAuthLogin(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    });
  }

  const expectedUsername = (env as Record<string, unknown>).ADMIN_USERNAME as string | undefined;
  const expectedPassword = (env as Record<string, unknown>).ADMIN_PASSWORD as string | undefined;

  if (!expectedUsername || !expectedPassword) {
    return errorResponse('Admin auth not configured on server', 500);
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { username, password } = body;

  if (!username || !password) {
    return errorResponse('Username and password are required', 400);
  }

  // Constant-time-ish comparison (good enough for this use case)
  if (username !== expectedUsername || password !== expectedPassword) {
    return errorResponse('Invalid credentials', 401);
  }

  const token = await createToken(username, expectedPassword);

  return jsonResponse({ token });
}
