// Cached Preset Provider Wrapper
// Wraps any PresetProvider and adds localStorage caching with TTL

import type { PresetProvider, CacheConfig } from './types';
import type { ChordPreset } from '@/types/chord';
import type { StrummingPreset } from '@/types/strumming';
import { DEFAULT_CACHE_CONFIG } from './types';

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export class CachedPresetProvider implements PresetProvider {
  name: string;
  private provider: PresetProvider;
  private config: CacheConfig;

  constructor(provider: PresetProvider, config: Partial<CacheConfig> = {}) {
    this.provider = provider;
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.name = `Cached ${provider.name}`;
  }

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  async listChordPresets(): Promise<ChordPreset[]> {
    if (!this.config.enabled) {
      return this.provider.listChordPresets();
    }

    const cacheKey = `${this.config.storageKey}_chord_presets_list`;
    const cached = this.getFromCache<ChordPreset[]>(cacheKey);

    if (cached) {
      console.log('Using cached chord presets');
      return cached;
    }

    console.log('Fetching chord presets from API');
    const presets = await this.provider.listChordPresets();
    this.saveToCache(cacheKey, presets);
    return presets;
  }

  async getChordPreset(id: string): Promise<ChordPreset | null> {
    if (!this.config.enabled) {
      return this.provider.getChordPreset(id);
    }

    const cacheKey = `${this.config.storageKey}_chord_preset_${id}`;
    const cached = this.getFromCache<ChordPreset>(cacheKey);

    if (cached) {
      return cached;
    }

    const preset = await this.provider.getChordPreset(id);
    if (preset) {
      this.saveToCache(cacheKey, preset);
    }
    return preset;
  }

  async searchChordPresets(query: string): Promise<ChordPreset[]> {
    // Don't cache search results (queries are dynamic)
    return this.provider.searchChordPresets(query);
  }

  async listStrummingPresets(timeSignature?: string): Promise<StrummingPreset[]> {
    // Don't cache strumming presets - always fetch fresh data
    return this.provider.listStrummingPresets(timeSignature);
  }

  async getStrummingPreset(id: string): Promise<StrummingPreset | null> {
    // Don't cache strumming presets - always fetch fresh data
    return this.provider.getStrummingPreset(id);
  }

  // Clear all cached presets
  clearCache(): void {
    const keys = Object.keys(localStorage);
    const cachePrefix = this.config.storageKey;
    
    keys.forEach((key) => {
      if (key.startsWith(cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Preset cache cleared');
  }

  // Private cache methods
  private getFromCache<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const cached: CachedData<T> = JSON.parse(item);
      const age = Date.now() - cached.timestamp;

      if (age > this.config.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to read from cache:', error);
      return null;
    }
  }

  private saveToCache<T>(key: string, data: T): void {
    try {
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }
}
