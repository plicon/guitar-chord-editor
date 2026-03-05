import { describe, it, expect } from "vitest";
import { parseAsciiTab } from "./tabParser";

describe("parseAsciiTab", () => {
  it("returns empty array for insufficient lines", () => {
    expect(parseAsciiTab([])).toEqual([]);
    expect(parseAsciiTab(["e|---"])).toEqual([]);
    expect(parseAsciiTab(["e|---", "B|---", "G|---"])).toEqual([]); // 3 lines too few
  });

  it("pads 4-line tab to 6 lines", () => {
    const lines = [
      "e|---0---|",
      "B|---1---|",
      "G|---0---|",
      "D|---2---|",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures.length).toBeGreaterThanOrEqual(1);
    const allColumns = measures.flatMap(m => m.columns);
    expect(allColumns.some(col => col.strings[0].fret === 0)).toBe(true);
    // Padded strings should have no fret data
    expect(allColumns.every(col => col.strings[4].fret === null && col.strings[5].fret === null)).toBe(true);
  });

  it("pads 5-line tab to 6 lines", () => {
    const lines = [
      "e|---3---|",
      "B|-------|",
      "G|-------|",
      "D|-------|",
      "A|---0---|",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures.length).toBeGreaterThanOrEqual(1);
    const allColumns = measures.flatMap(m => m.columns);
    expect(allColumns.some(col => col.strings[0].fret === 3)).toBe(true);
  });

  it("parses simple single-note tab", () => {
    const lines = [
      "e|---0---|",
      "B|-------|",
      "G|-------|",
      "D|-------|",
      "A|-------|",
      "E|-------|",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures.length).toBeGreaterThanOrEqual(1);
    // Should have a column with fret 0 on the high E string
    const allColumns = measures.flatMap(m => m.columns);
    const hasHighE = allColumns.some(col => col.strings[0].fret === 0);
    expect(hasHighE).toBe(true);
  });

  it("parses multiple notes across strings", () => {
    const lines = [
      "e|---0---|",
      "B|---1---|",
      "G|---0---|",
      "D|---2---|",
      "A|---3---|",
      "E|-------|",
    ];
    const measures = parseAsciiTab(lines);
    const allColumns = measures.flatMap(m => m.columns);
    // Should have a column where multiple strings have fret values
    const chordColumn = allColumns.find(
      col => col.strings[0].fret === 0 && col.strings[1].fret === 1
    );
    expect(chordColumn).toBeDefined();
  });

  it("parses two-digit fret numbers", () => {
    const lines = [
      "e|--12---|",
      "B|-------|",
      "G|-------|",
      "D|-------|",
      "A|-------|",
      "E|-------|",
    ];
    const measures = parseAsciiTab(lines);
    const allColumns = measures.flatMap(m => m.columns);
    const has12 = allColumns.some(col => col.strings[0].fret === 12);
    expect(has12).toBe(true);
  });

  it("parses techniques like hammer-on", () => {
    const lines = [
      "e|--0h2--|",
      "B|-------|",
      "G|-------|",
      "D|-------|",
      "A|-------|",
      "E|-------|",
    ];
    const measures = parseAsciiTab(lines);
    const allColumns = measures.flatMap(m => m.columns);
    const hammerNote = allColumns.find(
      col => col.strings[0].fret === 0 && col.strings[0].technique === 'h'
    );
    expect(hammerNote).toBeDefined();
  });

  it("parses multiple measures separated by pipes", () => {
    const lines = [
      "e|--0--|--3--|",
      "B|-----|-----|",
      "G|-----|-----|",
      "D|-----|-----|",
      "A|-----|-----|",
      "E|-----|-----|",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures.length).toBe(2);
  });

  it("handles lines without string label prefix", () => {
    const lines = [
      "---0---",
      "-------",
      "-------",
      "-------",
      "-------",
      "-------",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures.length).toBeGreaterThanOrEqual(1);
    const allColumns = measures.flatMap(m => m.columns);
    expect(allColumns.some(col => col.strings[0].fret === 0)).toBe(true);
  });

  it("returns measures with timeSignature 4/4", () => {
    const lines = [
      "e|--0--|",
      "B|-----|",
      "G|-----|",
      "D|-----|",
      "A|-----|",
      "E|-----|",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures[0].timeSignature).toBe("4/4");
  });

  it("handles all-empty tab gracefully", () => {
    const lines = [
      "e|------|",
      "B|------|",
      "G|------|",
      "D|------|",
      "A|------|",
      "E|------|",
    ];
    const measures = parseAsciiTab(lines);
    // Should return empty or measures with fallback columns
    expect(measures).toBeDefined();
  });

  it("parses a realistic riff", () => {
    const lines = [
      "e|-----0-----0---|",
      "B|---1---1-3---1-|",
      "G|-0-------0-----|",
      "D|---------------|",
      "A|---------------|",
      "E|---------------|",
    ];
    const measures = parseAsciiTab(lines);
    expect(measures.length).toBeGreaterThanOrEqual(1);
    const totalNotes = measures
      .flatMap(m => m.columns)
      .flatMap(c => c.strings)
      .filter(n => n.fret !== null).length;
    expect(totalNotes).toBeGreaterThanOrEqual(5);
  });
});
