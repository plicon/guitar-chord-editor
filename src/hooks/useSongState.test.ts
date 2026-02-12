import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useSongState } from "./useSongState";
import { createEmptyChord } from "@/types/chord";
import { SectionType } from "@/types/song";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useSongState", () => {
  let localStorageMock: Storage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a fresh localStorage mock for each test
    localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup(); // Cleanup React hooks
  });

  describe("Initial State", () => {
    it("should initialize with default song values", () => {
      const { result } = renderHook(() => useSongState());
      const [state] = result.current;

      expect(state.title).toBe("My Song");
      expect(state.artist).toBe("");
      expect(state.description).toBe("");
      expect(state.sections).toEqual([]);
      expect(state.strummingPattern).toBeNull();
      expect(state.isSaving).toBe(false);
    });
  });

  describe("Metadata Updates", () => {
    it("should update title", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.setTitle("Test Song");
      });

      expect(result.current[0].title).toBe("Test Song");
    });

    it("should update artist", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.setArtist("John Doe");
      });

      expect(result.current[0].artist).toBe("John Doe");
    });

    it("should update description", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.setDescription("A great song");
      });

      expect(result.current[0].description).toBe("A great song");
    });

    it("should update key", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.setKey("G");
      });

      expect(result.current[0].key).toBe("G");
    });

    it("should update tempo", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.setTempo(120);
      });

      expect(result.current[0].tempo).toBe(120);
    });
  });

  describe("Section Management", () => {
    it("should add a section", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const [state] = result.current;
      expect(state.sections).toHaveLength(1);
      expect(state.sections[0].type).toBe("verse");
      expect(state.sections[0].name).toBe("Verse");
    });

    it("should add multiple sections", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("intro");
        actions.addSection("verse");
        actions.addSection("chorus");
      });

      const [state] = result.current;
      expect(state.sections).toHaveLength(3);
      expect(state.sections[0].type).toBe("intro");
      expect(state.sections[1].type).toBe("verse");
      expect(state.sections[2].type).toBe("chorus");
    });

    it("should remove a section", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
        actions.addSection("chorus");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        actions.removeSection(sectionId);
      });

      expect(result.current[0].sections).toHaveLength(1);
      expect(result.current[0].sections[0].type).toBe("chorus");
    });

    it("should update section name", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        actions.updateSection(sectionId, { name: "Verse 1" });
      });

      expect(result.current[0].sections[0].name).toBe("Verse 1");
    });

    it("should toggle section collapsed state", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;
      const initialCollapsed = result.current[0].sections[0].collapsed;

      act(() => {
        actions.toggleSectionCollapsed(sectionId);
      });

      expect(result.current[0].sections[0].collapsed).toBe(!initialCollapsed);
    });

    it("should move section", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("intro");
        actions.addSection("verse");
        actions.addSection("chorus");
      });

      act(() => {
        actions.moveSection(0, 2); // Move intro to end
      });

      const [state] = result.current;
      expect(state.sections[0].type).toBe("verse");
      expect(state.sections[1].type).toBe("chorus");
      expect(state.sections[2].type).toBe("intro");
    });
  });

  describe("Row Management", () => {
    it("should add row to section", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        actions.addRowToSection(sectionId, 4);
      });

      const section = result.current[0].sections[0];
      expect(section.rows).toHaveLength(1);
      expect(section.rows[0].kind).toBe("chord-row");
      if (section.rows[0].kind === "chord-row") {
        expect(section.rows[0].chords).toHaveLength(4);
      }
    });

    it("should remove row from section", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        actions.addRowToSection(sectionId, 4);
        actions.addRowToSection(sectionId, 4);
      });

      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => {
        actions.removeRowFromSection(sectionId, rowId);
      });

      expect(result.current[0].sections[0].rows).toHaveLength(1);
    });

    it("should update row subtitle", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        actions.addRowToSection(sectionId, 4);
      });

      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => {
        actions.updateRowInSection(sectionId, rowId, { subtitle: "2x" });
      });

      const row = result.current[0].sections[0].rows[0];
      expect(row.subtitle).toBe("2x");
    });
  });

  describe("Chord Management", () => {
    it("should update chord in section row", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        actions.addRowToSection(sectionId, 4);
      });

      const rowId = result.current[0].sections[0].rows[0].id;
      const newChord = createEmptyChord("test-chord");
      newChord.name = "G";

      act(() => {
        actions.updateChord(sectionId, rowId, 0, newChord);
      });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords[0].name).toBe("G");
      }
    });
  });

  describe("getCurrentSong", () => {
    it("should return complete song object", () => {
      const { result } = renderHook(() => useSongState());

      act(() => {
        result.current[1].setTitle("Test Song");
        result.current[1].setArtist("Test Artist");
        result.current[1].addSection("verse");
      });

      const song = result.current[1].getCurrentSong();

      expect(song.title).toBe("Test Song");
      expect(song.artist).toBe("Test Artist");
      expect(song.sections).toHaveLength(1);
    });
  });

  describe("hasEditedContent", () => {
    it("should be false when no sections exist", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      expect(actions.hasEditedContent).toBe(false);
    });

    it("should be false when sections have no rows", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.addSection("verse");
      });

      expect(actions.hasEditedContent).toBe(false);
    });

    it("should be true when section has rows with chords", () => {
      const { result } = renderHook(() => useSongState());

      act(() => {
        result.current[1].addSection("verse");
      });

      const sectionId = result.current[0].sections[0].id;

      act(() => {
        result.current[1].addRowToSection(sectionId, 4);
      });

      const rowId = result.current[0].sections[0].rows[0].id;
      const newChord = createEmptyChord("test-chord");
      newChord.name = "G";

      act(() => {
        result.current[1].updateChord(sectionId, rowId, 0, newChord);
      });

      expect(result.current[1].hasEditedContent).toBe(true);
    });
  });

  describe("handleNewSong", () => {
    it("should reset to initial state", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      act(() => {
        actions.setTitle("Test Song");
        actions.addSection("verse");
      });

      act(() => {
        actions.handleNewSong();
      });

      const [state] = result.current;
      expect(state.title).toBe("Untitled Song");
      expect(state.sections).toHaveLength(1); // handleNewSong creates an initial verse section
      expect(state.sections[0].type).toBe("verse");
    });
  });
});
