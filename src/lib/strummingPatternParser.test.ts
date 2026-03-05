import { describe, it, expect } from 'vitest';
import { parseStrummingPatternString } from './strummingPatternParser';

describe('parseStrummingPatternString', () => {
  it('returns null for empty or falsy input', () => {
    expect(parseStrummingPatternString('')).toBeNull();
    expect(parseStrummingPatternString(null as unknown as string)).toBeNull();
    expect(parseStrummingPatternString(undefined as unknown as string)).toBeNull();
  });

  it('parses a simple down-up pattern', () => {
    const result = parseStrummingPatternString('D U D U');
    expect(result).not.toBeNull();
    expect(result!.beats[0].stroke).toBe('down');
    expect(result!.beats[1].stroke).toBe('up');
    expect(result!.beats[2].stroke).toBe('down');
    expect(result!.beats[3].stroke).toBe('up');
  });

  it('parses "D DU UDU" pattern (common island strum)', () => {
    const result = parseStrummingPatternString('D DU UDU');
    expect(result).not.toBeNull();
    // D D U U D U = 6 strokes
    expect(result!.beats[0].stroke).toBe('down');
    expect(result!.beats[1].stroke).toBe('down');
    expect(result!.beats[2].stroke).toBe('up');
    expect(result!.beats[3].stroke).toBe('up');
    expect(result!.beats[4].stroke).toBe('down');
    expect(result!.beats[5].stroke).toBe('up');
  });

  it('handles rest markers (X, -, R)', () => {
    const result = parseStrummingPatternString('D-U-D-U-');
    expect(result).not.toBeNull();
    expect(result!.beats[0].stroke).toBe('down');
    expect(result!.beats[1].stroke).toBe('rest');
    expect(result!.beats[2].stroke).toBe('up');
    expect(result!.beats[3].stroke).toBe('rest');
  });

  it('is case-insensitive', () => {
    const result = parseStrummingPatternString('d u d u');
    expect(result).not.toBeNull();
    expect(result!.beats[0].stroke).toBe('down');
    expect(result!.beats[1].stroke).toBe('up');
  });

  it('defaults to 4/4 time with 1 bar', () => {
    const result = parseStrummingPatternString('DUDU');
    expect(result).not.toBeNull();
    expect(result!.timeSignature).toBe('4/4');
    expect(result!.bars).toBe(1);
    expect(result!.beatsPerBar).toBe(4);
  });

  it('creates 2 bars when pattern exceeds one bar', () => {
    // 4/4 with subdivision 2 = 8 slots per bar, so 9+ tokens = 2 bars
    const result = parseStrummingPatternString('D U D U D U D U D');
    expect(result).not.toBeNull();
    expect(result!.bars).toBe(2);
  });

  it('caps at 2 bars maximum', () => {
    // 24 tokens would be 3 bars in 4/4, but should cap at 2
    const result = parseStrummingPatternString('DUDUDUDUDUDUDUDUDUDUDUDUDU');
    expect(result).not.toBeNull();
    expect(result!.bars).toBe(2);
  });

  it('respects 3/4 time signature', () => {
    const result = parseStrummingPatternString('DUD', '3/4');
    expect(result).not.toBeNull();
    expect(result!.timeSignature).toBe('3/4');
    expect(result!.beatsPerBar).toBe(3);
  });

  it('returns null for strings with no valid tokens', () => {
    expect(parseStrummingPatternString('123')).toBeNull();
    expect(parseStrummingPatternString('...')).toBeNull();
  });

  it('fills remaining slots with null strokes', () => {
    // "DU" = 2 strokes, but 4/4 bar has 8 slots
    const result = parseStrummingPatternString('DU');
    expect(result).not.toBeNull();
    expect(result!.beats[0].stroke).toBe('down');
    expect(result!.beats[1].stroke).toBe('up');
    expect(result!.beats[2].stroke).toBeNull();
  });
});
