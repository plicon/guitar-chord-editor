import { ChordChart, ChordChartMetadata } from "@/types/chordChart";

export interface StorageProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  saveChart: (chart: ChordChart) => Promise<void>;
  loadChart: (id: string) => Promise<ChordChart | null>;
  listCharts: () => Promise<ChordChartMetadata[]>;
  deleteChart: (id: string) => Promise<void>;
}

export interface StorageConfig {
  provider: "local" | "s3" | "d1";
  s3?: S3Config;
  d1?: D1Config;
}

export interface S3Config {
  endpoint: string; // S3-compatible endpoint (AWS, Azure, MinIO, etc.)
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string; // Optional folder prefix for charts
}

export interface D1Config {
  apiUrl: string; // Cloudflare Worker API URL
}
