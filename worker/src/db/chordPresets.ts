/**
 * Database operations for chord presets
 */

import type { ChordPreset, ChordPresetRow, PaginationParams, ListResponse } from '../types';

/**
 * Convert database row to API response format
 */
function rowToPreset(row: ChordPresetRow): ChordPreset {
  return {
    id: row.id,
    name: row.name,
    frets: JSON.parse(row.frets),
    fingers: JSON.parse(row.fingers),
    barreInfo: row.barre_info ? JSON.parse(row.barre_info) : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * List all chord presets with pagination
 */
export async function listChordPresets(
  db: D1Database,
  params: PaginationParams = {}
): Promise<ListResponse<ChordPreset>> {
  const limit = params.limit || 100;
  const offset = params.offset || 0;

  // Get total count
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM chord_presets')
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare('SELECT * FROM chord_presets ORDER BY name ASC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<ChordPresetRow>();

  return {
    data: results.results.map(rowToPreset),
    total,
    limit,
    offset,
  };
}

/**
 * Get a specific chord preset by ID
 */
export async function getChordPreset(
  db: D1Database,
  id: string
): Promise<ChordPreset | null> {
  const result = await db
    .prepare('SELECT * FROM chord_presets WHERE id = ?')
    .bind(id)
    .first<ChordPresetRow>();

  return result ? rowToPreset(result) : null;
}

/**
 * Search chord presets by name
 */
export async function searchChordPresets(
  db: D1Database,
  query: string,
  params: PaginationParams = {}
): Promise<ListResponse<ChordPreset>> {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;

  // Get total count
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM chord_presets WHERE name LIKE ?')
    .bind(searchPattern)
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare('SELECT * FROM chord_presets WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?')
    .bind(searchPattern, limit, offset)
    .all<ChordPresetRow>();

  return {
    data: results.results.map(rowToPreset),
    total,
    limit,
    offset,
  };
}
