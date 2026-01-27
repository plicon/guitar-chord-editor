import { StrumBeat, BeatType } from "@/types/strumming";

export interface StrummingPreset {
  name: string;
  // Pattern can be for one bar (8 slots) or two bars (16 slots)
  // Each slot: "up" | "down" | null
  pattern: Array<"up" | "down" | null>;
  bars: 1 | 2; // Number of bars this pattern covers
}

/**
 * Well-known strumming patterns.
 * Each pattern can define strokes for one bar (8 slots) or two bars (16 slots).
 * For 1-bar patterns, the pattern will be repeated for each bar selected.
 * For 2-bar patterns, the pattern will be repeated as a unit.
 * 
 * Slots for 1 bar: [1, &, 2, &, 3, &, 4, &]
 * Slots for 2 bars: [1, &, 2, &, 3, &, 4, &, 1, &, 2, &, 3, &, 4, &]
 */
export const strummingPresets: StrummingPreset[] = [
  {
    name: "Basic Down",
    bars: 1,
    // Down on every beat: 1, 2, 3, 4
    pattern: ["down", null, "down", null, "down", null, "down", null],
  },
  {
    name: "Old Faithful",
    bars: 1,
    // Old Faithful by Justin Guitar
    pattern: ["down", null, "down", "up", null, "up", "down", null],
  },
  {
    name: "Shoot 'Em Up",
    bars: 1,
    // Shoot 'em up by Justing Guitar
    pattern: ["down", null, "down", null, "down", "up", "down", "up"],
  },
  {
    name: "Old Faithful (Shuffle)",
    bars: 1,
    // Old Faithful in shuffle by Justin Guitar
    pattern: ["down", null, "down", "up", null, "up", "down", null ],
  },
  {
    name: "The Push",
    bars: 2,
    // The Push by Justin Guitar
    pattern: [
      "down", null, "down", null, "down", "up", null, "up",
      null, "up", "down", null, "down", "up", "down", null,
    ],
  },
  {
    name: "2-Bar Alternating",
    bars: 2,
    // Alternating emphasis over 2 bars
    pattern: [
      "down", "up", "down", "up", "down", "up", "down", "up",
      "down", null, "down", "up", null, "up", "down", null,
    ],
  },
];

/**
 * Converts a preset pattern to StrumBeat array for the given number of bars
 */
export const applyPresetToBeats = (
  preset: StrummingPreset,
  bars: number
): StrumBeat[] => {
  const beats: StrumBeat[] = [];
  
  // Calculate how many times to repeat the pattern
  const repetitions = Math.ceil(bars / preset.bars);
  
  for (let rep = 0; rep < repetitions; rep++) {
    preset.pattern.forEach((stroke, index) => {
      // Only add beats if we haven't exceeded the requested number of bars
      if (beats.length < bars * 8) {
        beats.push({
          stroke,
          noteValue: "full",
          beatType: (index % 2 === 0 ? "on" : "off") as BeatType,
        });
      }
    });
  }
  
  // Trim to exact number of bars if we overshot
  return beats.slice(0, bars * 8);
};
