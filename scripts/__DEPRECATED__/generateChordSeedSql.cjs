/**
 * Generate SQL INSERT statements for common chord presets
 * This script uses require() to avoid TypeScript import issues
 */

const fs = require('fs');
const path = require('path');

// Read the chord presets data
const chordPresetsPath = path.join(__dirname, '../src/data/chordPresets.ts');
const content = fs.readFileSync(chordPresetsPath, 'utf-8');

// List of common chords to seed (about 100 chords)
const COMMON_CHORD_NAMES = [
  // Open position major chords
  'A', 'C', 'D', 'E', 'G',
  // Open position minor chords
  'Am', 'Dm', 'Em',
  // Open position 7th chords
  'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
  // Common barre chords (F shape)
  'F', 'Fm', 'F#', 'F#m', 'G#', 'G#m', 'A#', 'A#m', 'Bb', 'Bbm',
  // Common barre chords (E shape)
  'B', 'Bm', 'C#', 'C#m', 'D#', 'D#m', 'Eb', 'Ebm',
  // Extended chords
  'Amaj7', 'Cmaj7', 'Dmaj7', 'Emaj7', 'Gmaj7',
  'Am7', 'Dm7', 'Em7',
  // Suspended chords
  'Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Esus4', 'Gsus4',
  // Diminished and augmented
  'Adim', 'Bdim', 'Cdim', 'Ddim', 'Edim',
  'Aaug', 'Caug', 'Daug', 'Eaug', 'Gaug',
  // Power chords
  'A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5',
  // Add9 chords
  'Aadd9', 'Cadd9', 'Dadd9', 'Eadd9', 'Gadd9',
  // Sixth chords
  'A6', 'C6', 'D6', 'E6', 'G6',
  'Am6', 'Dm6', 'Em6',
  // 9th chords
  'A9', 'C9', 'D9', 'E9', 'G9',
  'Am9', 'Dm9', 'Em9',
  // 11th and 13th
  'A11', 'C11', 'D11', 'E11',
  'A13', 'C13', 'D13', 'E13',
  // More variations
  'C#7', 'F#7', 'G#7', 'Bb7', 'Eb7',
  'Fmaj7', 'Bbmaj7', 'Ebmaj7',
  'Fm7', 'Bbm7', 'Ebm7',
];

// Parse the TypeScript file to extract chord data (simple regex approach)
// This is a simplified parser - assumes the format is consistent
function parseChordPresets(content) {
  const chords = [];
  
  // Match chord objects in the format:
  // { name: "...", startFret: ..., fingers: [...], ... }
  const chordRegex = /{\s*name:\s*["']([^"']+)["'],\s*startFret:\s*(\d+),\s*fingers:\s*\[([^\]]+)\],(?:\s*barres:\s*\[([^\]]*)\],)?(?:\s*mutedStrings:\s*\[([^\]]*)\],)?(?:\s*openStrings:\s*\[([^\]]*)\],)?(?:\s*fingerLabels:\s*\[([^\]]*)\],)?/g;
  
  let match;
  while ((match = chordRegex.exec(content)) !== null) {
    const [_, name, startFret, fingersStr, barresStr, mutedStr, openStr, labelsStr] = match;
    
    const chord = {
      name: name.trim(),
      startFret: parseInt(startFret),
      fingers: fingersStr.split(',').map(f => {
        const trimmed = f.trim();
        return trimmed === 'null' ? null : parseInt(trimmed);
      }),
    };
    
    // Parse optional arrays
    if (barresStr) {
      const barres = barresStr.trim();
      if (barres) {
        chord.barres = JSON.parse(`[${barres}]`);
      }
    }
    
    if (mutedStr) {
      const muted = mutedStr.trim();
      if (muted) {
        chord.mutedStrings = JSON.parse(`[${muted}]`);
      }
    }
    
    if (openStr) {
      const open = openStr.trim();
      if (open) {
        chord.openStrings = JSON.parse(`[${open}]`);
      }
    }
    
    if (labelsStr) {
      const labels = labelsStr.trim();
      if (labels) {
        // Parse array of strings or nulls
        chord.fingerLabels = JSON.parse(`[${labels}]`);
      }
    }
    
    chords.push(chord);
  }
  
  return chords;
}

// Convert app format to API format
function convertChordToApiFormat(chord) {
  const apiChord = {
    id: chord.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: chord.name,
    frets: chord.fingers || [],
    fingers: chord.fingers || [],
  };
  
  // Convert barres if present
  if (chord.barres && chord.barres.length > 0) {
    apiChord.barreInfo = chord.barres.map(barre => ({
      fret: barre.fret,
      fromString: barre.fromString,
      toString: barre.toString,
    }));
  }
  
  return apiChord;
}

// Generate SQL INSERT statements
function generateSql(chords, commonNames) {
  const commonChords = chords.filter(c => commonNames.includes(c.name));
  
  const sqlStatements = [
    '-- Seed common chord presets',
    '-- This migration adds approximately 100 common chords',
    '',
  ];
  
  for (const chord of commonChords) {
    const apiChord = convertChordToApiFormat(chord);
    const fretsJson = JSON.stringify(apiChord.frets);
    const fingersJson = JSON.stringify(apiChord.fingers);
    const barreInfoJson = apiChord.barreInfo ? JSON.stringify(apiChord.barreInfo) : 'NULL';
    
    const barreInfoSql = apiChord.barreInfo ? `'${barreInfoJson}'` : 'NULL';
    
    sqlStatements.push(
      `INSERT INTO chord_presets (id, name, frets, fingers, barre_info) VALUES ('${apiChord.id}', '${apiChord.name}', '${fretsJson}', '${fingersJson}', ${barreInfoSql});`
    );
  }
  
  sqlStatements.push('');
  sqlStatements.push(`-- Inserted ${commonChords.length} common chords`);
  
  return sqlStatements.join('\n');
}

// Main execution
try {
  console.log('Parsing chord presets...');
  const chords = parseChordPresets(content);
  console.log(`Found ${chords.length} total chords`);
  
  console.log('Generating SQL for common chords...');
  const sql = generateSql(chords, COMMON_CHORD_NAMES);
  
  const outputPath = path.join(__dirname, '../worker/migrations/0003_seed_chord_presets.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`✓ Generated ${outputPath}`);
  console.log(`✓ SQL migration ready for common chord presets`);
} catch (error) {
  console.error('Error generating SQL:', error);
  process.exit(1);
}
