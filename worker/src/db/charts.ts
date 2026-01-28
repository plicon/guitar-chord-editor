/**
 * Database operations for chord charts
 */

import type {
  ChordChart,
  ChordChartRow,
  CreateChartRequest,
  UpdateChartRequest,
  PaginationParams,
  ListResponse,
} from '../types';
import { generateId } from '../utils/id';

/**
 * Convert database row to API response format
 */
function rowToChart(row: ChordChartRow): ChordChart {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    key: row.key,
    timeSignature: row.time_signature,
    tempo: row.tempo,
    chords: JSON.parse(row.chords),
    strummingPattern: row.strumming_pattern
      ? JSON.parse(row.strumming_pattern)
      : undefined,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/**
 * List all charts with pagination
 */
export async function listCharts(
  db: D1Database,
  params: PaginationParams = {}
): Promise<ListResponse<ChordChart>> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  // Get total count
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM chord_charts')
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare('SELECT * FROM chord_charts ORDER BY updated_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<ChordChartRow>();

  return {
    data: results.results.map(rowToChart),
    total,
    limit,
    offset,
  };
}

/**
 * Get a specific chart by ID
 */
export async function getChart(
  db: D1Database,
  id: string
): Promise<ChordChart | null> {
  const result = await db
    .prepare('SELECT * FROM chord_charts WHERE id = ?')
    .bind(id)
    .first<ChordChartRow>();

  return result ? rowToChart(result) : null;
}

/**
 * Create a new chart
 */
export async function createChart(
  db: D1Database,
  data: CreateChartRequest
): Promise<ChordChart> {
  const id = generateId();
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO chord_charts (
        id, title, artist, key, time_signature, tempo,
        chords, strumming_pattern, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.title,
      data.artist || null,
      data.key || null,
      data.timeSignature || null,
      data.tempo || null,
      JSON.stringify(data.chords),
      data.strummingPattern ? JSON.stringify(data.strummingPattern) : null,
      data.notes || null,
      now,
      now
    )
    .run();

  // Fetch the created chart
  const chart = await getChart(db, id);
  if (!chart) {
    throw new Error('Failed to create chart');
  }

  return chart;
}

/**
 * Update an existing chart
 */
export async function updateChart(
  db: D1Database,
  id: string,
  data: UpdateChartRequest
): Promise<ChordChart | null> {
  // Check if chart exists
  const existing = await getChart(db, id);
  if (!existing) {
    return null;
  }

  const now = Date.now();
  const updates: string[] = [];
  const values: unknown[] = [];

  // Build dynamic UPDATE query
  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.artist !== undefined) {
    updates.push('artist = ?');
    values.push(data.artist);
  }
  if (data.key !== undefined) {
    updates.push('key = ?');
    values.push(data.key);
  }
  if (data.timeSignature !== undefined) {
    updates.push('time_signature = ?');
    values.push(data.timeSignature);
  }
  if (data.tempo !== undefined) {
    updates.push('tempo = ?');
    values.push(data.tempo);
  }
  if (data.chords !== undefined) {
    updates.push('chords = ?');
    values.push(JSON.stringify(data.chords));
  }
  if (data.strummingPattern !== undefined) {
    updates.push('strumming_pattern = ?');
    values.push(JSON.stringify(data.strummingPattern));
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }

  updates.push('updated_at = ?');
  values.push(now);

  values.push(id);

  await db
    .prepare(`UPDATE chord_charts SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getChart(db, id);
}

/**
 * Delete a chart
 */
export async function deleteChart(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM chord_charts WHERE id = ?')
    .bind(id)
    .run();

  return result.meta.changes > 0;
}

/**
 * Search charts by title or artist
 */
export async function searchCharts(
  db: D1Database,
  query: string,
  params: PaginationParams = {}
): Promise<ListResponse<ChordChart>> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const searchPattern = `%${query}%`;

  // Get total count
  const countResult = await db
    .prepare(
      'SELECT COUNT(*) as count FROM chord_charts WHERE title LIKE ? OR artist LIKE ?'
    )
    .bind(searchPattern, searchPattern)
    .first<{ count: number }>();
  
  const total = countResult?.count || 0;

  // Get paginated results
  const results = await db
    .prepare(
      'SELECT * FROM chord_charts WHERE title LIKE ? OR artist LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    )
    .bind(searchPattern, searchPattern, limit, offset)
    .all<ChordChartRow>();

  return {
    data: results.results.map(rowToChart),
    total,
    limit,
    offset,
  };
}
