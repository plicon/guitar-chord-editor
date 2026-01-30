// D1 Storage Provider for Charts
// Uses the Cloudflare Worker API to store charts in D1 database

import { ChordChart, ChordChartMetadata } from "@/types/chordChart";
import { StorageProvider } from "./types";
import { APP_CONFIG } from "@/config/appConfig";

const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID;
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET;

// Helper to get Cloudflare Access headers for admin endpoints
function getAdminHeaders(extraHeaders = {}) {
  return {
    "CF-Access-Client-Id": CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": CF_ACCESS_CLIENT_SECRET,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    ...extraHeaders,
  };
}

export interface D1StorageConfig {
  apiUrl: string;
}

/**
 * D1 Storage Provider - stores charts in Cloudflare D1 via API
 */
export class D1StorageProvider implements StorageProvider {
  name = "Cloudflare D1";
  private apiUrl: string;

  constructor(config: D1StorageConfig) {
    this.apiUrl = config.apiUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      console.error("D1 Storage health check failed:", error);
      return false;
    }
  }

  async saveChart(chart: ChordChart): Promise<void> {
    // Convert frontend format to API format
    const apiChart = this.convertToApiFormat(chart);

    // Try to update first, then create if not found
    const response = await fetch(`${this.apiUrl}/admin/charts/${chart.id}`, {
      method: "PUT",
      headers: getAdminHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(apiChart),
    });

    if (response.status === 404) {
      // Chart doesn't exist, create it
      const createResponse = await fetch(`${this.apiUrl}/admin/charts`, {
        method: "POST",
        headers: getAdminHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(apiChart),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create chart: ${createResponse.statusText}`);
      }
    } else if (!response.ok) {
      throw new Error(`Failed to save chart: ${response.statusText}`);
    }
  }

  async loadChart(id: string): Promise<ChordChart | null> {
    try {
      const response = await fetch(`${this.apiUrl}/charts/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to load chart: ${response.statusText}`);
      }

      const apiChart = await response.json();
      return this.convertFromApiFormat(apiChart);
    } catch (error) {
      console.error("Failed to load chart:", error);
      return null;
    }
  }

  async listCharts(): Promise<ChordChartMetadata[]> {
    try {
      const response = await fetch(`${this.apiUrl}/admin/charts?limit=100`, {
        method: "GET",
        headers: getAdminHeaders({
          "Content-Type": "application/json",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to list charts: ${response.statusText}`);
      }

      const result = await response.json();
      const charts = result.data || [];
      
      return charts.map((chart: { id: string; title: string; updatedAt: string }) => ({
        id: chart.id,
        name: chart.title,
        title: chart.title,
        updatedAt: chart.updatedAt,
      }));
    } catch (error) {
      console.error("Failed to list charts:", error);
      return [];
    }
  }

  async deleteChart(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/admin/charts/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete chart: ${response.statusText}`);
    }
  }

  /**
   * Convert frontend ChordChart to API format
   */
  private convertToApiFormat(chart: ChordChart) {
    return {
      title: chart.title || chart.name,
      artist: undefined,
      key: undefined,
      timeSignature: chart.strummingPattern?.timeSignature,
      tempo: undefined,
      // Store full chart data as chords array (the API accepts any JSON)
      chords: chart.rows.flat().map((chord) => ({
        id: chord.id,
        name: chord.name,
        positions: [],
        fingering: [],
        barres: chord.barres.map((b) => b.fret),
        baseFret: chord.startFret,
        frets: chord.frets,
        // Store full chord diagram data for reconstruction
        _fullData: chord,
      })),
      strummingPattern: chart.strummingPattern
        ? {
            id: "pattern",
            name: "Pattern",
            pattern: chart.strummingPattern.beats.map((b) => ({
              direction: b.stroke === "down" ? "down" : "up",
              isMuted: b.stroke === "rest",
            })),
            description: undefined,
            // Store full pattern for reconstruction
            _fullData: chart.strummingPattern,
          }
        : undefined,
      notes: JSON.stringify({
        description: chart.description,
        chordsPerRow: chart.chordsPerRow,
        rowSubtitles: chart.rowSubtitles,
        rows: chart.rows,
      }),
    };
  }

  /**
   * Convert API format back to frontend ChordChart
   */
  private convertFromApiFormat(apiChart: {
    id: string;
    title: string;
    notes?: string;
    strummingPattern?: { _fullData?: ChordChart["strummingPattern"] };
    createdAt: string;
    updatedAt: string;
  }): ChordChart {
    // Try to parse stored data from notes
    let storedData: {
      description?: string;
      chordsPerRow?: number;
      rowSubtitles?: string[];
      rows?: ChordChart["rows"];
    } = {};

    try {
      if (apiChart.notes) {
        storedData = JSON.parse(apiChart.notes);
      }
    } catch {
      // Notes field may not be JSON
    }

    return {
      id: apiChart.id,
      name: apiChart.title,
      title: apiChart.title,
      description: storedData.description || "",
      chordsPerRow: storedData.chordsPerRow || 4,
      rows: storedData.rows || [[]],
      rowSubtitles: storedData.rowSubtitles || [],
      strummingPattern: apiChart.strummingPattern?._fullData || null,
      createdAt: apiChart.createdAt,
      updatedAt: apiChart.updatedAt,
    };
  }
}
