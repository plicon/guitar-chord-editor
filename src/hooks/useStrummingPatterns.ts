import { useEffect, useState } from "react";
import { getStrummingPatterns, createStrummingPattern, updateStrummingPattern, deleteStrummingPattern } from "../services/presets/strummingApi";
import { getBeatLabel } from "../types/strumming";
import type { TimeSignature, Subdivision, StrokeType } from "../types/strumming";

// Backend preset structure from API
export interface BackendPresetPattern {
  bars: number;
  timeSignature: string;
  subdivision: number;
  pattern: (string | null)[];
}

export interface BackendPreset {
  id: string;
  name: string;
  description?: string;
  pattern: BackendPresetPattern;
}

// Convert backend StrummingPreset format to frontend StrummingPattern format
export function transformPresetToPattern(preset: BackendPreset) {
  const { pattern } = preset;
  const beatsPerBar = pattern.timeSignature === "6/8" ? 6 : parseInt(pattern.timeSignature.split("/")[0]);
  
  return {
    bars: pattern.bars,
    beatsPerBar,
    timeSignature: pattern.timeSignature as TimeSignature,
    subdivision: pattern.subdivision as Subdivision,
    beats: pattern.pattern.map((stroke: string | null, index: number) => ({
      stroke: stroke as StrokeType,
      noteValue: "full" as const,
      beatType: getBeatLabel(index, pattern.subdivision as Subdivision),
    })),
  };
}

export function useStrummingPatterns() {
  const [patterns, setPatterns] = useState<BackendPreset[]>([]);

  useEffect(() => {
    getStrummingPatterns()
      .then((response: { data?: BackendPreset[] } | BackendPreset[]) => {
        // Extract data array from paginated response
        const data = (response as { data?: BackendPreset[] }).data || response;
        setPatterns(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        console.error("Failed to fetch patterns:", err);
        setPatterns([]);
      });
  }, []);

  async function createPattern(data: Record<string, unknown>) {
    const newPattern = await createStrummingPattern(data);
    setPatterns((prev) => [...prev, newPattern]);
  }

  async function updatePattern(id: string, data: Record<string, unknown>) {
    const updated = await updateStrummingPattern(id, data);
    setPatterns((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deletePattern(id: string) {
    await deleteStrummingPattern(id);
    setPatterns((prev) => prev.filter((p) => p.id !== id));
  }

  return { patterns, createPattern, updatePattern, deletePattern };
}
