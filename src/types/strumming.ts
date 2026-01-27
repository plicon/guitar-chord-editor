export type StrokeType = "up" | "down" | "rest" | null;
export type NoteValue = "full" | "half";
export type BeatType = "on" | "off"; // "on" = 1,2,3,4... | "off" = &
export type TimeSignature = "4/4" | "3/4" | "6/8";

export interface StrumBeat {
  stroke: StrokeType;
  noteValue: NoteValue;
  beatType: BeatType;
}

export interface StrummingPattern {
  bars: number;
  beatsPerBar: number; // Number of beats per bar (4 for 4/4, 3 for 3/4, 6 for 6/8)
  timeSignature: TimeSignature;
  beats: StrumBeat[];
}

/**
 * Get the number of slots per bar based on time signature
 * Each beat has an on-beat and off-beat slot (&)
 */
export const getSlotsPerBar = (timeSignature: TimeSignature): number => {
  switch (timeSignature) {
    case "3/4": return 6;  // 1 & 2 & 3 &
    case "6/8": return 12; // 1 & 2 & 3 & 4 & 5 & 6 &
    case "4/4":
    default:    return 8;  // 1 & 2 & 3 & 4 &
  }
};

/**
 * Get the number of beats per bar based on time signature
 */
export const getBeatsPerBar = (timeSignature: TimeSignature): number => {
  switch (timeSignature) {
    case "3/4": return 3;
    case "6/8": return 6;
    case "4/4":
    default:    return 4;
  }
};

export const createEmptyPattern = (bars: number = 1, timeSignature: TimeSignature = "4/4"): StrummingPattern => {
  const slotsPerBar = getSlotsPerBar(timeSignature);
  const beatsPerBar = getBeatsPerBar(timeSignature);
  
  return {
    bars,
    beatsPerBar,
    timeSignature,
    beats: Array.from({ length: bars * slotsPerBar }, (_, i) => ({
      stroke: null,
      noteValue: "full" as NoteValue,
      beatType: (i % 2 === 0 ? "on" : "off") as BeatType,
    })),
  };
};

export const hasStrummingContent = (pattern: StrummingPattern | null): boolean => {
  if (!pattern) return false;
  return pattern.beats.some((beat) => beat.stroke !== null);
};
