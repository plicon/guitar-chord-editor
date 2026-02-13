// D1 Storage Provider for Songs
// Uses the Cloudflare Worker API to store songs in D1 database

import { Song } from "@/types/song";
import { ChordChart, ChordChartMetadata } from "@/types/chordChart";
import { StorageProvider } from "./types";

export interface D1StorageConfig {
  apiUrl: string;
}

export interface SongMetadata {
  id: string;
  title: string;
  artist?: string;
  updatedAt: string;
}

/**
 * D1 Storage Provider - stores songs in Cloudflare D1 via API
 */
export class D1StorageProvider implements StorageProvider {
  name = "Cloudflare D1";
  private apiUrl: string;
  private cfAccessClientId: string;
  private cfAccessClientSecret: string;

  constructor(config: D1StorageConfig) {
    this.apiUrl = config.apiUrl;
    this.cfAccessClientId = import.meta.env.VITE_CF_ACCESS_CLIENT_ID || "";
    this.cfAccessClientSecret = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET || "";
  }

  /**
   * Get headers including CF-Access service auth when configured
   */
  private getHeaders(includeContentType = true): Record<string, string> {
    const headers: Record<string, string> = {};
    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }
    if (this.cfAccessClientId && this.cfAccessClientSecret) {
      headers["CF-Access-Client-Id"] = this.cfAccessClientId;
      headers["CF-Access-Client-Secret"] = this.cfAccessClientSecret;
    }
    return headers;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        headers: this.getHeaders(false),
      });
      return response.ok;
    } catch (error) {
      console.error("D1 Storage health check failed:", error);
      return false;
    }
  }

  async saveSong(song: Song): Promise<void> {
    // Try to update first, then create if not found
    const response = await fetch(`${this.apiUrl}/admin/songs/${song.id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(song),
    });

    if (response.status === 404) {
      // Song doesn't exist, create it
      const createResponse = await fetch(`${this.apiUrl}/admin/songs`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(song),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create song: ${createResponse.statusText}`);
      }
    } else if (!response.ok) {
      throw new Error(`Failed to save song: ${response.statusText}`);
    }
  }

  async loadSong(id: string): Promise<Song | null> {
    try {
      const response = await fetch(`${this.apiUrl}/songs/${id}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to load song: ${response.statusText}`);
      }

      const song = await response.json();
      return song;
    } catch (error) {
      console.error("Failed to load song:", error);
      return null;
    }
  }

  async listSongs(): Promise<SongMetadata[]> {
    try {
      const response = await fetch(`${this.apiUrl}/songs?limit=100`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to list songs: ${response.statusText}`);
      }

      const result = await response.json();
      const songs = result.data || [];
      
      return songs.map((song: { id: string; title: string; artist?: string; updatedAt: string }) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        updatedAt: song.updatedAt,
      }));
    } catch (error) {
      console.error("Failed to list songs:", error);
      return [];
    }
  }

  async deleteSong(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/admin/songs/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(false),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete song: ${response.statusText}`);
    }
  }

  // Legacy methods for backward compatibility
  async saveChart(chart: ChordChart): Promise<void> {
    throw new Error("saveChart is deprecated. Use saveSong instead.");
  }

  async loadChart(id: string): Promise<ChordChart | null> {
    throw new Error("loadChart is deprecated. Use loadSong instead.");
  }

  async listCharts(): Promise<ChordChartMetadata[]> {
    try {
      const songs = await this.listSongs();
      return songs.map(song => ({
        id: song.id,
        name: song.title,
        title: song.title,
        updatedAt: song.updatedAt,
      }));
    } catch (error) {
      console.error("Failed to list charts:", error);
      return [];
    }
  }

  async deleteChart(id: string): Promise<void> {
    return this.deleteSong(id);
  }
}
