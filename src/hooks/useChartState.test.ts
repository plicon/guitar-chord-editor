import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChartState } from "@/hooks/useChartState";

// Mock the storage service
vi.mock("@/services/storage", () => ({
  saveChart: vi.fn().mockResolvedValue(undefined),
  loadChart: vi.fn().mockResolvedValue(null),
  downloadChartAsJson: vi.fn(),
  importChartFromJson: vi.fn((json) => JSON.parse(json)),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useChartState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useChartState());
      const [state] = result.current;

      expect(state.title).toBe("My Chord Chart");
      expect(state.description).toBe("");
      expect(state.chordsPerRow).toBe(4);
      expect(state.rows).toHaveLength(1);
      expect(state.rows[0]).toHaveLength(4);
      expect(state.rowSubtitles).toEqual([""]);
      expect(state.strummingPattern).toBeNull();
      expect(state.isSaving).toBe(false);
      expect(state.currentChartId).toBeNull();
    });

    it("should initialize rows with empty chords", () => {
      const { result } = renderHook(() => useChartState());
      const [state] = result.current;

      state.rows[0].forEach((chord) => {
        expect(chord.name).toBe("");
        expect(chord.fingers).toEqual([]);
        expect(chord.barres).toEqual([]);
      });
    });
  });

  describe("setTitle", () => {
    it("should update the title", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].setTitle("New Title");
      });

      expect(result.current[0].title).toBe("New Title");
    });
  });

  describe("setDescription", () => {
    it("should update the description", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].setDescription("My description");
      });

      expect(result.current[0].description).toBe("My description");
    });
  });

  describe("handleChordsPerRowChange", () => {
    it("should increase chords per row", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].handleChordsPerRowChange(5);
      });

      expect(result.current[0].chordsPerRow).toBe(5);
      expect(result.current[0].rows[0]).toHaveLength(5);
    });

    it("should decrease chords per row", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].handleChordsPerRowChange(2);
      });

      expect(result.current[0].chordsPerRow).toBe(2);
      expect(result.current[0].rows[0]).toHaveLength(2);
    });

    it("should not allow less than 1 chord per row", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].handleChordsPerRowChange(0);
      });

      expect(result.current[0].chordsPerRow).toBe(4); // unchanged
    });

    it("should not allow more than 5 chords per row", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].handleChordsPerRowChange(6);
      });

      expect(result.current[0].chordsPerRow).toBe(4); // unchanged
    });
  });

  describe("addRow", () => {
    it("should add a new row", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].addRow();
      });

      expect(result.current[0].rows).toHaveLength(2);
      expect(result.current[0].rowSubtitles).toHaveLength(2);
    });

    it("should add row with correct number of chords", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].handleChordsPerRowChange(3);
      });

      act(() => {
        result.current[1].addRow();
      });

      expect(result.current[0].rows[1]).toHaveLength(3);
    });
  });

  describe("removeRow", () => {
    it("should remove a row", () => {
      const { result } = renderHook(() => useChartState());

      // Add a row first
      act(() => {
        result.current[1].addRow();
      });

      expect(result.current[0].rows).toHaveLength(2);

      // Remove the first row
      act(() => {
        result.current[1].removeRow(0);
      });

      expect(result.current[0].rows).toHaveLength(1);
    });

    it("should not remove the last row", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].removeRow(0);
      });

      expect(result.current[0].rows).toHaveLength(1);
    });
  });

  describe("handleRowSubtitleChange", () => {
    it("should update a row subtitle", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].handleRowSubtitleChange(0, "Verse 1");
      });

      expect(result.current[0].rowSubtitles[0]).toBe("Verse 1");
    });
  });

  describe("handleSaveChord", () => {
    it("should update a chord in the grid", () => {
      const { result } = renderHook(() => useChartState());

      const newChord = {
        ...result.current[0].rows[0][0],
        name: "Am",
        fingers: [{ string: 1, fret: 1 }],
      };

      act(() => {
        result.current[1].handleSaveChord(newChord, 0, 0);
      });

      expect(result.current[0].rows[0][0].name).toBe("Am");
      expect(result.current[0].rows[0][0].fingers).toEqual([{ string: 1, fret: 1 }]);
    });
  });

  describe("handleNewChart", () => {
    it("should reset all state to defaults", () => {
      const { result } = renderHook(() => useChartState());

      // Modify state
      act(() => {
        result.current[1].setTitle("Custom Title");
        result.current[1].setDescription("Custom description");
        result.current[1].addRow();
      });

      // Reset
      act(() => {
        result.current[1].handleNewChart();
      });

      expect(result.current[0].title).toBe("My Chord Chart");
      expect(result.current[0].description).toBe("");
      expect(result.current[0].rows).toHaveLength(1);
    });
  });

  describe("hasEditedChords", () => {
    it("should return false when no chords are edited", () => {
      const { result } = renderHook(() => useChartState());

      expect(result.current[1].hasEditedChords).toBe(false);
    });

    it("should return true when a chord has a name", () => {
      const { result } = renderHook(() => useChartState());

      const editedChord = {
        ...result.current[0].rows[0][0],
        name: "C",
      };

      act(() => {
        result.current[1].handleSaveChord(editedChord, 0, 0);
      });

      expect(result.current[1].hasEditedChords).toBe(true);
    });

    it("should return true when a chord has finger positions", () => {
      const { result } = renderHook(() => useChartState());

      const editedChord = {
        ...result.current[0].rows[0][0],
        fingers: [{ string: 1, fret: 2 }],
      };

      act(() => {
        result.current[1].handleSaveChord(editedChord, 0, 0);
      });

      expect(result.current[1].hasEditedChords).toBe(true);
    });
  });

  describe("getCurrentChart", () => {
    it("should return current chart object", () => {
      const { result } = renderHook(() => useChartState());

      act(() => {
        result.current[1].setTitle("Test Chart");
        result.current[1].setDescription("Test description");
      });

      const chart = result.current[1].getCurrentChart();

      expect(chart.title).toBe("Test Chart");
      expect(chart.description).toBe("Test description");
      expect(chart.chordsPerRow).toBe(4);
      expect(chart.rows).toHaveLength(1);
    });
  });

  describe("setStrummingPattern", () => {
    it("should set strumming pattern", () => {
      const { result } = renderHook(() => useChartState());

      const pattern = {
        bars: 1,
        beatsPerBar: 4,
        beats: [
          { stroke: "down" as const, noteValue: "full" as const, beatType: "on" as const },
        ],
      };

      act(() => {
        result.current[1].setStrummingPattern(pattern);
      });

      expect(result.current[0].strummingPattern).toEqual(pattern);
    });

    it("should clear strumming pattern when set to null", () => {
      const { result } = renderHook(() => useChartState());

      const pattern = {
        bars: 1,
        beatsPerBar: 4,
        beats: [
          { stroke: "down" as const, noteValue: "full" as const, beatType: "on" as const },
        ],
      };

      act(() => {
        result.current[1].setStrummingPattern(pattern);
      });

      act(() => {
        result.current[1].setStrummingPattern(null);
      });

      expect(result.current[0].strummingPattern).toBeNull();
    });
  });
});
