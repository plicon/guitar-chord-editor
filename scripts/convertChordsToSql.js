#!/usr/bin/env node
/**
 * Convert TypeScript chord presets to SQL INSERT statements
 * Usage: node scripts/convertChordsToSql.js > worker/migrations/0003_seed_chord_presets.sql
 */

import { chordPresets } from '../src/data/chordPresets.ts';

// Common chords to seed in the initial migration (most frequently used)
const COMMON_CHORD_NAMES = [
  // Major chords
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  // Minor chords
  'Am', 'Dm', 'Em', 'Fm', 'Gm', 'Bm',
  // Dominant 7ths
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  // Major 7ths
  'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
  // Minor 7ths
  'Am7', 'Dm7', 'Em7', 'Gm7', 'Bm7',
  // Sus chords
  'Dsus4', 'Esus4', 'Asus4', 'Gsus4',
  // Power chords
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5',
  // Diminished
  'Cdim', 'Ddim', 'Edim', 'Bdim',
  // Augmented
  'Caug', 'Daug', 'Eaug', 'Gaug',
];

function convertChordToApiFormat(name, preset) {
  // Convert app format to API format
  // App: { name, startFret, fingers, barres, mutedStrings, openStrings, fingerLabels }
  // API: { id, name, frets, fingers, barreInfo }
  
  // Create frets array [6th string to 1st string]
  const frets = new Array(6).fill(null);
  
  // Mark open strings
  preset.openStrings?.forEach(stringNum => {
    frets[6 - stringNum] = 0;
  });
  
  // Mark muted strings
  preset.mutedStrings?.forEach(stringNum => {
    frets[6 - stringNum] = 'x';
  });
  
  // Add finger positions
  preset.fingers?.forEach(finger => {
    frets[6 - finger.string] = finger.fret;
  });
  
  // Create fingers array
  const fingers = new Array(6).fill(null);
  preset.fingerLabels?.forEach(label => {
    fingers[6 - label.string] = label.finger;
  });
  
  // Get barre info (first barre only)
  const barreInfo = preset.barres && preset.barres.length > 0
    ? {
        fret: preset.barres[0].fret,
        fromString: preset.barres[0].fromString,
        toString: preset.barres[0].toString,
        finger: 1, // Typically first finger for barres
      }
    : null;
  
  return {
    id: `chord_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name,
    frets: JSON.stringify(frets),
    fingers: fingers.some(f => f !== null) ? JSON.stringify(fingers) : null,
    barreInfo: barreInfo ? JSON.stringify(barreInfo) : null,
  };
}

function generateSqlInsert(chord) {
  const now = Date.now();
  return `('${chord.id}', '${chord.name.replace(/'/g, "''")}', '${chord.frets}', ${chord.fingers ? `'${chord.fingers}'` : 'NULL'}, ${chord.barreInfo ? `'${chord.barreInfo}'` : 'NULL'}, ${now})`;
}

// Generate SQL
console.log(`-- Migration: 0003_seed_chord_presets.sql
-- Description: Seed common chord presets
-- Created: ${new Date().toISOString().split('T')[0]}

-- Common chord presets (most frequently used)
INSERT INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES`);

const commonChords = Object.entries(chordPresets)
  .filter(([name]) => COMMON_CHORD_NAMES.includes(name))
  .map(([name, preset]) => convertChordToApiFormat(name, preset));

const inserts = commonChords.map(generateSqlInsert);
console.log(inserts.join(',\n') + ';');

console.log(`\n-- Total: ${commonChords.length} common chords seeded`);

// Export all chords to a separate file for bulk import
console.error(`\nℹ️  Generated ${commonChords.length} common chords for initial seed.`);
console.error(`   Total chords available: ${Object.keys(chordPresets).length}`);
console.error(`   Run 'node scripts/exportAllChords.js' to generate full dataset.`);
