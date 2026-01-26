import { S3Config } from "@/services/storage/types";

// Application configuration
// Modify these values to customize branding and URLs

export interface StorageConfig {
  provider: "local" | "s3";
  s3?: S3Config;
}

export const APP_CONFIG = {
  // App name displayed in watermark
  appName: "Guitar Chord Creator",
  
  // URL displayed at the bottom right of each row in the printable output
  rowUrl: "chordcreator.app",
  
  // Toggle visibility of watermark and URL
  showWatermark: true,
  showRowUrl: true,

  // Storage configuration
  // Options: "local" (browser localStorage) or "s3" (S3-compatible storage)
  storage: {
    provider: "local" as const,
    
    // S3-compatible storage configuration (AWS S3, Azure Blob, MinIO, etc.)
    // Uncomment and configure these settings to use cloud storage
    // s3: {
    //   endpoint: "https://s3.amazonaws.com", // or MinIO/Azure endpoint
    //   bucket: "my-chord-charts",
    //   region: "us-east-1",
    //   accessKeyId: "YOUR_ACCESS_KEY",
    //   secretAccessKey: "YOUR_SECRET_KEY",
    //   prefix: "chord-charts", // optional folder prefix
    // },
  } as StorageConfig,
} as const;
