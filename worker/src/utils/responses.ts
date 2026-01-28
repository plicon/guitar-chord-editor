/**
 * Standard response helpers for consistent API responses
 */

import type { ErrorResponse } from '../types';

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(
  error: string,
  status = 400,
  details?: unknown
): Response {
  const body: ErrorResponse = { error };
  if (details) {
    body.details = details;
  }
  return jsonResponse(body, status);
}

export function notFoundResponse(resource: string): Response {
  return errorResponse(`${resource} not found`, 404);
}

export function methodNotAllowedResponse(allowed: string[]): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: {
      Allow: allowed.join(', '),
    },
  });
}

export function healthCheckResponse(): Response {
  return jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
