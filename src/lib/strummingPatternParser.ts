/**
 * Strumming Pattern String Parser
 * 
 * Converts LLM-generated strumming pattern strings like "D DU UDU" or "D D U U D U"
 * into structured StrummingPattern objects.
 * 
 * Supported tokens:
 *  D  = down stroke
 *  U  = up stroke
 *  X  = muted/rest stroke  
 *  -  = rest (silence)
 *  Spaces are ignored (used for grouping readability)
 */

import {
  type StrummingPattern,
  type StrokeType,
  type TimeSignature,
  createEmptyPattern,
  getDefaultSubdivision,
  getSlotsPerBar,
  getBeatLabel,
} from '@/types/strumming';

/**
 * Parse a strumming pattern string into a StrummingPattern object.
 * Returns null if the string is empty or unparseable.
 */
export function parseStrummingPatternString(
  pattern: string,
  timeSignature: TimeSignature = '4/4'
): StrummingPattern | null {
  if (!pattern || typeof pattern !== 'string') return null;

  // Extract stroke tokens: D, U, X, -
  const tokens = pattern
    .toUpperCase()
    .replace(/[^DUXR\-]/g, '') // keep only valid chars (R = rest alias)
    .split('');

  if (tokens.length === 0) return null;

  const strokes: StrokeType[] = tokens.map((t) => {
    switch (t) {
      case 'D': return 'down';
      case 'U': return 'up';
      case 'X':
      case 'R':
      case '-': return 'rest';
      default: return null;
    }
  });

  const subdivision = getDefaultSubdivision(timeSignature);
  const slotsPerBar = getSlotsPerBar(timeSignature, subdivision);

  // Determine number of bars needed
  const bars = Math.max(1, Math.ceil(strokes.length / slotsPerBar));
  // Cap at 2 bars (editor limit)
  const cappedBars = Math.min(bars, 2);
  const totalSlots = cappedBars * slotsPerBar;

  const result = createEmptyPattern(cappedBars, timeSignature, subdivision);

  // Fill in the strokes we parsed
  for (let i = 0; i < Math.min(strokes.length, totalSlots); i++) {
    result.beats[i] = {
      stroke: strokes[i],
      noteValue: 'full',
      beatType: getBeatLabel(i, subdivision),
    };
  }

  return result;
}
