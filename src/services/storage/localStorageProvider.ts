import { ChordChart, ChordChartMetadata } from "@/types/chordChart";
import { StorageProvider } from "./types";

const STORAGE_KEY = "chord-charts";

export class LocalStorageProvider implements StorageProvider {
  name = "localStorage";

  async isAvailable(): Promise<boolean> {
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return true;
    } catch {
      return false;
    }
  }

  private getCharts(): Record<string, ChordChart> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setCharts(charts: Record<string, ChordChart>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  }

  async saveChart(chart: ChordChart): Promise<void> {
    const charts = this.getCharts();
    charts[chart.id] = {
      ...chart,
      updatedAt: new Date().toISOString(),
    };
    this.setCharts(charts);
  }

  async loadChart(id: string): Promise<ChordChart | null> {
    const charts = this.getCharts();
    return charts[id] || null;
  }

  async listCharts(): Promise<ChordChartMetadata[]> {
    const charts = this.getCharts();
    return Object.values(charts)
      .map((chart) => ({
        id: chart.id,
        name: chart.name,
        title: chart.title,
        updatedAt: chart.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async deleteChart(id: string): Promise<void> {
    const charts = this.getCharts();
    delete charts[id];
    this.setCharts(charts);
  }
}
