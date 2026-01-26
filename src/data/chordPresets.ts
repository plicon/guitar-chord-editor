import { FingerPosition, Barre, FingerLabel } from "@/types/chord";

export interface ChordPreset {
  name: string;
  startFret: number;
  fingers: FingerPosition[];
  barres: Barre[];
  mutedStrings: number[];
  openStrings: number[];
  fingerLabels: FingerLabel[];
}

// Common guitar chord presets
export const chordPresets: Record<string, ChordPreset> = {
  // Major Chords
  "C": {
    name: "C",
    startFret: 1,
    fingers: [
      { string: 2, fret: 1 },
      { string: 4, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1, 3],
    fingerLabels: [
      { string: 2, finger: 1 },
      { string: 4, finger: 2 },
      { string: 5, finger: 3 },
    ],
  },
  "D": {
    name: "D",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
      { string: 1, fret: 2 },
      { string: 2, fret: 3 },
    ],
    barres: [],
    mutedStrings: [5, 6],
    openStrings: [4],
    fingerLabels: [
      { string: 3, finger: 1 },
      { string: 1, finger: 2 },
      { string: 2, finger: 3 },
    ],
  },
  "E": {
    name: "E",
    startFret: 1,
    fingers: [
      { string: 3, fret: 1 },
      { string: 5, fret: 2 },
      { string: 4, fret: 2 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [1, 2, 6],
    fingerLabels: [
      { string: 3, finger: 1 },
      { string: 5, finger: 2 },
      { string: 4, finger: 3 },
    ],
  },
  "F": {
    name: "F",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 2, finger: 1 },
      { string: 3, finger: 2 },
      { string: 4, finger: 3 },
      { string: 5, finger: 4 },
      { string: 6, finger: 1 },
    ],
  },
  "G": {
    name: "G",
    startFret: 1,
    fingers: [
      { string: 5, fret: 2 },
      { string: 6, fret: 3 },
      { string: 1, fret: 3 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [2, 3, 4],
    fingerLabels: [
      { string: 5, finger: 1 },
      { string: 6, finger: 2 },
      { string: 1, finger: 3 },
    ],
  },
  "A": {
    name: "A",
    startFret: 1,
    fingers: [
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1, 5],
    fingerLabels: [
      { string: 4, finger: 1 },
      { string: 3, finger: 2 },
      { string: 2, finger: 3 },
    ],
  },
  "B": {
    name: "B",
    startFret: 2,
    fingers: [
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 5, finger: 1 },
      { string: 4, finger: 2 },
      { string: 3, finger: 3 },
      { string: 2, finger: 4 },
    ],
  },

  // Minor Chords
  "Cm": {
    name: "Cm",
    startFret: 3,
    fingers: [
      { string: 4, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 5, finger: 1 },
      { string: 4, finger: 2 },
      { string: 2, finger: 3 },
    ],
  },
  "Dm": {
    name: "Dm",
    startFret: 1,
    fingers: [
      { string: 1, fret: 1 },
      { string: 3, fret: 2 },
      { string: 2, fret: 3 },
    ],
    barres: [],
    mutedStrings: [5, 6],
    openStrings: [4],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 3, finger: 2 },
      { string: 2, finger: 3 },
    ],
  },
  "Em": {
    name: "Em",
    startFret: 1,
    fingers: [
      { string: 5, fret: 2 },
      { string: 4, fret: 2 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [1, 2, 3, 6],
    fingerLabels: [
      { string: 5, finger: 2 },
      { string: 4, finger: 3 },
    ],
  },
  "Fm": {
    name: "Fm",
    startFret: 1,
    fingers: [
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 6, finger: 1 },
      { string: 5, finger: 3 },
      { string: 4, finger: 4 },
    ],
  },
  "Gm": {
    name: "Gm",
    startFret: 3,
    fingers: [
      { string: 5, fret: 2 },
      { string: 4, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 6, finger: 1 },
      { string: 5, finger: 3 },
      { string: 4, finger: 4 },
    ],
  },
  "Am": {
    name: "Am",
    startFret: 1,
    fingers: [
      { string: 2, fret: 1 },
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1, 5],
    fingerLabels: [
      { string: 2, finger: 1 },
      { string: 4, finger: 2 },
      { string: 3, finger: 3 },
    ],
  },
  "Bm": {
    name: "Bm",
    startFret: 2,
    fingers: [
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 5, finger: 1 },
      { string: 4, finger: 3 },
      { string: 3, finger: 3 },
      { string: 2, finger: 3 },
    ],
  },

  // 7th Chords
  "C7": {
    name: "C7",
    startFret: 1,
    fingers: [
      { string: 2, fret: 1 },
      { string: 4, fret: 2 },
      { string: 5, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1],
    fingerLabels: [
      { string: 2, finger: 1 },
      { string: 4, finger: 2 },
      { string: 5, finger: 3 },
      { string: 3, finger: 4 },
    ],
  },
  "D7": {
    name: "D7",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
      { string: 1, fret: 2 },
      { string: 2, fret: 1 },
    ],
    barres: [],
    mutedStrings: [5, 6],
    openStrings: [4],
    fingerLabels: [
      { string: 2, finger: 1 },
      { string: 3, finger: 2 },
      { string: 1, finger: 3 },
    ],
  },
  "E7": {
    name: "E7",
    startFret: 1,
    fingers: [
      { string: 3, fret: 1 },
      { string: 5, fret: 2 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [1, 2, 4, 6],
    fingerLabels: [
      { string: 3, finger: 1 },
      { string: 5, finger: 2 },
    ],
  },
  "G7": {
    name: "G7",
    startFret: 1,
    fingers: [
      { string: 5, fret: 2 },
      { string: 6, fret: 3 },
      { string: 1, fret: 1 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [2, 3, 4],
    fingerLabels: [
      { string: 1, finger: 1 },
      { string: 5, finger: 2 },
      { string: 6, finger: 3 },
    ],
  },
  "A7": {
    name: "A7",
    startFret: 1,
    fingers: [
      { string: 4, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1, 3, 5],
    fingerLabels: [
      { string: 4, finger: 1 },
      { string: 2, finger: 2 },
    ],
  },
  "B7": {
    name: "B7",
    startFret: 1,
    fingers: [
      { string: 4, fret: 1 },
      { string: 5, fret: 2 },
      { string: 3, fret: 2 },
      { string: 1, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [2],
    fingerLabels: [
      { string: 4, finger: 1 },
      { string: 5, finger: 2 },
      { string: 3, finger: 3 },
      { string: 1, finger: 4 },
    ],
  },

  // Sharp/Flat variations
  "C#": {
    name: "C#",
    startFret: 4,
    fingers: [
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  "Db": {
    name: "Db",
    startFret: 4,
    fingers: [
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  "F#": {
    name: "F#",
    startFret: 2,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  "Gb": {
    name: "Gb",
    startFret: 2,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  "C#m": {
    name: "C#m",
    startFret: 4,
    fingers: [
      { string: 4, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  "F#m": {
    name: "F#m",
    startFret: 2,
    fingers: [
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  "Bbm": {
    name: "Bbm",
    startFret: 1,
    fingers: [
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  "Bb": {
    name: "Bb",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  "Eb": {
    name: "Eb",
    startFret: 3,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },
  "Ab": {
    name: "Ab",
    startFret: 4,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [],
    fingerLabels: [],
  },

  // Additional 7th chords for sharps/flats
  "F#7": {
    name: "F#7",
    startFret: 2,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [4],
    fingerLabels: [],
  },
  "Gb7": {
    name: "Gb7",
    startFret: 2,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [4],
    fingerLabels: [],
  },
  "G#7": {
    name: "G#7",
    startFret: 4,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [4],
    fingerLabels: [],
  },
  "Ab7": {
    name: "Ab7",
    startFret: 4,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [4],
    fingerLabels: [],
  },
  "Bb7": {
    name: "Bb7",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [4],
    fingerLabels: [],
  },
  "C#7": {
    name: "C#7",
    startFret: 4,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [4],
    fingerLabels: [],
  },
  "Db7": {
    name: "Db7",
    startFret: 4,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [4],
    fingerLabels: [],
  },
  "Eb7": {
    name: "Eb7",
    startFret: 1,
    fingers: [
      { string: 4, fret: 1 },
      { string: 5, fret: 2 },
      { string: 3, fret: 2 },
      { string: 1, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [2],
    fingerLabels: [],
  },
  "F7": {
    name: "F7",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 6, toString: 1 }],
    mutedStrings: [],
    openStrings: [4],
    fingerLabels: [],
  },

  // 6th Chords
  "C6": {
    name: "C6",
    startFret: 1,
    fingers: [
      { string: 2, fret: 1 },
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 5, fret: 3 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1],
    fingerLabels: [],
  },
  "D6": {
    name: "D6",
    startFret: 1,
    fingers: [
      { string: 1, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [],
    mutedStrings: [5, 6],
    openStrings: [4],
    fingerLabels: [],
  },
  "E6": {
    name: "E6",
    startFret: 1,
    fingers: [
      { string: 3, fret: 1 },
      { string: 5, fret: 2 },
      { string: 4, fret: 2 },
      { string: 2, fret: 2 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [1, 6],
    fingerLabels: [],
  },
  "G6": {
    name: "G6",
    startFret: 1,
    fingers: [
      { string: 5, fret: 2 },
      { string: 6, fret: 3 },
    ],
    barres: [],
    mutedStrings: [],
    openStrings: [1, 2, 3, 4],
    fingerLabels: [],
  },
  "A6": {
    name: "A6",
    startFret: 1,
    fingers: [
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
      { string: 1, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [5],
    fingerLabels: [],
  },
  "Eb6": {
    name: "Eb6",
    startFret: 1,
    fingers: [
      { string: 4, fret: 1 },
      { string: 5, fret: 1 },
      { string: 3, fret: 1 },
      { string: 2, fret: 1 },
      { string: 1, fret: 1 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  "F6": {
    name: "F6",
    startFret: 1,
    fingers: [
      { string: 4, fret: 2 },
      { string: 5, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 2, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },
  "Bb6": {
    name: "Bb6",
    startFret: 1,
    fingers: [
      { string: 4, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [{ fret: 1, fromString: 5, toString: 1 }],
    mutedStrings: [6],
    openStrings: [],
    fingerLabels: [],
  },

  // Power Chords (5th chords)
  "E5": {
    name: "E5",
    startFret: 1,
    fingers: [
      { string: 5, fret: 2 },
    ],
    barres: [],
    mutedStrings: [1, 2, 3],
    openStrings: [4, 6],
    fingerLabels: [],
  },
  "A5": {
    name: "A5",
    startFret: 1,
    fingers: [
      { string: 4, fret: 2 },
    ],
    barres: [],
    mutedStrings: [1, 2, 3, 6],
    openStrings: [5],
    fingerLabels: [],
  },
  "D5": {
    name: "D5",
    startFret: 1,
    fingers: [
      { string: 3, fret: 2 },
    ],
    barres: [],
    mutedStrings: [1, 2, 5, 6],
    openStrings: [4],
    fingerLabels: [],
  },
  "G5": {
    name: "G5",
    startFret: 1,
    fingers: [
      { string: 6, fret: 3 },
      { string: 5, fret: 5 },
      { string: 4, fret: 5 },
    ],
    barres: [],
    mutedStrings: [1, 2, 3],
    openStrings: [],
    fingerLabels: [],
  },
  "C5": {
    name: "C5",
    startFret: 3,
    fingers: [
      { string: 5, fret: 1 },
      { string: 4, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 6],
    openStrings: [],
    fingerLabels: [],
  },
  "F5": {
    name: "F5",
    startFret: 1,
    fingers: [
      { string: 6, fret: 1 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 3],
    openStrings: [],
    fingerLabels: [],
  },
  "Eb5": {
    name: "Eb5",
    startFret: 1,
    fingers: [
      { string: 5, fret: 1 },
      { string: 4, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 6],
    openStrings: [],
    fingerLabels: [],
  },
  "Bb5": {
    name: "Bb5",
    startFret: 1,
    fingers: [
      { string: 5, fret: 1 },
      { string: 4, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 6],
    openStrings: [],
    fingerLabels: [],
  },
  "F#5": {
    name: "F#5",
    startFret: 2,
    fingers: [
      { string: 6, fret: 1 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 3],
    openStrings: [],
    fingerLabels: [],
  },
  "Ab5": {
    name: "Ab5",
    startFret: 4,
    fingers: [
      { string: 6, fret: 1 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 3],
    openStrings: [],
    fingerLabels: [],
  },
  "B5": {
    name: "B5",
    startFret: 2,
    fingers: [
      { string: 5, fret: 1 },
      { string: 4, fret: 3 },
      { string: 3, fret: 3 },
    ],
    barres: [],
    mutedStrings: [1, 2, 6],
    openStrings: [],
    fingerLabels: [],
  },
};

// Normalize chord name to ASCII for preset lookup
const normalizeChordName = (name: string): string => {
  return name
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/ minor/g, 'm')
    .replace(/\s+/g, '');
};

// Get preset for a chord name (handles Unicode symbols and full names)
export const getChordPreset = (name: string): ChordPreset | null => {
  const normalized = normalizeChordName(name);
  return chordPresets[normalized] || null;
};
