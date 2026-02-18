import type { ChordDiagram, ChordPreset } from '@/types/chord';

// ── Internal normalised shapes ───────────────────────────────────────────────
// Both ChordDiagram and ChordPreset store fret numbers as absolute values
// (e.g. a finger at the 5th fret is stored as fret=5 regardless of startFret).
// To compare two chord shapes independently of where they are on the neck we
// convert every fret to a 1-based position relative to the diagram's startFret:
//
//   relativeFret = absoluteFret - startFret + 1
//
// A chord with startFret=1 and a finger at fret=3 has relativeFret=3.
// A chord with startFret=3 and a finger at fret=5 also has relativeFret=3.
// They are the same shape and will match.

interface NormalisedFinger {
  string: number;
  relativeFret: number;
}

interface NormalisedBarre {
  relativeFret: number;
  /** Higher string number (e.g. 6 = low E). */
  highString: number;
  /** Lower string number (e.g. 1 = high e). */
  lowString: number;
}

interface NormalisedShape {
  fingers: NormalisedFinger[];
  barres: NormalisedBarre[];
  mutedStrings: number[];
}

function normaliseShape(
  fingers: Array<{ string: number; fret: number }>,
  barres: Array<{ fret: number; fromString: number; toString: number }>,
  mutedStrings: number[],
  startFret: number,
): NormalisedShape {
  return {
    fingers: fingers.map(f => ({
      string: f.string,
      relativeFret: f.fret - startFret + 1,
    })),
    barres: barres.map(b => ({
      relativeFret: b.fret - startFret + 1,
      highString: Math.max(b.fromString, b.toString),
      lowString: Math.min(b.fromString, b.toString),
    })),
    mutedStrings: [...mutedStrings].sort((a, b) => a - b),
  };
}

function fingerMatches(a: NormalisedFinger, b: NormalisedFinger): boolean {
  return a.string === b.string && a.relativeFret === b.relativeFret;
}

function barreMatches(a: NormalisedBarre, b: NormalisedBarre): boolean {
  return (
    a.relativeFret === b.relativeFret &&
    a.highString === b.highString &&
    a.lowString === b.lowString
  );
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface ChordMatch {
  name: string;
  /**
   * 0–1. Ratio of overlapping fretted elements to the larger of the two sets
   * (current diagram vs. preset). 1.0 means every element matches in both
   * directions (isExact will also be true).
   */
  score: number;
  /**
   * True when ALL fingers and barres in the current diagram match ALL fingers
   * and barres in the preset – a perfect bidirectional match.
   */
  isExact: boolean;
}

/**
 * Compares the current `ChordDiagram` against every preset and returns ranked
 * matches, sorted by exactness then score then name.
 *
 * Only presets with `score >= threshold` are included.
 * Muted strings are not part of the score (many presets omit them) but an
 * exact muted-string match gives a small tie-breaking bonus.
 *
 * Performance: O(n) over the preset list with tiny constant per preset —
 * comfortably <1ms for 5 000 presets.
 */
export function findMatchingChords(
  chord: ChordDiagram,
  presets: ChordPreset[],
  { threshold = 0.85, maxResults = 8 }: { threshold?: number; maxResults?: number } = {},
): ChordMatch[] {
  if (chord.fingers.length === 0 && chord.barres.length === 0) {
    return [];
  }

  const current = normaliseShape(
    chord.fingers,
    chord.barres,
    chord.mutedStrings,
    chord.startFret,
  );
  const currentTotal = current.fingers.length + current.barres.length;

  const results: ChordMatch[] = [];

  for (const preset of presets) {
    const ps = normaliseShape(
      preset.fingers,
      preset.barres,
      preset.mutedStrings,
      preset.startFret,
    );
    const presetTotal = ps.fingers.length + ps.barres.length;
    if (presetTotal === 0) continue;

    const matchingFingers = current.fingers.filter(cf =>
      ps.fingers.some(pf => fingerMatches(cf, pf)),
    ).length;

    const matchingBarres = current.barres.filter(cb =>
      ps.barres.some(pb => barreMatches(cb, pb)),
    ).length;

    const matchingTotal = matchingFingers + matchingBarres;
    const maxTotal = Math.max(currentTotal, presetTotal);
    const score = matchingTotal / maxTotal;

    if (score < threshold) continue;

    const isExact =
      matchingFingers === current.fingers.length &&
      matchingFingers === ps.fingers.length &&
      matchingBarres === current.barres.length &&
      matchingBarres === ps.barres.length;

    // Small bonus so exact-muted-string matches win ties.
    const mutedBonus =
      JSON.stringify(current.mutedStrings) === JSON.stringify(ps.mutedStrings) ? 0.01 : 0;

    results.push({ name: preset.name, score: Math.min(1, score + mutedBonus), isExact });
  }

  results.sort((a, b) => {
    if (a.isExact !== b.isExact) return a.isExact ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  return results.slice(0, maxResults);
}
