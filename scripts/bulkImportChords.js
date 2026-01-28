#!/usr/bin/env node
/**
 * Bulk import all chords to Cloudflare D1 database
 * Usage: node scripts/bulkImportChords.js
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const BATCH_SIZE = 100; // Insert 100 chords at a time

async function bulkImport() {
  console.log('🚀 Starting bulk chord import...\n');
  
  // Read the JSON file
  const jsonPath = join(process.cwd(), 'worker', 'data', 'all-chords.json');
  const chords = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  console.log(`📊 Found ${chords.length} chords to import\n`);
  
  const now = Date.now();
  let imported = 0;
  
  // Process in batches
  for (let i = 0; i < chords.length; i += BATCH_SIZE) {
    const batch = chords.slice(i, i + BATCH_SIZE);
    
    // Generate SQL INSERT statement
    const values = batch.map(chord => {
      const frets = JSON.stringify(chord.frets).replace(/'/g, "''");
      const fingers = chord.fingers ? JSON.stringify(chord.fingers).replace(/'/g, "''") : null;
      const barreInfo = chord.barreInfo ? JSON.stringify(chord.barreInfo).replace(/'/g, "''") : null;
      
      return `('${chord.id}', '${chord.name.replace(/'/g, "''")}', '${frets}', ${fingers ? `'${fingers}'` : 'NULL'}, ${barreInfo ? `'${barreInfo}'` : 'NULL'}, ${now})`;
    }).join(',\n  ');
    
    const sql = `INSERT OR IGNORE INTO chord_presets (id, name, frets, fingers, barre_info, created_at) VALUES\n  ${values};`;
    
    try {
      // Execute via wrangler
      execSync(
        `cd worker && npx wrangler d1 execute fretkit-db --remote --command "${sql.replace(/"/g, '\\"')}"`,
        { stdio: 'inherit' }
      );
      
      imported += batch.length;
      console.log(`✅ Imported batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chords.length / BATCH_SIZE)} (${imported}/${chords.length} chords)`);
    } catch (error) {
      console.error(`❌ Failed to import batch starting at index ${i}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log(`\n🎉 Successfully imported ${imported} chords!\n`);
  
  // Verify
  try {
    console.log('🔍 Verifying import...');
    execSync(
      'cd worker && npx wrangler d1 execute fretkit-db --remote --command "SELECT COUNT(*) as count FROM chord_presets"',
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

bulkImport().catch(console.error);
