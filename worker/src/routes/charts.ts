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
 * Handle /api/charts routes
 */
export async function handleCharts(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // GET /api/charts/:id
  if (pathParts.length === 3 && method === 'GET') {
    const id = pathParts[2];
    const chart = await getChart(env.DB, id);
    
    if (!chart) {
      return notFoundResponse('Chart');
    }
    
    return jsonResponse(chart);
  }

  // PUT /api/charts/:id
  if (pathParts.length === 3 && method === 'PUT') {
    const id = pathParts[2];
    
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

  // DELETE /api/charts/:id
  if (pathParts.length === 3 && method === 'DELETE') {
    const id = pathParts[2];
    const deleted = await deleteChart(env.DB, id);
    
    if (!deleted) {
      return notFoundResponse('Chart');
    }
    
    return jsonResponse({ success: true });
  }

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

  // POST /api/charts
  if (pathParts.length === 2 && method === 'POST') {
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

  return methodNotAllowedResponse(['GET', 'POST', 'PUT', 'DELETE']);
}
