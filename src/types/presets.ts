import { StrumBeat, TimeSignature, Subdivision, getSlotsPerBar, getBeatLabel } from "@/types/strumming";

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
