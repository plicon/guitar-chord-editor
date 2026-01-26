import { S3Config } from "@/services/storage/types";

// Application configuration
// Modify these values to customize branding and URLs

export interface StorageConfig {
  provider: "local" | "s3";
  s3?: S3Config;
}

// Helper to safely get storage configuration from environment variables
const getStorageConfig = (): StorageConfig => {
  const provider = (import.meta.env.VITE_STORAGE_PROVIDER || "local") as "local" | "s3";
  
  if (provider === "s3") {
    const endpoint = import.meta.env.VITE_S3_ENDPOINT;
    const bucket = import.meta.env.VITE_S3_BUCKET;
    const region = import.meta.env.VITE_S3_REGION;
    const accessKeyId = import.meta.env.VITE_S3_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY;
    
    // Validate required S3 credentials are present
    if (!endpoint || !bucket || !region || !accessKeyId || !secretAccessKey) {
      console.warn(
        "S3 storage selected but missing required environment variables. Falling back to localStorage."
      );
      return { provider: "local" };
    }
    
    return {
      provider: "s3",
      s3: {
        endpoint,
        bucket,
        region,
        accessKeyId,
        secretAccessKey,
        prefix: import.meta.env.VITE_S3_PREFIX || "chord-charts",
      },
    };
  }
  
  return { provider: "local" };
};

export const APP_CONFIG = {
  // App name displayed in watermark
  appName: "Guitar Chord Creator",
  
  // URL displayed at the bottom right of each row in the printable output
  rowUrl: "chordcreator.app",
  
  // Toggle visibility of watermark and URL
  showWatermark: true,
  showRowUrl: true,

  // Storage configuration
  // Configured via environment variables (see .env.example)
  storage: getStorageConfig(),
} as const;
