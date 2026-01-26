import { ChordDiagram } from "./chord";
import { StrummingPattern } from "./strumming";

export interface ChordChart {
  id: string;
  name: string;
  title: string;
  description: string;
  chordsPerRow: number;
  rows: ChordDiagram[][];
  rowSubtitles: string[];
  strummingPattern: StrummingPattern | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChordChartMetadata {
  id: string;
  name: string;
  title: string;
  updatedAt: string;
}

export const createChordChart = (
  title: string,
  description: string,
  chordsPerRow: number,
  rows: ChordDiagram[][],
  rowSubtitles: string[],
  strummingPattern: StrummingPattern | null
): ChordChart => {
  const now = new Date().toISOString();
  return {
    id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: title || "Untitled Chart",
    title,
    description,
    chordsPerRow,
    rows,
    rowSubtitles,
    strummingPattern,
    createdAt: now,
    updatedAt: now,
  };
};
