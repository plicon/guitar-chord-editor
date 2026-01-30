// Preset Provider Abstraction Layer
// Allows easy swapping between different preset backends (D1, Postgres, etc.)

import type { ChordPreset } from '@/types/chord';
import type { StrummingPreset } from '@/types/presets';

export interface PresetProvider {
  name: string;
  
  // Check if provider is available
  isAvailable(): Promise<boolean>;
  
  // Chord preset operations
  listChordPresets(): Promise<ChordPreset[]>;
  getChordPreset(id: string): Promise<ChordPreset | null>;
  searchChordPresets(query: string): Promise<ChordPreset[]>;
  
  // Strumming preset operations
  listStrummingPresets(timeSignature?: string): Promise<StrummingPreset[]>;
  getStrummingPreset(id: string): Promise<StrummingPreset | null>;
}

export interface PresetProviderConfig {
  provider: 'cloudflare-api' | 'postgres' | 'local-files';
  cloudflareApi?: {
    apiUrl: string;
    enabled: boolean;
  };
  postgres?: {
    connectionString: string;
  };
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  storageKey: string;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  storageKey: 'fretkit_preset_cache',
};
