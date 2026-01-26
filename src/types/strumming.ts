export type StrokeType = "up" | "down" | "rest" | null;
export type NoteValue = "full" | "half";
export type BeatType = "on" | "off"; // "on" = 1,2,3,4 | "off" = &

export interface StrumBeat {
  stroke: StrokeType;
  noteValue: NoteValue;
  beatType: BeatType;
}

export interface StrummingPattern {
  bars: number;
  beatsPerBar: number; // 4 for common time (but we store 8 slots: 1 & 2 & 3 & 4 &)
  beats: StrumBeat[];
}

export const createEmptyPattern = (bars: number = 1): StrummingPattern => ({
  bars,
  beatsPerBar: 4,
  beats: Array.from({ length: bars * 8 }, (_, i) => ({
    stroke: null,
    noteValue: "full" as NoteValue,
    beatType: (i % 2 === 0 ? "on" : "off") as BeatType,
  })),
});

export const hasStrummingContent = (pattern: StrummingPattern | null): boolean => {
  if (!pattern) return false;
  return pattern.beats.some((beat) => beat.stroke !== null);
};
