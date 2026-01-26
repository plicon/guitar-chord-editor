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
};

// Get preset for a chord name
export const getChordPreset = (name: string): ChordPreset | null => {
  return chordPresets[name] || null;
};
