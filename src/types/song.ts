import { ChordDiagram } from "./chord";
import { StrummingPattern } from "./strumming";
import { TabMeasure, createEmptyTabMeasure } from "./tab";

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
 */
export type SectionRow =
  | { kind: 'chord-row'; id: string; chords: ChordDiagram[]; subtitle?: string }
  | { kind: 'tab-row'; id: string; measures: TabMeasure[]; subtitle?: string };
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

/**
 * Create a tab row for a section
 */
export const createTabRow = (measures?: TabMeasure[], subtitle?: string): SectionRow => {
  return {
    kind: 'tab-row',
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    measures: measures || [createEmptyTabMeasure()],
    subtitle,
  };
};
