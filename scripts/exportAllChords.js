#!/usr/bin/env node
/**
 * Export all chord presets to JSON for bulk import
 * Usage: node scripts/exportAllChords.js > worker/data/all-chords.json
 */

import { chordPresets } from '../src/data/chordPresets.ts';

function convertChordToApiFormat(name, preset) {
  const frets = new Array(6).fill(null);
  
  preset.openStrings?.forEach(stringNum => {
    frets[6 - stringNum] = 0;
  });
  
  preset.mutedStrings?.forEach(stringNum => {
    frets[6 - stringNum] = 'x';
  });
  
  preset.fingers?.forEach(finger => {
    frets[6 - finger.string] = finger.fret;
  });
  
  const fingers = new Array(6).fill(null);
  preset.fingerLabels?.forEach(label => {
    fingers[6 - label.string] = label.finger;
  });
  
  const barreInfo = preset.barres && preset.barres.length > 0
    ? {
        fret: preset.barres[0].fret,
        fromString: preset.barres[0].fromString,
        toString: preset.barres[0].toString,
        finger: 1,
      }
    : null;
  
  return {
    id: `chord_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name,
    frets,
    fingers: fingers.some(f => f !== null) ? fingers : null,
    barreInfo,
  };
}

const allChords = Object.entries(chordPresets).map(([name, preset]) =>
  convertChordToApiFormat(name, preset)
);

console.log(JSON.stringify(allChords, null, 2));

console.error(`\n✅ Exported ${allChords.length} chords to JSON`);
console.error('   Use this file with the bulk import script to populate the database.');
