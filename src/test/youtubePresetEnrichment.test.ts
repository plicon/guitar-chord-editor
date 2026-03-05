/**
 * Tests for loadFromYouTubeResult preset enrichment in useSongState
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongState } from '@/hooks/useSongState';
import type { YouTubeGenerateResult } from '@/services/youtubeImport';
import type { ChordPreset } from '@/types/chord';

const mockPresets: Record<string, ChordPreset> = {
  Am: {
    name: 'Am',
    frets: 5,
    startFret: 1,
    fingers: [
      { string: 2, fret: 1 },
      { string: 3, fret: 2 },
      { string: 4, fret: 2 },
    ],
    barres: [],
    mutedStrings: [6],
    openStrings: [1, 5],
    fingerLabels: [
      { string: 2, finger: 1 },
      { string: 3, finger: 3 },
      { string: 4, finger: 2 },
    ],
  },
  C: {
    name: 'C',
    frets: 5,
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
};

function mockGetPreset(name: string): ChordPreset | null {
  return mockPresets[name] ?? null;
}

function createMockResult(overrides?: Partial<YouTubeGenerateResult['chart']>): YouTubeGenerateResult {
  return {
    metadata: { videoId: 'test123', title: 'Test', author: 'Author', description: '' },
    transcriptLength: 10,
    chart: {
      title: 'Test Song',
      artist: 'Test Artist',
      key: 'Am',
      tempo: 120,
      timeSignature: '4/4',
      sections: [
        { name: 'Verse', type: 'verse', chords: ['Am', 'C'] },
        { name: 'Chorus', type: 'chorus', chords: ['G', 'F'] },
      ],
      notes: 'Some notes',
      ...overrides,
    },
    provider: 'openai',
    model: 'gpt-4o-mini',
  };
}

describe('loadFromYouTubeResult - preset enrichment', () => {
  it('enriches chords with preset finger data when getPreset is provided', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult(), mockGetPreset);
    });

    const [state] = result.current;
    expect(state.sections).toHaveLength(2);

    // Verse section - Am and C should be enriched
    const verseRow = state.sections[0].rows[0];
    expect(verseRow.kind).toBe('chord-row');
    if (verseRow.kind === 'chord-row') {
      const amChord = verseRow.chords[0];
      expect(amChord.name).toBe('Am');
      expect(amChord.fingers).toHaveLength(3);
      expect(amChord.mutedStrings).toEqual([6]);
      expect(amChord.openStrings).toEqual([1, 5]);

      const cChord = verseRow.chords[1];
      expect(cChord.name).toBe('C');
      expect(cChord.fingers).toHaveLength(3);
    }
  });

  it('leaves chords as empty diagrams when no preset found', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult(), mockGetPreset);
    });

    const [state] = result.current;
    // Chorus section - G and F are not in mockPresets
    const chorusRow = state.sections[1].rows[0];
    if (chorusRow.kind === 'chord-row') {
      const gChord = chorusRow.chords[0];
      expect(gChord.name).toBe('G');
      expect(gChord.fingers).toHaveLength(0); // no preset match
      expect(gChord.barres).toHaveLength(0);
    }
  });

  it('works without getPreset (backward compatible)', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult());
    });

    const [state] = result.current;
    expect(state.sections).toHaveLength(2);
    // All chords should be empty diagrams with names
    const verseRow = state.sections[0].rows[0];
    if (verseRow.kind === 'chord-row') {
      expect(verseRow.chords[0].name).toBe('Am');
      expect(verseRow.chords[0].fingers).toHaveLength(0);
    }
  });

  it('sets song metadata from chart result', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult());
    });

    const [state] = result.current;
    expect(state.title).toBe('Test Song - Test Artist');
    expect(state.artist).toBe('Test Artist');
    expect(state.key).toBe('Am');
    expect(state.tempo).toBe(120);
    expect(state.timeSignature).toBe('4/4');
  });

  it('maps unknown section types to custom', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult({
        sections: [
          { name: 'Riff', type: 'riff', chords: ['Am'] },
        ],
      }));
    });

    const [state] = result.current;
    expect(state.sections[0].type).toBe('custom');
    expect(state.sections[0].name).toBe('Riff');
  });

  it('handles sections with no chords', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult({
        sections: [
          { name: 'Intro', type: 'intro', chords: [] },
          { name: 'Verse', type: 'verse', chords: ['Am'] },
        ],
      }));
    });

    const [state] = result.current;
    expect(state.sections).toHaveLength(2);
    // Intro has no rows since chords was empty
    expect(state.sections[0].rows).toHaveLength(0);
    expect(state.sections[1].rows).toHaveLength(1);
  });

  it('defaults title to "Imported Song" when missing', () => {
    const { result } = renderHook(() => useSongState());
    const [, actions] = result.current;

    act(() => {
      actions.loadFromYouTubeResult(createMockResult({ title: '' }));
    });

    const [state] = result.current;
    expect(state.title).toBe('Imported Song - Test Artist');
  });
});
