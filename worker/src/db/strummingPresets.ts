/**
 * Database operations for strumming presets
 */

import type { StrummingPreset, StrummingPresetRow, PaginationParams, ListResponse } from '../types';

/**
 * Convert database row to API response format
 */
function rowToPreset(row: StrummingPresetRow): StrummingPreset {
  return {
    id: row.id,
    name: row.name,
    pattern: JSON.parse(row.pattern),
    description: row.description,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * List all strumming presets with pagination
 */
export async function listStrummingPresets(
  db: D1Database,
  params: PaginationParams = {}
): Promise<ListResponse<StrummingPreset>> {
  const limit = params.limit || 100;
  const offset = params.offset || 0;

  // Get total count
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM strumming_presets')
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare('SELECT * FROM strumming_presets ORDER BY name ASC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<StrummingPresetRow>();

  return {
    data: results.results.map(rowToPreset),
    total,
    limit,
    offset,
  };
}

/**
 * Get a specific strumming preset by ID
 */
export async function getStrummingPreset(
  db: D1Database,
  id: string
): Promise<StrummingPreset | null> {
  const result = await db
    .prepare('SELECT * FROM strumming_presets WHERE id = ?')
    .bind(id)
    .first<StrummingPresetRow>();

  return result ? rowToPreset(result) : null;
}

/**
 * Search strumming presets by name
 */
export async function searchStrummingPresets(
  db: D1Database,
  query: string,
  params: PaginationParams = {}
): Promise<ListResponse<StrummingPreset>> {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;

  // Get total count
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM strumming_presets WHERE name LIKE ?')
    .bind(searchPattern)
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare('SELECT * FROM strumming_presets WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?')
    .bind(searchPattern, limit, offset)
    .all<StrummingPresetRow>();

  return {
    data: results.results.map(rowToPreset),
    total,
    limit,
    offset,
  };
}
