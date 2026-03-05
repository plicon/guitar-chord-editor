// Cloudflare D1 Preset Provider
import type { PresetProvider } from './types';
import type { ChordPreset } from '@/types/chord';
import type { StrummingPreset } from '@/types/presets';
import type { TimeSignature, Subdivision } from '@/types/strumming';

const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID || '';
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET || '';

function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = CF_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = CF_ACCESS_CLIENT_SECRET;
  }

  return headers;
}

export interface CloudflareApiConfig {
  apiUrl: string;
  enabled: boolean;
}

// API response types
interface ApiChordPreset {
  id: string;
  name: string;
  frets: number;
  startFret: number;
  fingers: { string: number; fret: number; finger?: number }[];
  barres: { fret: number; fromString: number; toString: number; finger?: number }[];
  mutedStrings: number[];
  openStrings: number[];
  fingerLabels: { string: number; finger: number }[];
  createdAt: string;
  updatedAt: string;
}

interface ApiStrummingPreset {
  id: string;
  name: string;
  pattern: {
    bars: number;
    timeSignature: string;
    subdivision: string;
    pattern: string[];
  };
}

export class CloudflareD1PresetProvider implements PresetProvider {
  name = 'Cloudflare D1';
  private apiUrl: string;
  private enabled: boolean;

  constructor(config: CloudflareApiConfig) {
    this.apiUrl = config.apiUrl;
    this.enabled = config.enabled;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: getRequestHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Cloudflare API health check failed:', error);
      return false;
    }
  }

  async listChordPresets(): Promise<ChordPreset[]> {
    try {
      // Fetch all presets in one request (used for prefetch cache)
      const response = await fetch(`${this.apiUrl}/presets/chords?limit=5000`, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chord presets: ${response.statusText}`);
      }

      const result = await response.json();
      return this.convertApiChordPresetsToAppFormat(result.data || []);
    } catch (error) {
      console.error('Failed to fetch chord presets:', error);
      return [];
    }
  }

  async getChordPreset(nameOrId: string): Promise<ChordPreset | null> {
    try {
      // First try by ID (lowercase, remove special chars)
      const id = nameOrId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let response = await fetch(`${this.apiUrl}/presets/chords/${id}`, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return this.convertApiChordPresetToAppFormat(data);
      }

      // If not found by ID, try searching by name
      response = await fetch(
        `${this.apiUrl}/presets/chords?search=${encodeURIComponent(nameOrId)}`,
        {
          method: 'GET',
          headers: getRequestHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      const searchResult = await response.json();
      // Look for exact name match
      const presets = this.convertApiChordPresetsToAppFormat(searchResult.data || []);
      const match = presets.find(p => p.name === nameOrId);
      return match || null;
    } catch (error) {
      console.error('Failed to fetch chord preset:', error);
      return null;
    }
  }

  async searchChordPresets(query: string): Promise<ChordPreset[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/presets/chords?search=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: getRequestHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search chord presets: ${response.statusText}`);
      }

      const data = await response.json();
      return this.convertApiChordPresetsToAppFormat(data);
    } catch (error) {
      console.error('Failed to search chord presets:', error);
      return [];
    }
  }

  async listStrummingPresets(timeSignature?: string): Promise<StrummingPreset[]> {
    try {
      const url = timeSignature
        ? `${this.apiUrl}/presets/strumming?timeSignature=${encodeURIComponent(timeSignature)}`
        : `${this.apiUrl}/presets/strumming`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch strumming presets: ${response.statusText}`);
      }

      const result = await response.json();
      return this.convertApiStrummingPresetsToAppFormat(result.data || []);
    } catch (error) {
      console.error('Failed to fetch strumming presets:', error);
      return [];
    }
  }

  async getStrummingPreset(nameOrId: string): Promise<StrummingPreset | null> {
    try {
      // First try by ID (lowercase, remove special chars)
      const id = nameOrId.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let response = await fetch(`${this.apiUrl}/presets/strumming/${id}`, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return this.convertApiStrummingPresetToAppFormat(data);
      }

      // If not found by ID, try searching by name
      response = await fetch(
        `${this.apiUrl}/presets/strumming?q=${encodeURIComponent(nameOrId)}`,
        {
          method: 'GET',
          headers: getRequestHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      const searchResult = await response.json();
      // Look for exact name match
      const presets = this.convertApiStrummingPresetsToAppFormat(searchResult.data || []);
      const match = presets.find(p => p.name === nameOrId);
      return match || null;
    } catch (error) {
      console.error('Failed to fetch strumming preset:', error);
      return null;
    }
  }

  // Convert API format to app format for chord presets
  private convertApiChordPresetsToAppFormat(apiPresets: ApiChordPreset[]): ChordPreset[] {
    return apiPresets.map((preset) => this.convertApiChordPresetToAppFormat(preset));
  }

  private convertApiChordPresetToAppFormat(apiPreset: ApiChordPreset): ChordPreset {
    // Normalize barres: ensure fromString >= toString (app convention)
    const normalizedBarres = (apiPreset.barres || []).map(b => ({
      ...b,
      fromString: Math.max(b.fromString, b.toString),
      toString: Math.min(b.fromString, b.toString),
    }));

    // Derive fingerLabels from fingers when not provided by the API
    let fingerLabels = apiPreset.fingerLabels || [];
    if (fingerLabels.length === 0 && apiPreset.fingers?.length > 0) {
      fingerLabels = apiPreset.fingers
        .filter(f => f.finger !== undefined && f.finger !== null)
        .map(f => ({ string: f.string, finger: f.finger! }));
    }

    return {
      name: apiPreset.name,
      frets: apiPreset.frets,
      startFret: apiPreset.startFret,
      fingers: apiPreset.fingers,
      barres: normalizedBarres,
      mutedStrings: apiPreset.mutedStrings,
      openStrings: apiPreset.openStrings,
      fingerLabels,
    };
  }

  // Convert API format to app format for strumming presets
  private convertApiStrummingPresetsToAppFormat(apiPresets: ApiStrummingPreset[]): StrummingPreset[] {
    return apiPresets.map((preset) => this.convertApiStrummingPresetToAppFormat(preset));
  }

  private convertApiStrummingPresetToAppFormat(apiPreset: ApiStrummingPreset): StrummingPreset {
    // API format: { id, name, pattern: { bars, timeSignature, subdivision, pattern } }
    // App format: { name, pattern: [...], bars, timeSignature, subdivision }
    return {
      name: apiPreset.name,
      pattern: apiPreset.pattern.pattern.map(p => p as "up" | "down" | null),
      bars: apiPreset.pattern.bars as 1 | 2,
      timeSignature: apiPreset.pattern.timeSignature as TimeSignature,
      subdivision: parseInt(apiPreset.pattern.subdivision) as Subdivision,
    };
  }
}
