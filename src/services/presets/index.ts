// Preset Provider Factory and Convenience Functions
import type { PresetProvider, PresetProviderConfig } from './types';
import type { ChordPreset } from '@/types/chord';
import type { StrummingPreset } from '@/types/strumming';
import { CloudflareD1PresetProvider } from './cloudflareD1Provider';
import { CachedPresetProvider } from './cachedProvider';
import { APP_CONFIG } from '@/config/appConfig';

export type { PresetProvider, PresetProviderConfig };

// Create preset provider based on configuration
const createPresetProvider = (): PresetProvider => {
  const config = APP_CONFIG.presets;

  // Use Cloudflare D1 API if configured
  if (config?.backend === 'cloudflare-d1' && config.cloudflareD1) {
    const baseProvider = new CloudflareD1PresetProvider(config.cloudflareD1);
    // Wrap with cache for better performance
    return new CachedPresetProvider(baseProvider);
  }

  // TODO: Add PostgresPresetProvider when implemented
  // if (config?.backend === 'postgres' && config.postgres) {
  //   const baseProvider = new PostgresPresetProvider(config.postgres);
  //   return new CachedPresetProvider(baseProvider);
  // }

  // Fallback: return a provider that throws helpful errors
  return {
    name: 'Not Configured',
    async isAvailable() {
      return false;
    },
    async listChordPresets() {
      throw new Error('Preset provider not configured. Please check APP_CONFIG.presets.');
    },
    async getChordPreset() {
      throw new Error('Preset provider not configured. Please check APP_CONFIG.presets.');
    },
    async searchChordPresets() {
      throw new Error('Preset provider not configured. Please check APP_CONFIG.presets.');
    },
    async listStrummingPresets() {
      throw new Error('Preset provider not configured. Please check APP_CONFIG.presets.');
    },
    async getStrummingPreset() {
      throw new Error('Preset provider not configured. Please check APP_CONFIG.presets.');
    },
  };
};

// Singleton instance
let presetProvider: PresetProvider | null = null;

export const getPresetProvider = (): PresetProvider => {
  if (!presetProvider) {
    presetProvider = createPresetProvider();
  }
  return presetProvider;
};

// Convenience functions for chord presets
export const listChordPresets = async (): Promise<ChordPreset[]> => {
  return getPresetProvider().listChordPresets();
};

export const getChordPreset = async (id: string): Promise<ChordPreset | null> => {
  return getPresetProvider().getChordPreset(id);
};

export const searchChordPresets = async (query: string): Promise<ChordPreset[]> => {
  return getPresetProvider().searchChordPresets(query);
};

// Convenience functions for strumming presets
export const listStrummingPresets = async (
  timeSignature?: string
): Promise<StrummingPreset[]> => {
  return getPresetProvider().listStrummingPresets(timeSignature);
};

export const getStrummingPreset = async (id: string): Promise<StrummingPreset | null> => {
  return getPresetProvider().getStrummingPreset(id);
};

// Clear preset cache
export const clearPresetCache = (): void => {
  const provider = getPresetProvider();
  if (provider instanceof CachedPresetProvider) {
    provider.clearCache();
  }
};
