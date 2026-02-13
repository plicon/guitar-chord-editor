/**
 * Tab (Tablature) types for guitar single-note notation
 */

/**
 * Guitar technique notations
 */
export type TabTechnique = 
  | 'h'  // hammer-on
  | 'p'  // pull-off
  | '/'  // slide up
  | '\\' // slide down
  | 'b'  // bend
  | 'r'  // release
  | '~'; // vibrato

/**
 * A single note on the tablature
 */
export interface TabNote {
  fret: number | null; // 0-24 or null for no note
  technique?: TabTechnique;
}

/**
 * A vertical column in the tab (one time position)
 * Contains 6 notes, one for each string from high E to low E
 */
export interface TabColumn {
  strings: [TabNote, TabNote, TabNote, TabNote, TabNote, TabNote]; // e B G D A E (high to low)
}

/**
 * A measure containing multiple columns (time positions)
 */
export interface TabMeasure {
  id: string;
  columns: TabColumn[];
  timeSignature?: string; // e.g., "4/4"
}

/**
 * Create an empty tab note
 */
export const createEmptyTabNote = (): TabNote => ({
  fret: null,
});

/**
 * Create an empty tab column with all strings empty
 */
export const createEmptyTabColumn = (): TabColumn => ({
  strings: [
    createEmptyTabNote(),
    createEmptyTabNote(),
    createEmptyTabNote(),
    createEmptyTabNote(),
    createEmptyTabNote(),
    createEmptyTabNote(),
  ],
});

/**
 * Create an empty tab measure with a specified number of columns
 */
export const createEmptyTabMeasure = (columns: number = 12): TabMeasure => ({
  id: `tab-measure-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  columns: Array.from({ length: columns }, () => createEmptyTabColumn()),
  timeSignature: "4/4",
  
});

/**
 * String names from high to low (as displayed in tab notation)
 */
export const TAB_STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const;

/**
 * Validate fret number is in valid range
 */
export const isValidFret = (fret: number | null): boolean => {
  if (fret === null) return true;
  return fret >= 0 && fret <= 24;
};
