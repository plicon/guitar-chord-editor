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
    name: "Island Strum",
    // Down, Down-Up, Up-Down-Up pattern
    pattern: ["down", null, "down", "up", null, "up", "down", "up"],
  },
  {
    name: "Folk Pattern",
    // Down, Down, Up, Up, Down, Up
    pattern: ["down", null, "down", "up", "up", null, "down", "up"],
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
