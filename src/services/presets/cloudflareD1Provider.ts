// Cloudflare D1 Preset Provider
import type { PresetProvider } from './types';
import type { ChordPreset } from '@/types/chord';
import type { StrummingPreset } from '@/types/strumming';

export interface CloudflareApiConfig {
  apiUrl: string;
  enabled: boolean;
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
      });
      return response.ok;
    } catch (error) {
      console.error('Cloudflare API health check failed:', error);
      return false;
    }
  }

  async listChordPresets(): Promise<ChordPreset[]> {
    try {
      const response = await fetch(`${this.apiUrl}/presets/chords`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chord presets: ${response.statusText}`);
      }

      const data = await response.json();
      return this.convertApiChordPresetsToAppFormat(data);
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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return this.convertApiChordPresetToAppFormat(data);
      }

      // If not found by ID, try searching by name
      response = await fetch(
        `${this.apiUrl}/presets/chords?q=${encodeURIComponent(nameOrId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const searchResult = await response.json();
      // Look for exact name match
      const presets = this.convertApiChordPresetsToAppFormat(searchResult);
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
          headers: {
            'Content-Type': 'application/json',
          },
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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch strumming presets: ${response.statusText}`);
      }

      const data = await response.json();
      return this.convertApiStrummingPresetsToAppFormat(data);
    } catch (error) {
      console.error('Failed to fetch strumming presets:', error);
      return [];
    }
  }

  async getStrummingPreset(id: string): Promise<StrummingPreset | null> {
    try {
      const response = await fetch(`${this.apiUrl}/presets/strumming/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch strumming preset: ${response.statusText}`);
      }

      const data = await response.json();
      return this.convertApiStrummingPresetToAppFormat(data);
    } catch (error) {
      console.error('Failed to fetch strumming preset:', error);
      return null;
    }
  }

  // Convert API format to app format for chord presets
  private convertApiChordPresetsToAppFormat(apiPresets: any[]): ChordPreset[] {
    return apiPresets.map((preset) => this.convertApiChordPresetToAppFormat(preset));
  }

  private convertApiChordPresetToAppFormat(apiPreset: any): ChordPreset {
    // API format: { id, name, frets, fingers, barreInfo }
    // App format: { name, startFret, fingers, barres, mutedStrings, openStrings, fingerLabels }
    
    const frets = apiPreset.frets as (number | 'x' | null)[];
    const fingerNumbers = apiPreset.fingers as (number | null)[] | undefined;
    
    // Calculate startFret (lowest non-zero fret)
    const numericFrets = frets.filter((f): f is number => typeof f === 'number' && f > 0);
    const startFret = numericFrets.length > 0 ? Math.min(...numericFrets) : 1;
    
    // Build finger positions
    const fingers = frets
      .map((fret, stringIndex) => {
        if (typeof fret === 'number' && fret > 0) {
          return { string: 6 - stringIndex, fret }; // Convert to 1-based string index
        }
        return null;
      })
      .filter((f): f is { string: number; fret: number } => f !== null);
    
    // Build barres
    const barres = apiPreset.barreInfo
      ? [{
          fret: apiPreset.barreInfo.fret,
          fromString: apiPreset.barreInfo.fromString,
          toString: apiPreset.barreInfo.toString,
        }]
      : [];
    
    // Identify muted and open strings
    const mutedStrings = frets
      .map((fret, index) => (fret === 'x' ? 6 - index : null))
      .filter((s): s is number => s !== null);
    
    const openStrings = frets
      .map((fret, index) => (fret === 0 ? 6 - index : null))
      .filter((s): s is number => s !== null);
    
    // Build finger labels
    const fingerLabels = fingerNumbers
      ? frets
          .map((fret, stringIndex) => {
            const finger = fingerNumbers[stringIndex];
            if (typeof fret === 'number' && fret > 0 && finger) {
              return { string: 6 - stringIndex, finger };
            }
            return null;
          })
          .filter((f): f is { string: number; finger: number } => f !== null)
      : [];
    
    return {
      name: apiPreset.name,
      startFret,
      fingers,
      barres,
      mutedStrings,
      openStrings,
      fingerLabels,
    };
  }

  // Convert API format to app format for strumming presets
  private convertApiStrummingPresetsToAppFormat(apiPresets: any[]): StrummingPreset[] {
    return apiPresets.map((preset) => this.convertApiStrummingPresetToAppFormat(preset));
  }

  private convertApiStrummingPresetToAppFormat(apiPreset: any): StrummingPreset {
    return {
      id: apiPreset.id,
      name: apiPreset.name,
      timeSignature: apiPreset.timeSignature,
      subdivision: apiPreset.subdivision,
      pattern: apiPreset.pattern,
    };
  }
}
