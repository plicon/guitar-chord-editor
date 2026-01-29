/**
 * Preset API routes
 */

import type {
  Env,
  CreateChordPresetRequest,
  UpdateChordPresetRequest,
  CreateStrummingPresetRequest,
  UpdateStrummingPresetRequest,
} from '../types';
import {
  listChordPresets,
  getChordPreset,
  searchChordPresets,
  createChordPreset,
  updateChordPreset,
  deleteChordPreset,
} from '../db/chordPresets';
import {
  listStrummingPresets,
  getStrummingPreset,
  searchStrummingPresets,
  createStrummingPreset,
  updateStrummingPreset,
  deleteStrummingPreset,
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

/**
 * Handle /api/admin/presets/chords routes (write-only)
 */
export async function handleAdminChordPresets(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // PUT /api/admin/presets/chords/:id
  if (pathParts.length === 5 && method === 'PUT') {
    const id = pathParts[4];

    try {
      const data: UpdateChordPresetRequest = await request.json();
      const preset = await updateChordPreset(env.DB, id, data);

      if (!preset) {
        return notFoundResponse('Chord preset');
      }

      return jsonResponse(preset);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  // DELETE /api/admin/presets/chords/:id
  if (pathParts.length === 5 && method === 'DELETE') {
    const id = pathParts[4];
    const deleted = await deleteChordPreset(env.DB, id);

    if (!deleted) {
      return notFoundResponse('Chord preset');
    }

    return jsonResponse({ success: true });
  }

  // POST /api/admin/presets/chords
  if (pathParts.length === 4 && method === 'POST') {
    try {
      const data: CreateChordPresetRequest = await request.json();

      if (!data.name || !data.frets || !data.fingers) {
        return errorResponse('Missing required fields: name, frets, fingers', 400);
      }

      const preset = await createChordPreset(env.DB, data);
      return jsonResponse(preset, 201);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  return methodNotAllowedResponse(['POST', 'PUT', 'DELETE']);
}

/**
 * Handle /api/admin/presets/strumming routes (write-only)
 */
export async function handleAdminStrummingPresets(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // PUT /api/admin/presets/strumming/:id
  if (pathParts.length === 5 && method === 'PUT') {
    const id = pathParts[4];

    try {
      const data: UpdateStrummingPresetRequest = await request.json();
      const preset = await updateStrummingPreset(env.DB, id, data);

      if (!preset) {
        return notFoundResponse('Strumming preset');
      }

      return jsonResponse(preset);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  // DELETE /api/admin/presets/strumming/:id
  if (pathParts.length === 5 && method === 'DELETE') {
    const id = pathParts[4];
    const deleted = await deleteStrummingPreset(env.DB, id);

    if (!deleted) {
      return notFoundResponse('Strumming preset');
    }

    return jsonResponse({ success: true });
  }

  // POST /api/admin/presets/strumming
  if (pathParts.length === 4 && method === 'POST') {
    try {
      const data: CreateStrummingPresetRequest = await request.json();

      if (!data.name || !data.pattern) {
        return errorResponse('Missing required fields: name, pattern', 400);
      }

      const preset = await createStrummingPreset(env.DB, data);
      return jsonResponse(preset, 201);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  return methodNotAllowedResponse(['POST', 'PUT', 'DELETE']);
}
