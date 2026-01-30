/**
 * FretKit Cloudflare Worker
 * 
 * Main entry point for the Cloudflare Worker that provides the REST API
 * for managing chord charts and presets stored in D1.
 */

import type { Env } from './types';
import { openApiSpec } from './openapi';
import { handleCharts, handleAdminCharts } from './routes/charts';
import {
  handleChordPresets,
  handleStrummingPresets,
  handleAdminChordPresets,
  handleAdminStrummingPresets,
} from './routes/presets';
import {
  healthCheckResponse,
  errorResponse,
  methodNotAllowedResponse,
} from './utils/responses';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  addCorsHeaders,
} from './utils/cors';

/**
 * CORS configuration
 */
function getCorsConfig(env: Env) {
  const allowedOrigins =
    env.ENVIRONMENT === 'production'
      ? ['https://fretkit.io', 'https://www.fretkit.io']
      : [
          'http://localhost:5173', 
          'http://localhost:3000', 
          'https://fretkit.pages.dev', // Cloudflare Pages production
          '*' // Allow all preview deployments in non-production
        ];

  return {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'CF-Access-Client-Id', 'CF-Access-Client-Secret'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsConfig = getCorsConfig(env);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(request, corsConfig);
    }

    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);

      // Health check endpoint
      if (url.pathname === '/health' || url.pathname === '/') {
        const response = healthCheckResponse();
        return addCorsHeaders(response, request, corsConfig);
      }

      // API routes
      if (pathParts[0] === 'api') {
        let response: Response;

        // /api/docs - API Documentation UI
        if (pathParts[1] === 'docs' && pathParts.length === 2) {
          const html = `
<!DOCTYPE html>
<html>
<head>
  <title>FretKit API Documentation</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/docs/openapi.json"
    data-configuration='${JSON.stringify({
      theme: 'purple',
      layout: 'modern',
      defaultOpenAllTags: true,
    })}'></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
          `;
          response = new Response(html, {
            headers: { 'Content-Type': 'text/html' }
          });
          return addCorsHeaders(response, request, corsConfig);
        }

        // /api/docs/openapi.json - OpenAPI Specification
        if (pathParts[1] === 'docs' && pathParts[2] === 'openapi.json') {
          response = new Response(JSON.stringify(openApiSpec, null, 2), {
            headers: { 'Content-Type': 'application/json' }
          });
          return addCorsHeaders(response, request, corsConfig);
        }

        // /api/charts/*
        if (pathParts[1] === 'charts') {
          response = await handleCharts(request, env, pathParts);
        }
        // /api/admin/charts/*
        else if (pathParts[1] === 'admin' && pathParts[2] === 'charts') {
          response = await handleAdminCharts(request, env, pathParts);
        }
        // /api/presets/chords/*
        else if (pathParts[1] === 'presets' && pathParts[2] === 'chords') {
          response = await handleChordPresets(request, env, pathParts);
        }
        // /api/presets/strumming/*
        else if (pathParts[1] === 'presets' && pathParts[2] === 'strumming') {
          response = await handleStrummingPresets(request, env, pathParts);
        }
        // /api/admin/presets/chords/*
        else if (
          pathParts[1] === 'admin' &&
          pathParts[2] === 'presets' &&
          pathParts[3] === 'chords'
        ) {
          response = await handleAdminChordPresets(request, env, pathParts);
        }
        // /api/admin/presets/strumming/*
        else if (
          pathParts[1] === 'admin' &&
          pathParts[2] === 'presets' &&
          pathParts[3] === 'strumming'
        ) {
          response = await handleAdminStrummingPresets(request, env, pathParts);
        }
        // Unknown API route
        else {
          response = errorResponse('Not Found', 404);
        }

        return addCorsHeaders(response, request, corsConfig);
      }

      // 404 for all other routes
      const response = errorResponse('Not Found', 404);
      return addCorsHeaders(response, request, corsConfig);
    } catch (error) {
      console.error('Worker error:', error);
      const response = errorResponse(
        'Internal Server Error',
        500,
        env.ENVIRONMENT === 'development' ? error : undefined
      );
      return addCorsHeaders(response, request, corsConfig);
    }
  },
};
