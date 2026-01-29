/**
 * Database operations for strumming presets
 */

import type {
  StrummingPreset,
  StrummingPresetRow,
  PaginationParams,
  ListResponse,
  CreateStrummingPresetRequest,
  UpdateStrummingPresetRequest,
} from '../types';
import { generateId } from '../utils/id';

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
 * Create a new strumming preset
 */
export async function createStrummingPreset(
  db: D1Database,
  data: CreateStrummingPresetRequest
): Promise<StrummingPreset> {
  const id = generateId();
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO strumming_presets (
        id, name, pattern, description, created_at
      ) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.name,
      JSON.stringify(data.pattern),
      data.description || null,
      now
    )
    .run();

  const preset = await getStrummingPreset(db, id);
  if (!preset) {
    throw new Error('Failed to create strumming preset');
  }

  return preset;
}

/**
 * Update an existing strumming preset
 */
export async function updateStrummingPreset(
  db: D1Database,
  id: string,
  data: UpdateStrummingPresetRequest
): Promise<StrummingPreset | null> {
  const existing = await getStrummingPreset(db, id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.pattern !== undefined) {
    updates.push('pattern = ?');
    values.push(JSON.stringify(data.pattern));
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);

  await db
    .prepare(`UPDATE strumming_presets SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getStrummingPreset(db, id);
}

/**
 * Delete a strumming preset
 */
export async function deleteStrummingPreset(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM strumming_presets WHERE id = ?')
    .bind(id)
    .run();

  return result.meta.changes > 0;
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
