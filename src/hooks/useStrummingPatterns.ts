import { useEffect, useState } from "react";
import { getStrummingPatterns, createStrummingPattern, updateStrummingPattern, deleteStrummingPattern } from "../services/presets/strummingApi";
import { getBeatLabel } from "../types/strumming";
import { clearPresetCache } from "../services/presets";

// Backend preset structure from API
interface BackendPresetPattern {
  bars: number;
  timeSignature: string;
  subdivision: number;
  pattern: (string | null)[];
}

interface BackendPreset {
  id: string;
  name: string;
  description?: string;
  pattern: BackendPresetPattern;
}

// Convert backend StrummingPreset format to frontend StrummingPattern format
function transformPresetToPattern(preset: BackendPreset) {
  const { pattern } = preset;
  const beatsPerBar = pattern.timeSignature === "6/8" ? 6 : parseInt(pattern.timeSignature.split("/")[0]);
  
  return {
    bars: pattern.bars,
    beatsPerBar,
    timeSignature: pattern.timeSignature,
    subdivision: pattern.subdivision,
    beats: pattern.pattern.map((stroke: string | null, index: number) => ({
      stroke,
      noteValue: "full" as const,
      beatType: getBeatLabel(index, pattern.subdivision),
    })),
  };
}

export function useStrummingPatterns({ admin = false } = {}) {
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    getStrummingPatterns({ admin })
      .then((response) => {
        // Extract data array from paginated response
        const data = response.data || response;
        setPatterns(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch patterns:", err);
        setPatterns([]);
      });
  }, [admin]);

  async function createPattern(data) {
    const newPattern = await createStrummingPattern(data);
    setPatterns((prev) => [...prev, newPattern]);
    // Clear cache so regular frontend gets fresh data
    clearPresetCache();
  }

  async function updatePattern(id, data) {
    const updated = await updateStrummingPattern(id, data);
    setPatterns((prev) => prev.map((p) => (p.id === id ? updated : p)));
    // Clear cache so regular frontend gets fresh data
    clearPresetCache();
  }

  async function deletePattern(id) {
    await deleteStrummingPattern(id);
    setPatterns((prev) => prev.filter((p) => p.id !== id));
    // Clear cache so regular frontend gets fresh data
    clearPresetCache();
  }

  return { patterns, createPattern, updatePattern, deletePattern };
}
