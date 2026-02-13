/**
 * Database operations for songs
 */

import type {
  Song,
  SongRow,
  CreateSongRequest,
  UpdateSongRequest,
  PaginationParams,
  ListResponse,
} from '../types';
import { generateId } from '../utils/id';

/**
 * Convert database row to API response format
 */
function rowToSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    description: row.description,
    key: row.key,
    tempo: row.tempo,
    timeSignature: row.time_signature,
    sections: JSON.parse(row.sections),
    strummingPattern: row.strumming_pattern
      ? JSON.parse(row.strumming_pattern)
      : undefined,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * List all songs with pagination
 */
export async function listSongs(
  db: D1Database,
  params: PaginationParams = {}
): Promise<ListResponse<Song>> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  // Get total count
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM songs')
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare('SELECT * FROM songs ORDER BY updated_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<SongRow>();

  return {
    data: results.results.map(rowToSong),
    total,
    limit,
    offset,
  };
}

/**
 * Get a specific song by ID
 */
export async function getSong(
  db: D1Database,
  id: string
): Promise<Song | null> {
  const result = await db
    .prepare('SELECT * FROM songs WHERE id = ?')
    .bind(id)
    .first<SongRow>();

  return result ? rowToSong(result) : null;
}

/**
 * Create a new song
 */
export async function createSong(
  db: D1Database,
  data: CreateSongRequest
): Promise<Song> {
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO songs (
        id, title, artist, description, key, tempo, time_signature,
        sections, strumming_pattern, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.title,
      data.artist || null,
      data.description || null,
      data.key || null,
      data.tempo || null,
      data.timeSignature || null,
      JSON.stringify(data.sections),
      data.strummingPattern ? JSON.stringify(data.strummingPattern) : null,
      data.notes || null,
      now,
      now
    )
    .run();

  const song = await getSong(db, id);
  if (!song) {
    throw new Error('Failed to create song');
  }

  return song;
}

/**
 * Update an existing song
 */
export async function updateSong(
  db: D1Database,
  id: string,
  data: UpdateSongRequest
): Promise<Song | null> {
  // Check if song exists
  const existing = await getSong(db, id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];

  // Build dynamic update query
  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.artist !== undefined) {
    updates.push('artist = ?');
    values.push(data.artist);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.key !== undefined) {
    updates.push('key = ?');
    values.push(data.key);
  }
  if (data.tempo !== undefined) {
    updates.push('tempo = ?');
    values.push(data.tempo);
  }
  if (data.timeSignature !== undefined) {
    updates.push('time_signature = ?');
    values.push(data.timeSignature);
  }
  if (data.sections !== undefined) {
    updates.push('sections = ?');
    values.push(JSON.stringify(data.sections));
  }
  if (data.strummingPattern !== undefined) {
    updates.push('strumming_pattern = ?');
    values.push(data.strummingPattern ? JSON.stringify(data.strummingPattern) : null);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db
    .prepare(`UPDATE songs SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return await getSong(db, id);
}

/**
 * Delete a song
 */
export async function deleteSong(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM songs WHERE id = ?')
    .bind(id)
    .run();

  return (result.meta.changes || 0) > 0;
}

/**
 * Search songs by title or artist
 */
export async function searchSongs(
  db: D1Database,
  query: string,
  params: PaginationParams = {}
): Promise<ListResponse<Song>> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;

  // Get total count
  const countResult = await db
    .prepare(
      'SELECT COUNT(*) as count FROM songs WHERE title LIKE ? OR artist LIKE ?'
    )
    .bind(searchPattern, searchPattern)
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare(
      'SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    )
    .bind(searchPattern, searchPattern, limit, offset)
    .all<SongRow>();

  return {
    data: results.results.map(rowToSong),
    total,
    limit,
    offset,
  };
}
