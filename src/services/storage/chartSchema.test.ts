import { describe, it, expect } from "vitest";
import { validateChartJson, chordChartSchema } from "./chartSchema";

const validChart = {
  id: "chart-123",
  name: "Test Chart",
  title: "Test Title",
  description: "Test description",
  chordsPerRow: 4,
  rows: [
    [
      {
        id: "chord-1",
        name: "C",
        frets: 5,
        startFret: 1,
        fingers: [{ string: 2, fret: 1, finger: 1 }],
        barres: [],
        mutedStrings: [],
        openStrings: [1, 5],
        fingerLabels: [{ string: 2, finger: 1 }],
      },
    ],
  ],
  rowSubtitles: ["Verse"],
  strummingPattern: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("chartSchema", () => {
  describe("validateChartJson", () => {
    it("accepts valid chart JSON", () => {
      const json = JSON.stringify(validChart);
      const result = validateChartJson(json);
      expect(result.name).toBe("Test Chart");
      expect(result.rows).toHaveLength(1);
    });

    it("throws on invalid JSON syntax", () => {
      expect(() => validateChartJson("{ invalid json }")).toThrow(
        "Invalid JSON format"
      );
    });

    it("throws on missing required fields", () => {
      const incomplete = { id: "test" };
      expect(() => validateChartJson(JSON.stringify(incomplete))).toThrow(
        "Invalid chart data"
      );
    });

    it("throws on invalid field types", () => {
      const invalid = { ...validChart, chordsPerRow: "not a number" };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });

    it("throws on chordsPerRow exceeding maximum", () => {
      const invalid = { ...validChart, chordsPerRow: 100 };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });

    it("throws on invalid string number in finger position", () => {
      const invalid = {
        ...validChart,
        rows: [
          [
            {
              ...validChart.rows[0][0],
              fingers: [{ string: 10, fret: 1 }], // string must be 1-6
            },
          ],
        ],
      };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });

    it("throws on invalid stroke type in strumming pattern", () => {
      const invalid = {
        ...validChart,
        strummingPattern: {
          bars: 1,
          beatsPerBar: 4,
          beats: [{ stroke: "invalid", noteValue: "full", beatType: "on" }],
        },
      };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });

    it("accepts valid strumming pattern", () => {
      const withStrumming = {
        ...validChart,
        strummingPattern: {
          bars: 1,
          beatsPerBar: 4,
          subdivision: 2,
          timeSignature: "4/4",
          beats: [
            { stroke: "down", noteValue: "full", beatType: "on" },
            { stroke: null, noteValue: "full", beatType: "&" },
          ],
        },
      };
      const result = validateChartJson(JSON.stringify(withStrumming));
      expect(result.strummingPattern?.bars).toBe(1);
    });

    it("accepts null strumming pattern", () => {
      const result = validateChartJson(JSON.stringify(validChart));
      expect(result.strummingPattern).toBeNull();
    });

    it("throws on excessively long strings", () => {
      const invalid = { ...validChart, name: "a".repeat(300) };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });

    it("throws on negative fret values", () => {
      const invalid = {
        ...validChart,
        rows: [
          [
            {
              ...validChart.rows[0][0],
              startFret: -1,
            },
          ],
        ],
      };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });

    it("validates barre chord structure", () => {
      const withBarre = {
        ...validChart,
        rows: [
          [
            {
              ...validChart.rows[0][0],
              barres: [{ fret: 1, fromString: 1, toString: 6, finger: 1 }],
            },
          ],
        ],
      };
      const result = validateChartJson(JSON.stringify(withBarre));
      expect(result.rows[0][0].barres).toHaveLength(1);
    });

    it("throws on invalid barre structure", () => {
      const invalid = {
        ...validChart,
        rows: [
          [
            {
              ...validChart.rows[0][0],
              barres: [{ fret: 0, fromString: 1, toString: 6 }], // fret must be >= 1
            },
          ],
        ],
      };
      expect(() => validateChartJson(JSON.stringify(invalid))).toThrow(
        "Invalid chart data"
      );
    });
  });

  describe("chordChartSchema", () => {
    it("parses valid chart object", () => {
      const result = chordChartSchema.safeParse(validChart);
      expect(result.success).toBe(true);
    });

    it("fails on empty object", () => {
      const result = chordChartSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
