import { z } from "zod";
import { ChordChart } from "@/types/chordChart";

// Strumming pattern schemas
const strokeTypeSchema = z.enum(["up", "down", "rest"]).nullable();
const noteValueSchema = z.enum(["full", "half"]);
const beatTypeSchema = z.enum(["on", "off"]);

const strumBeatSchema = z.object({
  stroke: strokeTypeSchema,
  noteValue: noteValueSchema,
  beatType: beatTypeSchema,
});

const strummingPatternSchema = z.object({
  bars: z.number().int().min(1).max(16),
  beatsPerBar: z.number().int().min(1).max(8),
  timeSignature: z.enum(["4/4", "3/4", "6/8"]).default("4/4"),
  beats: z.array(strumBeatSchema).max(128),
}).transform((data) => {
  // Migration: add default timeSignature if missing
  if (!data.timeSignature) {
    return { ...data, timeSignature: "4/4" as const };
  }
  return data;
});

// Chord diagram schemas
const fingerPositionSchema = z.object({
  string: z.number().int().min(1).max(6),
  fret: z.number().int().min(0).max(24),
  finger: z.number().int().min(0).max(4).optional(),
});

const barreSchema = z.object({
  fret: z.number().int().min(1).max(24),
  fromString: z.number().int().min(1).max(6),
  toString: z.number().int().min(1).max(6),
  finger: z.number().int().min(0).max(4).optional(),
});

const fingerLabelSchema = z.object({
  string: z.number().int().min(1).max(6),
  finger: z.number().int().min(0).max(4),
});

const chordDiagramSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(50),
  frets: z.number().int().min(1).max(24),
  startFret: z.number().int().min(1).max(24),
  fingers: z.array(fingerPositionSchema).max(6),
  barres: z.array(barreSchema).max(6),
  mutedStrings: z.array(z.number().int().min(1).max(6)).max(6),
  openStrings: z.array(z.number().int().min(1).max(6)).max(6),
  fingerLabels: z.array(fingerLabelSchema).max(6),
});

// Main chart schema - all fields required to match ChordChart interface
export const chordChartSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(200),
  title: z.string().max(200),
  description: z.string().max(2000),
  chordsPerRow: z.number().int().min(1).max(12),
  rows: z.array(z.array(chordDiagramSchema).max(12)).max(50),
  rowSubtitles: z.array(z.string().max(200)).max(50),
  strummingPattern: strummingPatternSchema.nullable(),
  createdAt: z.string().max(50),
  updatedAt: z.string().max(50),
});

export const validateChartJson = (json: string): ChordChart => {
  // Parse JSON first (will throw if invalid JSON)
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Validate against schema
  const result = chordChartSchema.safeParse(parsed);
  
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(`Invalid chart data: ${firstError.path.join(".")} - ${firstError.message}`);
  }

  // The validated data matches ChordChart interface
  return result.data as ChordChart;
};
