import { StrumBeat, BeatType } from "@/types/strumming";

export interface StrummingPreset {
  name: string;
  // Pattern for one bar (8 slots: 1 & 2 & 3 & 4 &)
  // Each slot: "up" | "down" | null
  pattern: Array<"up" | "down" | null>;
}

/**
 * Well-known strumming patterns.
 * Each pattern defines strokes for one bar (8 slots).
 * The pattern will be repeated for each bar selected.
 * 
 * Slots: [1, &, 2, &, 3, &, 4, &]
 */
export const strummingPresets: StrummingPreset[] = [
  {
    name: "Basic Down",
    // Down on every beat: 1, 2, 3, 4
    pattern: ["down", null, "down", null, "down", null, "down", null],
  },
  {
    name: "Old Faithful",
    // Old Faithful by Justin Guitar
    pattern: ["down", null, "down", "up", null, "up", "down", null],
  },
  {
    name: "Shoot 'Em Up",
    // Shoot 'em up by Justing Guitar
    pattern: ["down", null, "down", null, "down", "up", "down", "up"],
  },
  {
    name: "Old Faithful (Shuffle)",
    // Old Faithful in shuffle by Justin Guitar
    pattern: ["down", null, "down", "up", null, "up", "down", null ],
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
  
  for (let bar = 0; bar < bars; bar++) {
    preset.pattern.forEach((stroke, index) => {
      beats.push({
        stroke,
        noteValue: "full",
        beatType: (index % 2 === 0 ? "on" : "off") as BeatType,
      });
    });
  }
  
  return beats;
};
