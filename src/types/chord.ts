export interface ChordDiagram {
  id: string;
  name: string;
  frets: number; // Number of frets to display (typically 4-5)
  startFret: number; // Starting fret number (1 for open position)
  fingers: FingerPosition[];
  barres: Barre[];
  mutedStrings: number[]; // String indices that are muted (X)
  openStrings: number[]; // String indices that are open (O)
}

export interface FingerPosition {
  string: number; // 1-6 (1 = high E, 6 = low E)
  fret: number; // 1-5 (relative to startFret)
  finger?: number; // 1-4 for finger number
}

export interface Barre {
  fret: number;
  fromString: number;
  toString: number;
  finger?: number;
}

export const createEmptyChord = (id: string): ChordDiagram => ({
  id,
  name: "",
  frets: 4,
  startFret: 1,
  fingers: [],
  barres: [],
  mutedStrings: [],
  openStrings: [],
});

export const isChordEdited = (chord: ChordDiagram): boolean => {
  return (
    chord.name !== "" ||
    chord.fingers.length > 0 ||
    chord.barres.length > 0 ||
    chord.mutedStrings.length > 0 ||
    chord.openStrings.length > 0
  );
};
