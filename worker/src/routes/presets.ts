/**
 * Preset API routes
 */

import type { Env } from '../types';
import {
  listChordPresets,
  getChordPreset,
  searchChordPresets,
} from '../db/chordPresets';
import {
  listStrummingPresets,
  getStrummingPreset,
  searchStrummingPresets,
} from '../db/strummingPresets';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  methodNotAllowedResponse,
} from '../utils/responses';

/**
 * Handle /api/presets/chords routes
 */
export async function handleChordPresets(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // GET /api/presets/chords/:id
  if (pathParts.length === 4 && method === 'GET') {
    const id = pathParts[3];
    const preset = await getChordPreset(env.DB, id);
    
    if (!preset) {
      return notFoundResponse('Chord preset');
    }
    
    return jsonResponse(preset);
  }

  // GET /api/presets/chords
  if (pathParts.length === 3 && method === 'GET') {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Search by query
    if (query) {
      const result = await searchChordPresets(env.DB, query, { limit, offset });
      return jsonResponse(result);
    }

    // List all
    const result = await listChordPresets(env.DB, { limit, offset });
    return jsonResponse(result);
  }

  return methodNotAllowedResponse(['GET']);
}

/**
 * Handle /api/presets/strumming routes
 */
export async function handleStrummingPresets(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // GET /api/presets/strumming/:id
  if (pathParts.length === 4 && method === 'GET') {
    const id = pathParts[3];
    const preset = await getStrummingPreset(env.DB, id);
    
    if (!preset) {
      return notFoundResponse('Strumming preset');
    }
    
    return jsonResponse(preset);
  }

  // GET /api/presets/strumming
  if (pathParts.length === 3 && method === 'GET') {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Search by query
    if (query) {
      const result = await searchStrummingPresets(env.DB, query, { limit, offset });
      return jsonResponse(result);
    }

    // List all
    const result = await listStrummingPresets(env.DB, { limit, offset });
    return jsonResponse(result);
  }

  return methodNotAllowedResponse(['GET']);
}
