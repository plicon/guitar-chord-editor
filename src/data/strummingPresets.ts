import { StrumBeat, BeatType, TimeSignature, Subdivision, getSlotsPerBar, getBeatLabel } from "@/types/strumming";

export interface StrummingPreset {
  name: string;
  // Pattern can be for one bar or two bars
  // Each slot: "up" | "down" | null
  pattern: Array<"up" | "down" | null>;
  bars: 1 | 2; // Number of bars this pattern covers
  timeSignature: TimeSignature; // Time signature this preset is designed for
  subdivision: Subdivision; // Number of strums per count
}

/**
 * Well-known strumming patterns.
 * Each pattern can define strokes for one bar or two bars in various time signatures.
 * For 1-bar patterns, the pattern will be repeated for each bar selected.
 * For 2-bar patterns, the pattern will be repeated as a unit.
 * 
 * Subdivision determines strums per count:
 * - 2: eighth notes (1 & 2 & 3 & 4 &)
 * - 3: triplets (1 & a 2 & a 3 & a)
 * - 4: sixteenth notes (1 e + a 2 e + a 3 e + a 4 e + a)
 */
export const strummingPresets: StrummingPreset[] = [
  // 4/4 Patterns (subdivision 2 - eighth notes)
  {
    name: "Basic Down (4/4)",
    bars: 1,
    timeSignature: "4/4",
    subdivision: 2,
    // Down on every beat: 1, 2, 3, 4
    pattern: ["down", null, "down", null, "down", null, "down", null],
  },
  {
    name: "Old Faithful (4/4)",
    bars: 1,
    timeSignature: "4/4",
    subdivision: 2,
    // Old Faithful by Justin Guitar
    pattern: ["down", null, "down", "up", null, "up", "down", null],
  },
  {
    name: "Shoot 'Em Up (4/4)",
    bars: 1,
    timeSignature: "4/4",
    subdivision: 2,
    // Shoot 'em up by Justing Guitar
    pattern: ["down", null, "down", null, "down", "up", "down", "up"],
  },
  {
    name: "Old Faithful Shuffle (4/4)",
    bars: 1,
    timeSignature: "4/4",
    subdivision: 2,
    // Old Faithful in shuffle by Justin Guitar
    pattern: ["down", null, "down", "up", null, "up", "down", null ],
  },
  {
    name: "The Push (4/4)",
    bars: 2,
    timeSignature: "4/4",
    subdivision: 2,
    // The Push by Justin Guitar
    pattern: [
      "down", null, "down", null, "down", "up", null, "up",
      null, "up", "down", null, "down", "up", "down", null,
    ],
  },
  {
    name: "2-Bar Alternating (4/4)",
    bars: 2,
    timeSignature: "4/4",
    subdivision: 2,
    // Alternating emphasis over 2 bars
    pattern: [
      "down", "up", "down", "up", "down", "up", "down", "up",
      "down", null, "down", "up", null, "up", "down", null,
    ],
  },
  
  // 3/4 Patterns (Waltz time, subdivision 2 - eighth notes)
  {
    name: "Basic Down (3/4)",
    bars: 1,
    timeSignature: "3/4",
    subdivision: 2,
    // Down on every beat: 1, 2, 3
    pattern: ["down", null, "down", null, "down", null],
  },
  {
    name: "Waltz Strum (3/4)",
    bars: 1,
    timeSignature: "3/4",
    subdivision: 2,
    // Classic waltz pattern
    pattern: ["down", null, "down", "up", "down", "up"],
  },
  
  // 6/8 Patterns (subdivision 3 - triplets)
  {
    name: "Basic Down (6/8)",
    bars: 1,
    timeSignature: "6/8",
    subdivision: 3,
    // Down on beats 1 and 4
    pattern: ["down", null, null, null, null, null, null, null, null, "down", null, null, null, null, null, null, null, null],
  },
  {
    name: "6/8 Folk Strum",
    bars: 1,
    timeSignature: "6/8",
    subdivision: 3,
    // Common 6/8 pattern
    pattern: ["down", null, "up", null, null, null, "down", null, "up", null, null, null, "down", null, "up", null, null, null],
  },
];

/**
 * Converts a preset pattern to StrumBeat array for the given number of bars
 */
export const applyPresetToBeats = (
  preset: StrummingPreset,
  bars: number,
  timeSignature: TimeSignature = preset.timeSignature,
  subdivision: Subdivision = preset.subdivision
): StrumBeat[] => {
  const beats: StrumBeat[] = [];
  const slotsPerBar = getSlotsPerBar(timeSignature, subdivision);
  
  // Calculate how many times to repeat the pattern
  const repetitions = Math.ceil(bars / preset.bars);
  
  for (let rep = 0; rep < repetitions; rep++) {
    preset.pattern.forEach((stroke, index) => {
      // Only add beats if we haven't exceeded the requested number of bars
      if (beats.length < bars * slotsPerBar) {
        beats.push({
          stroke,
          noteValue: "full",
          beatType: getBeatLabel(beats.length, subdivision),
        });
      }
    });
  }
  
  // Trim to exact number of bars if we overshot
  return beats.slice(0, bars * slotsPerBar);
};
