/**
 * CORS utilities for handling cross-origin requests
 */

export interface CorsOptions {
  origin: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const DEFAULT_HEADERS = ['Content-Type', 'Authorization'];

export function getCorsHeaders(
  request: Request,
  options: CorsOptions
): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  
  // Check if origin is allowed
  const allowedOrigins = Array.isArray(options.origin)
    ? options.origin
    : [options.origin];
  
  const isAllowed =
    options.origin === '*' ||
    allowedOrigins.some(
      (allowed) => allowed === '*' || origin === allowed || origin.endsWith(allowed)
    );

  if (!isAllowed) {
    return {};
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': options.origin === '*' ? '*' : origin,
    'Access-Control-Allow-Methods': (
      options.methods || DEFAULT_METHODS
    ).join(', '),
    'Access-Control-Allow-Headers': (
      options.allowedHeaders || DEFAULT_HEADERS
    ).join(', '),
  };

  if (options.exposedHeaders?.length) {
    headers['Access-Control-Expose-Headers'] = options.exposedHeaders.join(', ');
  }

  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  if (options.maxAge) {
    headers['Access-Control-Max-Age'] = options.maxAge.toString();
  }

  return headers;
}

export function handleCorsPreflightRequest(
  request: Request,
  options: CorsOptions
): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, options),
  });
}

export function addCorsHeaders(
  response: Response,
  request: Request,
  options: CorsOptions
): Response {
  const corsHeaders = getCorsHeaders(request, options);
  const headers = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
