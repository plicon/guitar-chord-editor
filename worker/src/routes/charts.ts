/**
 * Chart API routes
 */

import type { Env, CreateChartRequest, UpdateChartRequest } from '../types';
import {
  listCharts,
  getChart,
  createChart,
  updateChart,
  deleteChart,
  searchCharts,
} from '../db/charts';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  methodNotAllowedResponse,
} from '../utils/responses';

/**
 * Handle /api/charts routes (read-only)
 */
export async function handleCharts(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // GET /api/charts
  if (pathParts.length === 2 && method === 'GET') {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Search
    if (query) {
      const result = await searchCharts(env.DB, query, { limit, offset });
      return jsonResponse(result);
    }

    // List all
    const result = await listCharts(env.DB, { limit, offset });
    return jsonResponse(result);
  }

  return methodNotAllowedResponse(['GET']);
}

/**
 * Handle /api/admin/charts routes (write-only)
 */
export async function handleAdminCharts(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // PUT /api/admin/charts/:id
  if (pathParts.length === 4 && method === 'PUT') {
    const id = pathParts[3];

    try {
      const data: UpdateChartRequest = await request.json();
      const chart = await updateChart(env.DB, id, data);

      if (!chart) {
        return notFoundResponse('Chart');
      }

      return jsonResponse(chart);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  // DELETE /api/admin/charts/:id
  if (pathParts.length === 4 && method === 'DELETE') {
    const id = pathParts[3];
    const deleted = await deleteChart(env.DB, id);

    if (!deleted) {
      return notFoundResponse('Chart');
    }

    return new Response(null, { status: 204 });
  }

  // POST /api/admin/charts
  if (pathParts.length === 3 && method === 'POST') {
    try {
      const data: CreateChartRequest = await request.json();

      // Validate required fields
      if (!data.title || !data.chords) {
        return errorResponse('Missing required fields: title, chords', 400);
      }

      const chart = await createChart(env.DB, data);
      return jsonResponse(chart, 201);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  return methodNotAllowedResponse(['POST', 'PUT', 'DELETE']);
}
