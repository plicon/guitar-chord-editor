import { ChordDiagram } from "./chord";
import { StrummingPattern } from "./strumming";

/**
 * Section types for organizing song parts
 */
export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro' | 'custom';

/**
 * Label for section types
 */
export const SectionTypeLabels: Record<SectionType, string> = {
  intro: 'Intro',
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  solo: 'Solo',
  outro: 'Outro',
  custom: 'Custom',
};

/**
 * Different types of rows that can appear in a section
 * Currently only supporting chord rows, but designed to be extended
 * with tab-row and lyric-chord-row in future phases
 */
export type SectionRow =
  | { kind: 'chord-row'; id: string; chords: ChordDiagram[]; subtitle?: string };
  // Future: | { kind: 'tab-row'; id: string; measures: TabMeasure[] }
  // Future: | { kind: 'lyric-chord-row'; id: string; segments: LyricChordSegment[] }

/**
 * A section within a song (e.g., Verse 1, Chorus, Bridge)
 */
export interface SongSection {
  id: string;
  name: string;
  type: SectionType;
  rows: SectionRow[];
  collapsed?: boolean; // UI state for collapsible sections
}

/**
 * New primary song type with section-based structure
 */
export interface Song {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  sections: SongSection[];
  strummingPattern?: StrummingPattern | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new empty song
 */
export const createSong = (title: string = "Untitled Song"): Song => {
  const now = new Date().toISOString();
  return {
    id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    title,
    sections: [],
    strummingPattern: null,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Create a new empty section
 */
export const createSection = (
  type: SectionType = 'verse',
  name?: string
): SongSection => {
  const defaultName = name || SectionTypeLabels[type];
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    name: defaultName,
    type,
    rows: [],
    collapsed: false,
  };
};

/**
 * Create a chord row for a section
 */
export const createChordRow = (chords: ChordDiagram[], subtitle?: string): SectionRow => {
  return {
    kind: 'chord-row',
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    chords,
    subtitle,
  };
};
