/**
 * Song API routes
 */

import type { Env, CreateSongRequest, UpdateSongRequest } from '../types';
import {
  listSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
  searchSongs,
} from '../db/songs';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  methodNotAllowedResponse,
} from '../utils/responses';
import { isAuthenticated } from '../utils/auth';

/**
 * Handle /api/songs routes (read-only)
 */
export async function handleSongs(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;
  const authed = await isAuthenticated(request, env);
  const privateOpts = { includePrivate: authed };

  // GET /api/songs/:id - Get single song
  if (pathParts.length === 3 && method === 'GET') {
    const id = pathParts[2];
    const song = await getSong(env.DB, id);

    if (!song) {
      return notFoundResponse('Song');
    }

    // Block unauthenticated access to bracketed-title songs
    if (!authed && /^\[.*\]/.test(song.title)) {
      return notFoundResponse('Song');
    }

    return jsonResponse(song);
  }

  // GET /api/songs - List or search songs
  if (pathParts.length === 2 && method === 'GET') {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Search
    if (query) {
      const result = await searchSongs(env.DB, query, { limit, offset }, privateOpts);
      return jsonResponse(result);
    }

    // List all
    const result = await listSongs(env.DB, { limit, offset }, privateOpts);
    return jsonResponse(result);
  }

  return methodNotAllowedResponse(['GET']);
}

/**
 * Handle /api/admin/songs routes (CRUD)
 */
export async function handleAdminSongs(
  request: Request,
  env: Env,
  pathParts: string[]
): Promise<Response> {
  const method = request.method;

  // GET /api/admin/songs (list/search)
  if (pathParts.length === 3 && method === 'GET') {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (query) {
      const result = await searchSongs(env.DB, query, { limit, offset });
      return jsonResponse(result);
    }

    const result = await listSongs(env.DB, { limit, offset });
    return jsonResponse(result);
  }

  // PUT /api/admin/songs/:id
  if (pathParts.length === 4 && method === 'PUT') {
    const id = pathParts[3];

    try {
      const data: UpdateSongRequest = await request.json();
      const song = await updateSong(env.DB, id, data);

      if (!song) {
        return notFoundResponse('Song');
      }

      return jsonResponse(song);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  // DELETE /api/admin/songs/:id
  if (pathParts.length === 4 && method === 'DELETE') {
    const id = pathParts[3];
    const deleted = await deleteSong(env.DB, id);

    if (!deleted) {
      return notFoundResponse('Song');
    }

    return new Response(null, { status: 204 });
  }

  // POST /api/admin/songs
  if (pathParts.length === 3 && method === 'POST') {
    try {
      const data: CreateSongRequest = await request.json();

      // Validate required fields
      if (!data.title || !data.sections) {
        return errorResponse('Missing required fields: title, sections', 400);
      }

      const song = await createSong(env.DB, data);
      return jsonResponse(song, 201);
    } catch (error) {
      return errorResponse('Invalid request body', 400, error);
    }
  }

  return methodNotAllowedResponse(['GET', 'POST', 'PUT', 'DELETE']);
}
