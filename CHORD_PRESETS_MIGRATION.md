# Chord Presets API Migration

This document describes the migration from the old chord presets format to the new format that matches the frontend.

## Changes Made

### 1. Database Schema Update

**Old Schema:**
```sql
CREATE TABLE chord_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frets TEXT NOT NULL, -- JSON array like [-1, 3, 2, 0, 1, 0]
  fingers TEXT NOT NULL, -- JSON array like [-1, 3, 2, 0, 1, 0]
  barre_info TEXT, -- JSON object {fret, fromString, toString}
  created_at INTEGER NOT NULL
);
```

**New Schema:**
```sql
CREATE TABLE chord_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frets INTEGER NOT NULL DEFAULT 5, -- Number of frets to display
  fingers TEXT NOT NULL, -- JSON array of {string, fret, finger?}
  barres TEXT, -- JSON array of {fret, fromString, toString, finger?}
  muted_strings TEXT, -- JSON array of string numbers
  open_strings TEXT, -- JSON array of string numbers
  finger_labels TEXT, -- JSON array of {string, finger}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 2. API Response Format

**Old Format:**
```json
{
  "id": "c-major-1",
  "name": "C",
  "frets": "[0, 3, 2, 0, 1, 0]",
  "fingers": "[0, 3, 2, 0, 1, 0]",
  "barreInfo": null,
  "createdAt": "2026-02-03T12:00:00.000Z"
}
```

**New Format:**
```json
{
  "id": "c-major-1",
  "name": "C",
  "frets": 5,
  "fingers": [
    { "string": 2, "fret": 1, "finger": 1 },
    { "string": 4, "fret": 2, "finger": 2 },
    { "string": 5, "fret": 3, "finger": 3 }
  ],
  "barres": [],
  "mutedStrings": [6],
  "openStrings": [1, 3],
  "fingerLabels": [],
  "createdAt": "2026-02-03T12:00:00.000Z",
  "updatedAt": "2026-02-03T12:00:00.000Z"
}
```

### 3. Files Modified

#### Worker (Backend)
- `worker/migrations/0004_update_chord_presets_schema.sql` - New migration
- `worker/src/types.ts` - Updated ChordPreset types
- `worker/src/db/chordPresets.ts` - Updated CRUD functions
- `worker/src/openapi.ts` - Updated API documentation

#### Frontend
- `src/pages/AdminChords.tsx` - Removed transformation functions
- `src/services/presets/chordApi.ts` - Updated type signatures
- `scripts/seedChords.ts` - New seed script

## Migration Steps

### 1. Run Database Migration

```bash
cd worker
npx wrangler d1 migrations apply fretkit-db --remote
```

This will drop the old `chord_presets` table and create the new one.

### 2. Deploy Worker

NB: Defaults to development environment

```bash
cd worker
npm run deploy
```

### 3. Seed Database
# For remote production database
VITE_ADMIN_API_URL=https://api.fretkit.io/api/admin

```bash
cd ..
npx tsx scripts/seedChords.ts
```

This will create 36 common chord presets including major, minor, 7th, barre, power, sus, and other common chords.

**Alternative methods:**
```bash
# If you have tsx installed globally
tsx scripts/seedChords.ts

# Or using ts-node
npx ts-node scripts/seedChords.ts
```

### 4. Deploy Frontend

```bash
npm run build
# Deploy to Cloudflare Pages
```

## Benefits

1. **No transformation needed** - API returns exactly what frontend expects
2. **Simpler code** - Removed `convertApiPresetToChord` function
3. **Better type safety** - Direct type matching between frontend and backend
4. **Easier maintenance** - One format to understand
5. **Fewer bugs** - No JSON parsing errors or data format mismatches

## Breaking Changes

⚠️ **This is a breaking change**. All existing chord presets in the database will be deleted during migration. Use the seed script to repopulate with common chords.

If you need to preserve existing data:
1. Export existing presets before migration
2. Convert them to the new format
3. Re-import after migration

## Testing

After migration, verify:

1. **List chords**: GET `/api/presets/chords` should return new format
2. **Search chords**: GET `/api/presets/chords?q=C` should work
3. **Create chord**: POST `/api/admin/presets/chords` with new format
4. **Update chord**: PUT `/api/admin/presets/chords/:id` with new format
5. **Delete chord**: DELETE `/api/admin/presets/chords/:id` should work
6. **Frontend admin** should display and edit chords correctly

## Rollback

If you need to rollback:

1. Revert the database migration (restore backup)
2. Deploy previous Worker version
3. Restore frontend transformation functions
4. Redeploy frontend

## Future Improvements

- Add validation for chord data (e.g., string numbers 1-6, valid fret numbers)
- Add support for more complex chord notations
- Add chord diagram preview in API documentation
