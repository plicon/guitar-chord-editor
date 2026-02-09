// Chord Preset Cache Hook
// Prefetches all chord presets at startup using React Query for instant lookups.
// Eliminates per-chord API calls and provides sync access to preset data.

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listChordPresets } from '@/services/presets';
import type { ChordPreset } from '@/types/chord';

// Normalize chord name for case-insensitive matching
// Handles Unicode sharp/flat symbols and ASCII equivalents
function normalizeChordName(name: string): string {
  return name
    .trim()
    .replace(/#/g, '♯')
    .replace(/([A-Ga-g])b(?![a-z])/g, '$1♭');
}

export function useChordPresetCache() {
  const {
    data: presets = [],
    isLoading,
    isError,
  } = useQuery<ChordPreset[]>({
    queryKey: ['chord-presets-all'],
    queryFn: listChordPresets,
    staleTime: 60 * 60 * 1000, // 1 hour before refetch
    gcTime: 24 * 60 * 60 * 1000, // Keep in memory 24h
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  // Build a name→preset map for O(1) lookups
  const presetMap = useMemo(() => {
    const map = new Map<string, ChordPreset>();
    for (const preset of presets) {
      map.set(normalizeChordName(preset.name), preset);
    }
    return map;
  }, [presets]);

  // Instant sync lookup by name
  const getPreset = (name: string): ChordPreset | null => {
    return presetMap.get(normalizeChordName(name)) ?? null;
  };

  // Check if a preset exists by name
  const hasPreset = (name: string): boolean => {
    return presetMap.has(normalizeChordName(name));
  };

  // Search presets by prefix (client-side, instant)
  const searchPresets = (query: string): ChordPreset[] => {
    if (!query.trim()) return [];
    const normalized = normalizeChordName(query).toLowerCase();
    return presets.filter((p) =>
      normalizeChordName(p.name).toLowerCase().startsWith(normalized)
    );
  };

  return {
    presets,
    isLoading,
    isError,
    getPreset,
    hasPreset,
    searchPresets,
    presetCount: presets.length,
  };
}
