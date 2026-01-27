export type StrokeType = "up" | "down" | "rest" | null;
export type NoteValue = "full" | "half";
export type BeatType = "on" | "&" | "e" | "+" | "a"; // Beat position labels
export type TimeSignature = "4/4" | "3/4" | "6/8";
export type Subdivision = 2 | 3 | 4; // Strums per count: 2 (eighth notes), 3 (triplets), 4 (sixteenth notes)

export interface StrumBeat {
  stroke: StrokeType;
  noteValue: NoteValue;
  beatType: BeatType;
}

export interface StrummingPattern {
  bars: number;
  beatsPerBar: number; // Number of beats per bar (4 for 4/4, 3 for 3/4, 6 for 6/8)
  timeSignature: TimeSignature;
  subdivision: Subdivision; // Number of strums per count
  beats: StrumBeat[];
}

/**
 * Get the number of slots per bar based on time signature and subdivision
 * Subdivision indicates strums per count: 2 (eighth), 3 (triplet), 4 (sixteenth)
 */
export const getSlotsPerBar = (timeSignature: TimeSignature, subdivision: Subdivision = 2): number => {
  const beatsPerBar = getBeatsPerBar(timeSignature);
  return beatsPerBar * subdivision;
};

/**
 * Get the default subdivision for a time signature
 */
export const getDefaultSubdivision = (timeSignature: TimeSignature): Subdivision => {
  switch (timeSignature) {
    case "6/8": return 3; // 6/8 uses triplets by default
    case "3/4":
    case "4/4":
    default:    return 2; // 3/4 and 4/4 use eighth notes by default
  }
};

/**
 * Get available subdivisions for a time signature
 */
export const getAvailableSubdivisions = (timeSignature: TimeSignature): Subdivision[] => {
  switch (timeSignature) {
    case "4/4": return [2, 4]; // eighth notes, sixteenth notes
    case "3/4": return [2, 3]; // eighth notes, triplets
    case "6/8": return [3];    // triplets only
    default:    return [2];
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

/**
 * Get the beat label for a slot index based on subdivision
 * @param slotIndex - The index of the slot (0-based)
 * @param subdivision - Number of strums per count (2, 3, or 4)
 * @returns The beat type label
 */
export const getBeatLabel = (slotIndex: number, subdivision: Subdivision): BeatType => {
  const position = slotIndex % subdivision;
  
  if (position === 0) {
    return "on"; // Main beat (1, 2, 3, 4...)
  }
  
  if (subdivision === 2) {
    // Eighth notes: 1 & 2 & 3 & 4 &
    return "&";
  } else if (subdivision === 3) {
    // Triplets: 1 & a 2 & a 3 & a
    return position === 1 ? "&" : "a";
  } else if (subdivision === 4) {
    // Sixteenth notes: 1 e + a 2 e + a 3 e + a 4 e + a
    if (position === 1) return "e";
    if (position === 2) return "+";
    return "a";
  }
  
  return "&"; // fallback
};

export const createEmptyPattern = (
  bars: number = 1,
  timeSignature: TimeSignature = "4/4",
  subdivision?: Subdivision
): StrummingPattern => {
  const defaultSubdivision = subdivision || getDefaultSubdivision(timeSignature);
  const slotsPerBar = getSlotsPerBar(timeSignature, defaultSubdivision);
  const beatsPerBar = getBeatsPerBar(timeSignature);
  
  return {
    bars,
    beatsPerBar,
    timeSignature,
    subdivision: defaultSubdivision,
    beats: Array.from({ length: bars * slotsPerBar }, (_, i) => ({
      stroke: null,
      noteValue: "full" as NoteValue,
      beatType: getBeatLabel(i, defaultSubdivision),
    })),
  };
};

export const hasStrummingContent = (pattern: StrummingPattern | null): boolean => {
  if (!pattern) return false;
  return pattern.beats.some((beat) => beat.stroke !== null);
};
