import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mock the API module before importing the hook
const mockGetStrummingPatterns = vi.fn();
const mockCreateStrummingPattern = vi.fn();
const mockUpdateStrummingPattern = vi.fn();
const mockDeleteStrummingPattern = vi.fn();

vi.mock("../services/presets/strummingApi", () => ({
  getStrummingPatterns: (...args: unknown[]) => mockGetStrummingPatterns(...args),
  createStrummingPattern: (...args: unknown[]) => mockCreateStrummingPattern(...args),
  updateStrummingPattern: (...args: unknown[]) => mockUpdateStrummingPattern(...args),
  deleteStrummingPattern: (...args: unknown[]) => mockDeleteStrummingPattern(...args),
}));

import { useStrummingPatterns, transformPresetToPattern, type BackendPreset } from "./useStrummingPatterns";

const MOCK_PRESET: BackendPreset = {
  id: "abc123",
  name: "Old Faithful (4/4)",
  description: "Classic pattern",
  pattern: {
    bars: 1,
    timeSignature: "4/4",
    subdivision: 2,
    pattern: ["down", null, "down", "up", null, "up", "down", null],
  },
};

const MOCK_PRESET_2: BackendPreset = {
  id: "def456",
  name: "Waltz Strum (3/4)",
  description: "Waltz pattern",
  pattern: {
    bars: 1,
    timeSignature: "3/4",
    subdivision: 2,
    pattern: ["down", null, "down", "up", "down", "up"],
  },
};

describe("useStrummingPatterns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches patterns on mount using the public endpoint", async () => {
    mockGetStrummingPatterns.mockResolvedValue({ data: [MOCK_PRESET] });

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toHaveLength(1);
    });

    expect(mockGetStrummingPatterns).toHaveBeenCalledOnce();
    // Should be called with no arguments (public endpoint, no admin flag)
    expect(mockGetStrummingPatterns).toHaveBeenCalledWith();
    expect(result.current.patterns[0].id).toBe("abc123");
  });

  it("handles paginated response format (data array)", async () => {
    mockGetStrummingPatterns.mockResolvedValue({
      data: [MOCK_PRESET, MOCK_PRESET_2],
      total: 2,
      limit: 100,
      offset: 0,
    });

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toHaveLength(2);
    });
  });

  it("handles plain array response format", async () => {
    mockGetStrummingPatterns.mockResolvedValue([MOCK_PRESET]);

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toHaveLength(1);
    });
  });

  it("sets empty array on fetch error", async () => {
    mockGetStrummingPatterns.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toEqual([]);
    });
  });

  it("creates a pattern and adds it to the list", async () => {
    mockGetStrummingPatterns.mockResolvedValue({ data: [] });
    const newPreset = { ...MOCK_PRESET, id: "new123" };
    mockCreateStrummingPattern.mockResolvedValue(newPreset);

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toEqual([]);
    });

    await act(async () => {
      await result.current.createPattern({ name: "Test", pattern: {} });
    });

    expect(mockCreateStrummingPattern).toHaveBeenCalledWith({ name: "Test", pattern: {} });
    expect(result.current.patterns).toHaveLength(1);
    expect(result.current.patterns[0].id).toBe("new123");
  });

  it("updates a pattern in the list", async () => {
    mockGetStrummingPatterns.mockResolvedValue({ data: [MOCK_PRESET] });
    const updated = { ...MOCK_PRESET, name: "Updated Name" };
    mockUpdateStrummingPattern.mockResolvedValue(updated);

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updatePattern("abc123", { name: "Updated Name" });
    });

    expect(mockUpdateStrummingPattern).toHaveBeenCalledWith("abc123", { name: "Updated Name" });
    expect(result.current.patterns[0].name).toBe("Updated Name");
  });

  it("deletes a pattern from the list", async () => {
    mockGetStrummingPatterns.mockResolvedValue({ data: [MOCK_PRESET, MOCK_PRESET_2] });
    mockDeleteStrummingPattern.mockResolvedValue(undefined);

    const { result } = renderHook(() => useStrummingPatterns());

    await waitFor(() => {
      expect(result.current.patterns).toHaveLength(2);
    });

    await act(async () => {
      await result.current.deletePattern("abc123");
    });

    expect(mockDeleteStrummingPattern).toHaveBeenCalledWith("abc123");
    expect(result.current.patterns).toHaveLength(1);
    expect(result.current.patterns[0].id).toBe("def456");
  });
});

describe("transformPresetToPattern", () => {
  it("converts a 4/4 preset to frontend pattern format", () => {
    const result = transformPresetToPattern(MOCK_PRESET);

    expect(result.bars).toBe(1);
    expect(result.beatsPerBar).toBe(4);
    expect(result.timeSignature).toBe("4/4");
    expect(result.subdivision).toBe(2);
    expect(result.beats).toHaveLength(8);
    expect(result.beats[0].stroke).toBe("down");
    expect(result.beats[1].stroke).toBeNull();
    expect(result.beats[0].noteValue).toBe("full");
  });

  it("converts a 3/4 preset correctly", () => {
    const result = transformPresetToPattern(MOCK_PRESET_2);

    expect(result.beatsPerBar).toBe(3);
    expect(result.timeSignature).toBe("3/4");
    expect(result.beats).toHaveLength(6);
  });

  it("handles 6/8 time signature with beatsPerBar = 6", () => {
    const preset: BackendPreset = {
      id: "six-eight",
      name: "6/8 Pattern",
      pattern: {
        bars: 1,
        timeSignature: "6/8",
        subdivision: 3,
        pattern: Array(18).fill(null),
      },
    };

    const result = transformPresetToPattern(preset);
    expect(result.beatsPerBar).toBe(6);
    expect(result.subdivision).toBe(3);
  });
});
