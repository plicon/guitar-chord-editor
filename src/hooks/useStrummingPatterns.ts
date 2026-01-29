import { useEffect, useState } from "react";
import { getStrummingPatterns, createStrummingPattern, updateStrummingPattern, deleteStrummingPattern } from "../services/presets/strummingApi";
import { getBeatLabel } from "../types/strumming";

// Convert backend StrummingPreset format to frontend StrummingPattern format
function transformPresetToPattern(preset: any) {
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
        console.log("API returned:", response);
        // Extract data array from paginated response
        const data = response.data || response;
        console.log("First pattern:", data[0]); // Debug: log structure of first pattern
        if (data[0]) {
          console.log("First pattern.pattern:", data[0].pattern);
          console.log("First pattern.pattern.pattern:", data[0].pattern.pattern);
        }
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
  }

  async function updatePattern(id, data) {
    const updated = await updateStrummingPattern(id, data);
    setPatterns((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deletePattern(id) {
    await deleteStrummingPattern(id);
    setPatterns((prev) => prev.filter((p) => p.id !== id));
  }

  return { patterns, createPattern, updatePattern, deletePattern };
}
