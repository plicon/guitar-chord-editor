import { ChordChart, ChordChartMetadata } from "@/types/chordChart";
import { StorageProvider, S3Config } from "./types";

/**
 * S3-compatible storage provider
 * Works with AWS S3, Azure Blob (via S3 API), MinIO, Backblaze B2, etc.
 * 
 * Note: This is a basic implementation using fetch.
 * For production use with large files, consider using the AWS SDK.
 */
export class S3StorageProvider implements StorageProvider {
  name = "s3";
  private config: S3Config;
  private prefix: string;

  constructor(config: S3Config) {
    this.config = config;
    this.prefix = config.prefix || "chord-charts";
  }

  async isAvailable(): Promise<boolean> {
    // Check if credentials are configured
    return !!(
      this.config.endpoint &&
      this.config.bucket &&
      this.config.accessKeyId &&
      this.config.secretAccessKey
    );
  }

  private getObjectKey(id: string): string {
    return `${this.prefix}/${id}.json`;
  }

  private getMetadataKey(): string {
    return `${this.prefix}/_metadata.json`;
  }

  private async signRequest(
    method: string,
    path: string,
    headers: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    // For a full implementation, use AWS Signature V4
    // This is a simplified version - in production, use aws4 or similar library
    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    
    return {
      ...headers,
      "x-amz-date": date,
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      Authorization: `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${date.slice(0, 8)}/${this.config.region}/s3/aws4_request`,
    };
  }

  private getEndpointUrl(key: string): string {
    const endpoint = this.config.endpoint.replace(/\/$/, "");
    return `${endpoint}/${this.config.bucket}/${key}`;
  }

  async saveChart(chart: ChordChart): Promise<void> {
    const key = this.getObjectKey(chart.id);
    const url = this.getEndpointUrl(key);
    const body = JSON.stringify(chart);

    const headers = await this.signRequest("PUT", key, {
      "Content-Type": "application/json",
    });

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to save chart: ${response.statusText}`);
    }

    // Update metadata index
    await this.updateMetadataIndex(chart);
  }

  async loadChart(id: string): Promise<ChordChart | null> {
    const key = this.getObjectKey(id);
    const url = this.getEndpointUrl(key);

    const headers = await this.signRequest("GET", key);

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to load chart: ${response.statusText}`);
      }
      return await response.json();
    } catch {
      return null;
    }
  }

  async listCharts(): Promise<ChordChartMetadata[]> {
    const key = this.getMetadataKey();
    const url = this.getEndpointUrl(key);

    const headers = await this.signRequest("GET", key);

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to list charts: ${response.statusText}`);
      }
      const metadata = await response.json();
      return metadata.charts || [];
    } catch {
      return [];
    }
  }

  async deleteChart(id: string): Promise<void> {
    const key = this.getObjectKey(id);
    const url = this.getEndpointUrl(key);

    const headers = await this.signRequest("DELETE", key);

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete chart: ${response.statusText}`);
    }

    // Update metadata index
    await this.removeFromMetadataIndex(id);
  }

  private async updateMetadataIndex(chart: ChordChart): Promise<void> {
    const charts = await this.listCharts();
    const existingIndex = charts.findIndex((c) => c.id === chart.id);
    
    const metadata: ChordChartMetadata = {
      id: chart.id,
      name: chart.name,
      title: chart.title,
      updatedAt: chart.updatedAt,
    };

    if (existingIndex >= 0) {
      charts[existingIndex] = metadata;
    } else {
      charts.push(metadata);
    }

    // Sort by updatedAt descending
    charts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const key = this.getMetadataKey();
    const url = this.getEndpointUrl(key);
    const headers = await this.signRequest("PUT", key, {
      "Content-Type": "application/json",
    });

    await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ charts }),
    });
  }

  private async removeFromMetadataIndex(id: string): Promise<void> {
    const charts = await this.listCharts();
    const filtered = charts.filter((c) => c.id !== id);

    const key = this.getMetadataKey();
    const url = this.getEndpointUrl(key);
    const headers = await this.signRequest("PUT", key, {
      "Content-Type": "application/json",
    });

    await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ charts: filtered }),
    });
  }
}
