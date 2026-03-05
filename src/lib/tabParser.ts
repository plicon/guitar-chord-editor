/**
 * Parse ASCII tab notation strings into TabMeasure objects.
 * 
 * Expected input: 6 strings ordered high-to-low (e, B, G, D, A, E),
 * each prefixed with the string name and pipe, e.g.:
 *   "e|---0---0---|"
 *   "B|---1---1---|"
 *   ...
 */

import { TabMeasure, TabColumn, TabNote, TabTechnique, createEmptyTabNote } from "@/types/tab";

const TECHNIQUE_CHARS: Record<string, TabTechnique> = {
  h: 'h',
  p: 'p',
  '/': '/',
  '\\': '\\',
  b: 'b',
  r: 'r',
  '~': '~',
};

/**
 * Parse 6 ASCII tab lines into an array of TabMeasure objects.
 * Lines are split on '|' to detect measure boundaries.
 */
export function parseAsciiTab(lines: string[]): TabMeasure[] {
  if (lines.length < 4 || lines.length > 6) return [];

  // Pad to 6 lines if fewer were provided (e.g. only 4 strings shown)
  while (lines.length < 6) {
    const sampleLine = lines[0];
    const pipeIdx = sampleLine.indexOf('|');
    const dashLen = pipeIdx >= 0 ? sampleLine.length - pipeIdx - 1 : sampleLine.length;
    lines.push('-'.repeat(dashLen));
  }

  // Strip string label prefix (e.g. "e|" or "E|") and split by '|' for measures
  const stripped = lines.map(line => {
    const pipeIdx = line.indexOf('|');
    return pipeIdx >= 0 ? line.slice(pipeIdx + 1) : line;
  });

  // Remove trailing empty segment from final '|'
  const measureSegments = stripped[0].split('|').filter(s => s.length > 0);
  const allStringSegments = stripped.map(s => s.split('|').filter(seg => seg.length > 0));

  // Ensure all strings have same number of measures
  const measureCount = measureSegments.length;
  if (allStringSegments.some(segs => segs.length !== measureCount)) {
    // Fallback: treat entire thing as one measure
    return [parseSingleMeasure(stripped)];
  }

  const measures: TabMeasure[] = [];
  for (let m = 0; m < measureCount; m++) {
    const measureLines = allStringSegments.map(segs => segs[m]);
    measures.push(parseSingleMeasure(measureLines));
  }

  return measures.filter(m => m.columns.length > 0);
}

function parseSingleMeasure(lines: string[]): TabMeasure {
  const maxLen = Math.max(...lines.map(l => l.length));
  const columns: TabColumn[] = [];

  let i = 0;
  while (i < maxLen) {
    const notes: TabNote[] = [];
    let hasContent = false;
    let maxAdvance = 1;

    for (let s = 0; s < 6; s++) {
      const line = lines[s];
      if (i >= line.length) {
        notes.push(createEmptyTabNote());
        continue;
      }

      const ch = line[i];

      if (ch >= '0' && ch <= '9') {
        // Check for two-digit fret numbers (10-24)
        let fretStr = ch;
        if (i + 1 < line.length && line[i + 1] >= '0' && line[i + 1] <= '9') {
          fretStr += line[i + 1];
          maxAdvance = Math.max(maxAdvance, 2);
        }
        const fret = parseInt(fretStr, 10);

        // Check for technique after the number
        const techIdx = fretStr.length === 2 ? i + 2 : i + 1;
        let technique: TabTechnique | undefined;
        if (techIdx < line.length && TECHNIQUE_CHARS[line[techIdx]]) {
          technique = TECHNIQUE_CHARS[line[techIdx]];
          maxAdvance = Math.max(maxAdvance, techIdx - i + 1);
        }

        notes.push({ fret, technique });
        hasContent = true;
      } else if (ch === '-' || ch === ' ') {
        notes.push(createEmptyTabNote());
      } else if (TECHNIQUE_CHARS[ch]) {
        // Standalone technique (rare but possible)
        notes.push(createEmptyTabNote());
      } else {
        notes.push(createEmptyTabNote());
      }
    }

    if (hasContent) {
      columns.push({
        strings: [notes[0], notes[1], notes[2], notes[3], notes[4], notes[5]],
      });
    }

    i += maxAdvance;
  }

  return {
    id: `tab-measure-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    columns: columns.length > 0 ? columns : [{ strings: Array.from({ length: 6 }, createEmptyTabNote) as TabColumn['strings'] }],
    timeSignature: '4/4',
  };
}
