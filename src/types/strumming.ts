export type StrokeType = "up" | "down" | "rest" | null;
export type NoteValue = "full" | "half";

export interface StrumBeat {
  stroke: StrokeType;
  noteValue: NoteValue;
}

export interface StrummingPattern {
  bars: number;
  beatsPerBar: number; // 4 for common time
  beats: StrumBeat[];
}

export const createEmptyPattern = (bars: number = 1): StrummingPattern => ({
  bars,
  beatsPerBar: 4,
  beats: Array.from({ length: bars * 4 }, () => ({
    stroke: null,
    noteValue: "full" as NoteValue,
  })),
});

export const hasStrummingContent = (pattern: StrummingPattern | null): boolean => {
  if (!pattern) return false;
  return pattern.beats.some((beat) => beat.stroke !== null);
};
