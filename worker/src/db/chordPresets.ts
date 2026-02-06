/**
 * Database operations for chord presets
 */

import type {
  ChordPreset,
  ChordPresetRow,
  PaginationParams,
  ListResponse,
  CreateChordPresetRequest,
  UpdateChordPresetRequest,
} from '../types';
import { generateId } from '../utils/id';

/**
 * Convert database row to API response format
 */
function rowToPreset(row: ChordPresetRow): ChordPreset {
  return {
    id: row.id,
    name: row.name,
    frets: row.frets,
    startFret: row.start_fret,
    fingers: JSON.parse(row.fingers),
    barres: row.barres ? JSON.parse(row.barres) : [],
    mutedStrings: row.muted_strings ? JSON.parse(row.muted_strings) : [],
    openStrings: row.open_strings ? JSON.parse(row.open_strings) : [],
    fingerLabels: row.finger_labels ? JSON.parse(row.finger_labels) : [],
    symbols: row.symbols || undefined,
    steps: row.steps || undefined,
    notes: row.notes || undefined,
    instructions: row.instructions || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
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
 * Create a new chord preset
 */
export async function createChordPreset(
  db: D1Database,
  data: CreateChordPresetRequest
): Promise<ChordPreset> {
  const id = generateId();
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO chord_presets (
        id, name, frets, start_fret, fingers, barres, muted_strings, open_strings, finger_labels, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.name,
      data.frets,
      data.startFret || 1,
      JSON.stringify(data.fingers),
      data.barres ? JSON.stringify(data.barres) : JSON.stringify([]),
      data.mutedStrings ? JSON.stringify(data.mutedStrings) : JSON.stringify([]),
      data.openStrings ? JSON.stringify(data.openStrings) : JSON.stringify([]),
      data.fingerLabels ? JSON.stringify(data.fingerLabels) : JSON.stringify([]),
      now,
      now
    )
    .run();

  const preset = await getChordPreset(db, id);
  if (!preset) {
    throw new Error('Failed to create chord preset');
  }

  return preset;
}

/**
 * Update an existing chord preset
 */
export async function updateChordPreset(
  db: D1Database,
  id: string,
  data: UpdateChordPresetRequest
): Promise<ChordPreset | null> {
  const existing = await getChordPreset(db, id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.frets !== undefined) {
    updates.push('frets = ?');
    values.push(data.frets);
  }
  if (data.startFret !== undefined) {
    updates.push('start_fret = ?');
    values.push(data.startFret);
  }
  if (data.fingers !== undefined) {
    updates.push('fingers = ?');
    values.push(JSON.stringify(data.fingers));
  }
  if (data.barres !== undefined) {
    updates.push('barres = ?');
    values.push(JSON.stringify(data.barres));
  }
  if (data.mutedStrings !== undefined) {
    updates.push('muted_strings = ?');
    values.push(JSON.stringify(data.mutedStrings));
  }
  if (data.openStrings !== undefined) {
    updates.push('open_strings = ?');
    values.push(JSON.stringify(data.openStrings));
  }
  if (data.fingerLabels !== undefined) {
    updates.push('finger_labels = ?');
    values.push(JSON.stringify(data.fingerLabels));
  }

  if (updates.length === 0) {
    return existing;
  }

  // Always update the updated_at timestamp
  updates.push('updated_at = ?');
  values.push(Date.now());

  values.push(id);

  await db
    .prepare(`UPDATE chord_presets SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getChordPreset(db, id);
}

/**
 * Delete a chord preset
 */
export async function deleteChordPreset(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM chord_presets WHERE id = ?')
    .bind(id)
    .run();

  return result.meta.changes > 0;
}

/**
 * Search chord presets by name (starts with query)
 */
export async function searchChordPresets(
  db: D1Database,
  query: string,
  params: PaginationParams = {}
): Promise<ListResponse<ChordPreset>> {
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const searchPattern = `${query}%`;

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
