import { ChordChart, ChordChartMetadata } from "@/types/chordChart";
import { StorageProvider, StorageConfig, S3Config } from "./types";
import { LocalStorageProvider } from "./localStorageProvider";
import { S3StorageProvider } from "./s3StorageProvider";
import { APP_CONFIG } from "@/config/appConfig";

export type { StorageProvider, StorageConfig, S3Config };

// Create storage provider based on configuration
const createStorageProvider = (): StorageProvider => {
  const config = APP_CONFIG.storage;

  if (config?.provider === "s3" && config.s3) {
    return new S3StorageProvider(config.s3);
  }

  // Default to localStorage
  return new LocalStorageProvider();
};

// Singleton instance
let storageProvider: StorageProvider | null = null;

export const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    storageProvider = createStorageProvider();
  }
  return storageProvider;
};

// Convenience functions
export const saveChart = async (chart: ChordChart): Promise<void> => {
  return getStorageProvider().saveChart(chart);
};

export const loadChart = async (id: string): Promise<ChordChart | null> => {
  return getStorageProvider().loadChart(id);
};

export const listCharts = async (): Promise<ChordChartMetadata[]> => {
  return getStorageProvider().listCharts();
};

export const deleteChart = async (id: string): Promise<void> => {
  return getStorageProvider().deleteChart(id);
};

// JSON file export/import utilities
export const exportChartToJson = (chart: ChordChart): string => {
  return JSON.stringify(chart, null, 2);
};

export const importChartFromJson = (json: string): ChordChart => {
  const chart = JSON.parse(json) as ChordChart;
  
  // Validate required fields
  if (!chart.id || !chart.rows) {
    throw new Error("Invalid chart format");
  }
  
  // Generate new ID to avoid conflicts
  chart.id = `chart-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  chart.updatedAt = new Date().toISOString();
  
  return chart;
};

export const downloadChartAsJson = (chart: ChordChart): void => {
  const json = exportChartToJson(chart);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chart.name || "chord-chart"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
