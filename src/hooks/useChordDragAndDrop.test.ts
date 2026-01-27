import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChordDragAndDrop } from "@/hooks/useChordDragAndDrop";
import { ChordDiagram, createEmptyChord } from "@/types/chord";

// Create mock events that satisfy the dnd-kit type requirements
const createMockDragStartEvent = (activeId: string) => ({
  active: { id: activeId },
  activatorEvent: new MouseEvent("mousedown"),
});

const createMockDragOverEvent = (activeId: string, overId: string | null) => ({
  active: { id: activeId },
  over: overId ? { id: overId } : null,
  activatorEvent: new MouseEvent("mousemove"),
  collisions: [],
  delta: { x: 0, y: 0 },
});

// Mock @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  useSensor: vi.fn((sensor, options) => ({ sensor, options })),
  useSensors: vi.fn((...sensors) => sensors),
  PointerSensor: "PointerSensor",
}));

describe("useChordDragAndDrop", () => {
  const createTestRows = (): ChordDiagram[][] => [
    [
      { ...createEmptyChord("chord-1"), name: "Am" },
      { ...createEmptyChord("chord-2"), name: "C" },
      { ...createEmptyChord("chord-3"), name: "G" },
      { ...createEmptyChord("chord-4"), name: "F" },
    ],
    [
      { ...createEmptyChord("chord-5"), name: "Dm" },
      { ...createEmptyChord("chord-6"), name: "E" },
      { ...createEmptyChord("chord-7"), name: "" },
      { ...createEmptyChord("chord-8"), name: "" },
    ],
  ];

  let mockOnRowsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnRowsChange = vi.fn();
  });

  describe("initialization", () => {
    it("should initialize with null activeChord", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      expect(result.current.activeChord).toBeNull();
    });

    it("should provide sensors", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      expect(result.current.sensors).toBeDefined();
      expect(Array.isArray(result.current.sensors)).toBe(true);
    });

    it("should provide drag handlers", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      expect(typeof result.current.handleDragStart).toBe("function");
      expect(typeof result.current.handleDragOver).toBe("function");
      expect(typeof result.current.handleDragEnd).toBe("function");
    });
  });

  describe("handleDragStart", () => {
    it("should set activeChord when drag starts", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragStart(createMockDragStartEvent("chord-1") as any);
      });

      expect(result.current.activeChord).not.toBeNull();
      expect(result.current.activeChord?.name).toBe("Am");
    });

    it("should not set activeChord for non-existent chord", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragStart(createMockDragStartEvent("non-existent") as any);
      });

      expect(result.current.activeChord).toBeNull();
    });
  });

  describe("handleDragEnd", () => {
    it("should clear activeChord when drag ends", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      // Start drag
      act(() => {
        result.current.handleDragStart(createMockDragStartEvent("chord-1") as any);
      });

      expect(result.current.activeChord).not.toBeNull();

      // End drag
      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.activeChord).toBeNull();
    });
  });

  describe("handleDragOver - same row reordering", () => {
    it("should reorder chords within the same row", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragOver(createMockDragOverEvent("chord-1", "chord-3") as any);
      });

      expect(mockOnRowsChange).toHaveBeenCalled();
      const newRows = mockOnRowsChange.mock.calls[0][0];
      
      // chord-1 (Am) should now be at index 2 (after C, G)
      expect(newRows[0][0].name).toBe("C");
      expect(newRows[0][1].name).toBe("G");
      expect(newRows[0][2].name).toBe("Am");
    });

    it("should not call onRowsChange when dragging over itself", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragOver(createMockDragOverEvent("chord-1", "chord-1") as any);
      });

      expect(mockOnRowsChange).not.toHaveBeenCalled();
    });

    it("should not call onRowsChange when over is null", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragOver(createMockDragOverEvent("chord-1", null) as any);
      });

      expect(mockOnRowsChange).not.toHaveBeenCalled();
    });
  });

  describe("handleDragOver - cross-row movement", () => {
    it("should move chord to another row with empty slot", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      // Move chord-1 (Am) to row 2 (which has empty slots)
      act(() => {
        result.current.handleDragOver(createMockDragOverEvent("chord-1", "chord-5") as any);
      });

      expect(mockOnRowsChange).toHaveBeenCalled();
      const newRows = mockOnRowsChange.mock.calls[0][0];
      
      // Row 1 should have one less edited chord (replaced with empty)
      // Row 2 should now contain Am in an empty slot
      const row2Names = newRows[1].map((c: ChordDiagram) => c.name);
      expect(row2Names).toContain("Am");
    });
  });

  describe("handleDragOver - row droppable", () => {
    it("should handle dropping on row droppable area", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragOver(createMockDragOverEvent("chord-1", "row-1") as any);
      });

      expect(mockOnRowsChange).toHaveBeenCalled();
    });

    it("should not move to same row via row droppable", () => {
      const rows = createTestRows();
      const { result } = renderHook(() =>
        useChordDragAndDrop(rows, mockOnRowsChange)
      );

      act(() => {
        result.current.handleDragOver(createMockDragOverEvent("chord-1", "row-0") as any);
      });

      // Should not call onRowsChange since it's the same row
      expect(mockOnRowsChange).not.toHaveBeenCalled();
    });
  });

  describe("hook updates with new rows", () => {
    it("should work with updated rows prop", () => {
      const rows1 = createTestRows();
      const { result, rerender } = renderHook(
        ({ rows }) => useChordDragAndDrop(rows, mockOnRowsChange),
        { initialProps: { rows: rows1 } }
      );

      // Create new rows with different content
      const rows2: ChordDiagram[][] = [
        [
          { ...createEmptyChord("new-1"), name: "D" },
          { ...createEmptyChord("new-2"), name: "A" },
        ],
      ];

      rerender({ rows: rows2 });

      // Start drag with new chord
      act(() => {
        result.current.handleDragStart(createMockDragStartEvent("new-1") as any);
      });

      expect(result.current.activeChord?.name).toBe("D");
    });
  });
});
