#!/usr/bin/env tsx
/**
 * Seed script to populate chord presets via the API
 * 
 * Usage:
 *   npx tsx scripts/seedChords.ts
 * 
 * This script creates common chord presets through the admin API endpoint.
 * It uses the Cloudflare Access headers for authentication.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

interface FingerPosition {
  string: number;
  fret: number;
  finger?: number;
}

interface Barre {
  fret: number;
  fromString: number;
  toString: number;
  finger?: number;
}

interface ChordPreset {
  name: string;
  frets: number;
  startFret?: number;
  fingers: FingerPosition[];
  barres?: Barre[];
  mutedStrings?: number[];
  openStrings?: number[];
  fingerLabels?: { string: number; finger: number }[];
}

// Helper function to auto-generate fingerLabels from fingers
function addFingerLabels(preset: ChordPreset): ChordPreset {
  const fingerLabels = preset.fingers
    .filter(f => f.finger !== undefined)
    .map(f => ({ string: f.string, finger: f.finger! }));
  
  return {
    ...preset,
    fingerLabels: fingerLabels.length > 0 ? fingerLabels : preset.fingerLabels || [],
  };
}

// Sample chord presets to seed
const chordPresets: ChordPreset[] = [
  // ========== MAJOR CHORDS ==========
  {
    name: "C",
    frets: 5,
    fingers: [
      { string: 2, fret: 1, finger: 1 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 3, finger: 3 },
    ],
    mutedStrings: [6],
    openStrings: [1, 3],
    barres: [],
    fingerLabels: [
      { string: 2, finger: 1 },
      { string: 4, finger: 2 },
      { string: 5, finger: 3 },
    ],
  },
  {
    name: "G",
    frets: 5,
    fingers: [
      { string: 1, fret: 3, finger: 3 },
      { string: 5, fret: 2, finger: 1 },
      { string: 6, fret: 3, finger: 2 },
    ],
    openStrings: [2, 3, 4],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "D",
    frets: 5,
    fingers: [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
    ],
    mutedStrings: [5, 6],
    openStrings: [4],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "A",
    frets: 5,
    fingers: [
      { string: 2, fret: 2, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
    ],
    mutedStrings: [6],
    openStrings: [1, 5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "E",
    frets: 5,
    fingers: [
      { string: 3, fret: 1, finger: 1 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 2, finger: 3 },
    ],
    openStrings: [1, 2, 6],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  
  // ========== MINOR CHORDS ==========
  {
    name: "Am",
    frets: 5,
    fingers: [
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 2, finger: 2 },
    ],
    mutedStrings: [6],
    openStrings: [1, 5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Em",
    frets: 5,
    fingers: [
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 2, finger: 3 },
    ],
    openStrings: [1, 2, 3, 6],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Dm",
    frets: 5,
    fingers: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
    ],
    mutedStrings: [5, 6],
    openStrings: [4],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Cm",
    frets: 5,
    fingers: [
      { string: 2, fret: 4, finger: 2 },
      { string: 3, fret: 5, finger: 3 },
      { string: 4, fret: 5, finger: 4 },
    ],
    barres: [{ fret: 3, fromString: 1, toString: 5, finger: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  {
    name: "Bm",
    frets: 5,
    fingers: [
      { string: 2, fret: 3, finger: 2 },
      { string: 3, fret: 4, finger: 3 },
      { string: 4, fret: 4, finger: 4 },
    ],
    barres: [{ fret: 2, fromString: 1, toString: 5, finger: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  {
    name: "Gm",
    frets: 5,
    fingers: [
      { string: 2, fret: 4, finger: 2 },
      { string: 3, fret: 3, finger: 1 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 4 },
    ],
    mutedStrings: [1, 6],
    openStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Fm",
    frets: 5,
    fingers: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 4 },
    ],
    barres: [{ fret: 1, fromString: 1, toString: 2, finger: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  
  // ========== DOMINANT 7TH CHORDS ==========
  {
    name: "E7",
    frets: 5,
    fingers: [
      { string: 3, fret: 1, finger: 1 },
      { string: 5, fret: 2, finger: 2 },
    ],
    openStrings: [1, 2, 4, 6],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "A7",
    frets: 5,
    fingers: [
      { string: 2, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 1 },
    ],
    mutedStrings: [6],
    openStrings: [1, 3, 5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "D7",
    frets: 5,
    fingers: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 3 },
    ],
    mutedStrings: [5, 6],
    openStrings: [4],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "G7",
    frets: 5,
    fingers: [
      { string: 1, fret: 1, finger: 1 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 3, finger: 3 },
    ],
    openStrings: [2, 3, 4],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "C7",
    frets: 5,
    fingers: [
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 3, finger: 3 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 3, finger: 4 },
    ],
    mutedStrings: [6],
    openStrings: [1],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "B7",
    frets: 5,
    fingers: [
      { string: 1, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 1, finger: 3 },
      { string: 5, fret: 2, finger: 4 },
    ],
    mutedStrings: [6],
    openStrings: [2],
    barres: [],
    fingerLabels: [],
  },
  
  // ========== BARRE CHORDS ==========
  {
    name: "F",
    frets: 5,
    fingers: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 4 },
    ],
    barres: [{ fret: 1, fromString: 1, toString: 6, finger: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  {
    name: "B",
    frets: 5,
    fingers: [
      { string: 3, fret: 3, finger: 2 },
      { string: 4, fret: 4, finger: 3 },
      { string: 5, fret: 4, finger: 4 },
    ],
    barres: [{ fret: 2, fromString: 1, toString: 6, finger: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  {
    name: "F#",
    frets: 5,
    fingers: [
      { string: 3, fret: 3, finger: 2 },
      { string: 4, fret: 4, finger: 3 },
      { string: 5, fret: 4, finger: 4 },
    ],
    barres: [{ fret: 2, fromString: 1, toString: 6, finger: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  {
    name: "Bb",
    frets: 5,
    fingers: [
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 4 },
    ],
    barres: [{ fret: 1, fromString: 1, toString: 6, finger: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  
  // ========== POWER CHORDS ==========
  {
    name: "E5",
    frets: 5,
    fingers: [
      { string: 5, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
    ],
    mutedStrings: [1, 2, 3],
    openStrings: [6],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "A5",
    frets: 5,
    fingers: [
      { string: 4, fret: 2, finger: 2 },
      { string: 3, fret: 2, finger: 3 },
    ],
    mutedStrings: [1, 2, 6],
    openStrings: [5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "D5",
    frets: 5,
    fingers: [
      { string: 3, fret: 2, finger: 2 },
      { string: 2, fret: 3, finger: 3 },
    ],
    mutedStrings: [1, 5, 6],
    openStrings: [4],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "G5",
    frets: 5,
    fingers: [
      { string: 5, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
    ],
    mutedStrings: [1, 2],
    openStrings: [6, 3],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "C5",
    frets: 5,
    fingers: [
      { string: 5, fret: 3, finger: 2 },
      { string: 4, fret: 3, finger: 3 },
    ],
    mutedStrings: [1, 2, 6],
    openStrings: [],
    barres: [],
    fingerLabels: [],
  },
  
  // ========== SUS CHORDS ==========
  {
    name: "Asus2",
    frets: 5,
    fingers: [
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 2, finger: 2 },
    ],
    mutedStrings: [6],
    openStrings: [1, 2, 5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Asus4",
    frets: 5,
    fingers: [
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 2, finger: 2 },
    ],
    mutedStrings: [6],
    openStrings: [1, 5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Dsus2",
    frets: 5,
    fingers: [
      { string: 1, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 1 },
    ],
    mutedStrings: [5, 6],
    openStrings: [2, 4],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Dsus4",
    frets: 5,
    fingers: [
      { string: 1, fret: 3, finger: 3 },
      { string: 2, fret: 3, finger: 2 },
      { string: 3, fret: 2, finger: 1 },
    ],
    mutedStrings: [5, 6],
    openStrings: [4],
    barres: [],
    fingerLabels: [],
  },
  
  // ========== ADDITIONAL COMMON CHORDS ==========
  {
    name: "Cadd9",
    frets: 5,
    fingers: [
      { string: 2, fret: 3, finger: 3 },
      { string: 4, fret: 2, finger: 1 },
      { string: 5, fret: 3, finger: 2 },
    ],
    mutedStrings: [6],
    openStrings: [1, 3],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "G/B",
    frets: 5,
    fingers: [
      { string: 1, fret: 3, finger: 3 },
      { string: 5, fret: 2, finger: 1 },
    ],
    openStrings: [2, 3, 4, 6],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Am7",
    frets: 5,
    fingers: [
      { string: 2, fret: 1, finger: 1 },
      { string: 4, fret: 2, finger: 2 },
    ],
    mutedStrings: [6],
    openStrings: [1, 3, 5],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Em7",
    frets: 5,
    fingers: [
      { string: 5, fret: 2, finger: 1 },
    ],
    openStrings: [1, 2, 3, 4, 6],
    mutedStrings: [],
    barres: [],
    fingerLabels: [],
  },
  {
    name: "Cmaj7",
    frets: 5,
    fingers: [
      { string: 4, fret: 2, finger: 1 },
      { string: 5, fret: 3, finger: 2 },
    ],
    mutedStrings: [6],
    openStrings: [1, 2, 3],
    barres: [],
    fingerLabels: [],
  },
];

async function seedChords() {
  const API_BASE = (process.env.VITE_ADMIN_API_URL || "https://dev.api.fretkit.io/api/admin").replace(/\/$/, '');
  const CF_ACCESS_CLIENT_ID = process.env.VITE_CF_ACCESS_CLIENT_ID;
  const CF_ACCESS_CLIENT_SECRET = process.env.VITE_CF_ACCESS_CLIENT_SECRET;

  if (!CF_ACCESS_CLIENT_ID || !CF_ACCESS_CLIENT_SECRET) {
    console.error("❌ Missing Cloudflare Access credentials");
    console.error("   Set VITE_CF_ACCESS_CLIENT_ID and VITE_CF_ACCESS_CLIENT_SECRET environment variables");
    process.exit(1);
  }

  console.log(`🎸 Seeding chord presets to ${API_BASE}/presets/chords\n`);

  let created = 0;
  let failed = 0;

  for (const preset of chordPresets) {
    try {
      // Auto-generate fingerLabels from fingers
      const presetWithLabels = addFingerLabels(preset);
      
      const response = await fetch(`${API_BASE}/presets/chords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Access-Client-Id": CF_ACCESS_CLIENT_ID,
          "CF-Access-Client-Secret": CF_ACCESS_CLIENT_SECRET,
        },
        credentials: "include",
        body: JSON.stringify(presetWithLabels),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Created: ${preset.name} (${result.id})`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create ${preset.name}:`, error instanceof Error ? error.message : error);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`   Total:   ${chordPresets.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

seedChords().catch((error) => {
  console.error("❌ Seed script failed:", error);
  process.exit(1);
});
