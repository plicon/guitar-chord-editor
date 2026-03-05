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
        actions.addRowToSection(sectionId, 'chord-row', 4);
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
        actions.addRowToSection(sectionId, 'chord-row', 4);
        actions.addRowToSection(sectionId, 'chord-row', 4);
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
        actions.addRowToSection(sectionId, 'chord-row', 4);
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
        actions.addRowToSection(sectionId, 'chord-row', 4);
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

  describe("reorderChordsInRow", () => {
    it("should move a chord forward within the same row", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 4); });
      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => {
        ["G", "Am", "C", "F"].forEach((name, i) => {
          result.current[1].updateChord(sectionId, rowId, i, { ...createEmptyChord(`c${i}`), name });
        });
      });

      // Move G (index 0) to index 2 → [Am, C, G, F]
      act(() => { result.current[1].reorderChordsInRow(sectionId, rowId, 0, 2); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords.map(c => c.name)).toEqual(["Am", "C", "G", "F"]);
      }
    });

    it("should move a chord backward within the same row", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 4); });
      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => {
        ["G", "Am", "C", "F"].forEach((name, i) => {
          result.current[1].updateChord(sectionId, rowId, i, { ...createEmptyChord(`c${i}`), name });
        });
      });

      // Move F (index 3) to index 1 → [G, F, Am, C]
      act(() => { result.current[1].reorderChordsInRow(sectionId, rowId, 3, 1); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords.map(c => c.name)).toEqual(["G", "F", "Am", "C"]);
      }
    });

    it("should preserve the total number of chords after reorder", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 4); });
      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => { result.current[1].reorderChordsInRow(sectionId, rowId, 0, 3); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords).toHaveLength(4);
      }
    });

    it("should not affect other sections", () => {
      const { result } = renderHook(() => useSongState());

      act(() => {
        result.current[1].addSection("verse");
        result.current[1].addSection("chorus");
      });
      const [sec1Id, sec2Id] = result.current[0].sections.map(s => s.id);
      act(() => {
        result.current[1].addRowToSection(sec1Id, 'chord-row', 2);
        result.current[1].addRowToSection(sec2Id, 'chord-row', 2);
      });
      const row1Id = result.current[0].sections[0].rows[0].id;

      act(() => {
        result.current[1].updateChord(sec1Id, row1Id, 0, { ...createEmptyChord("c0"), name: "G" });
        result.current[1].updateChord(sec1Id, row1Id, 1, { ...createEmptyChord("c1"), name: "Am" });
      });

      act(() => { result.current[1].reorderChordsInRow(sec1Id, row1Id, 0, 1); });

      // Section 2's row should be untouched
      const sec2Row = result.current[0].sections[1].rows[0];
      if (sec2Row.kind === "chord-row") {
        expect(sec2Row.chords[0].name).toBe("");
        expect(sec2Row.chords[1].name).toBe("");
      }
    });
  });

  describe("duplicateChordInRow", () => {
    it("should replace the first empty slot after the source chord", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 4); });
      const rowId = result.current[0].sections[0].rows[0].id;

      // Row: [G, empty, empty, empty]
      act(() => {
        result.current[1].updateChord(sectionId, rowId, 0, { ...createEmptyChord("c0"), name: "G" });
      });

      act(() => { result.current[1].duplicateChordInRow(sectionId, rowId, 0); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords).toHaveLength(4);
        // First empty after index 0 (index 1) should now hold the duplicate
        expect(row.chords[0].name).toBe("G");
        expect(row.chords[1].name).toBe("G");
      }
    });

    it("should replace the first empty slot before the source when no empty follows", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 3); });
      const rowId = result.current[0].sections[0].rows[0].id;

      // Row: [empty, Am, C] — no empty after index 1, one before it
      act(() => {
        result.current[1].updateChord(sectionId, rowId, 1, { ...createEmptyChord("c1"), name: "Am" });
        result.current[1].updateChord(sectionId, rowId, 2, { ...createEmptyChord("c2"), name: "C" });
      });

      act(() => { result.current[1].duplicateChordInRow(sectionId, rowId, 1); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords).toHaveLength(3);
        // Empty at index 0 replaced with the duplicate of Am
        expect(row.chords[0].name).toBe("Am");
        expect(row.chords[1].name).toBe("Am");
        expect(row.chords[2].name).toBe("C");
      }
    });

    it("should insert after the source when all chords are edited and row has capacity", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 2); });
      const rowId = result.current[0].sections[0].rows[0].id;

      // Row: [G, Am] — both edited, room for one more
      act(() => {
        result.current[1].updateChord(sectionId, rowId, 0, { ...createEmptyChord("c0"), name: "G" });
        result.current[1].updateChord(sectionId, rowId, 1, { ...createEmptyChord("c1"), name: "Am" });
      });

      act(() => { result.current[1].duplicateChordInRow(sectionId, rowId, 0); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords).toHaveLength(3);
        expect(row.chords[0].name).toBe("G");
        expect(row.chords[1].name).toBe("G"); // inserted after source
        expect(row.chords[2].name).toBe("Am");
      }
    });

    it("should allow duplicating beyond 5 chords since there is no limit", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 5); });
      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => {
        ["G", "Am", "C", "F", "D"].forEach((name, i) => {
          result.current[1].updateChord(sectionId, rowId, i, { ...createEmptyChord(`c${i}`), name });
        });
      });

      act(() => { result.current[1].duplicateChordInRow(sectionId, rowId, 0); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords).toHaveLength(6);
        expect(row.chords[0].name).toBe("G");
        expect(row.chords[1].name).toBe("G"); // duplicate inserted after source
      }
    });

    it("should assign the duplicate a different id than the source", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 2); });
      const rowId = result.current[0].sections[0].rows[0].id;

      act(() => {
        result.current[1].updateChord(sectionId, rowId, 0, { ...createEmptyChord("c0"), name: "G" });
      });

      const sourceId = (() => {
        const r = result.current[0].sections[0].rows[0];
        return r.kind === "chord-row" ? r.chords[0].id : null;
      })();

      act(() => { result.current[1].duplicateChordInRow(sectionId, rowId, 0); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        expect(row.chords[1].id).not.toBe(sourceId);
      }
    });

    it("should copy all chord properties to the duplicate", () => {
      const { result } = renderHook(() => useSongState());

      act(() => { result.current[1].addSection("verse"); });
      const sectionId = result.current[0].sections[0].id;
      act(() => { result.current[1].addRowToSection(sectionId, 'chord-row', 2); });
      const rowId = result.current[0].sections[0].rows[0].id;

      const sourceChord = {
        ...createEmptyChord("c0"),
        name: "G",
        startFret: 3,
        fingers: [{ string: 1, fret: 3 }],
        mutedStrings: [6],
      };

      act(() => { result.current[1].updateChord(sectionId, rowId, 0, sourceChord); });
      act(() => { result.current[1].duplicateChordInRow(sectionId, rowId, 0); });

      const row = result.current[0].sections[0].rows[0];
      if (row.kind === "chord-row") {
        const dup = row.chords[1];
        expect(dup.name).toBe("G");
        expect(dup.startFret).toBe(3);
        expect(dup.fingers).toEqual([{ string: 1, fret: 3 }]);
        expect(dup.mutedStrings).toEqual([6]);
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
        result.current[1].addRowToSection(sectionId, 'chord-row', 4);
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

  describe("loadFromYouTubeResult with tab data", () => {
    it("should create tab rows from ASCII tab in YouTube result", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      const youtubeResult = {
        metadata: { videoId: "test123", title: "Test", author: "Author", description: "" },
        transcriptLength: 100,
        chart: {
          title: "Test Song",
          artist: "Test Artist",
          sections: [
            {
              name: "Intro Riff",
              type: "intro",
              chords: [] as string[],
              tab: [
                "e|---0---|",
                "B|---1---|",
                "G|---0---|",
                "D|---2---|",
                "A|---3---|",
                "E|-------|",
              ],
            },
          ],
        },
        provider: "test",
        model: "test",
        sourceUrl: "https://youtube.com/watch?v=test123",
      };

      act(() => {
        actions.loadFromYouTubeResult(youtubeResult);
      });

      const [state] = result.current;
      expect(state.sections).toHaveLength(1);
      expect(state.sections[0].name).toBe("Intro Riff");
      // Should have a tab row
      const tabRows = state.sections[0].rows.filter(r => r.kind === "tab-row");
      expect(tabRows.length).toBe(1);
      if (tabRows[0].kind === "tab-row") {
        expect(tabRows[0].measures.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should create both chord and tab rows when section has both", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      const youtubeResult = {
        metadata: { videoId: "test123", title: "Test", author: "Author", description: "" },
        transcriptLength: 100,
        chart: {
          title: "Test Song",
          sections: [
            {
              name: "Verse",
              type: "verse",
              chords: ["Am", "C"],
              tab: [
                "e|--0--|",
                "B|--1--|",
                "G|--0--|",
                "D|--2--|",
                "A|--3--|",
                "E|-----|",
              ],
            },
          ],
        },
        provider: "test",
        model: "test",
      };

      act(() => {
        actions.loadFromYouTubeResult(youtubeResult);
      });

      const [state] = result.current;
      expect(state.sections).toHaveLength(1);
      const chordRows = state.sections[0].rows.filter(r => r.kind === "chord-row");
      const tabRows = state.sections[0].rows.filter(r => r.kind === "tab-row");
      expect(chordRows.length).toBe(1);
      expect(tabRows.length).toBe(1);
    });

    it("should skip tab row when tab data has wrong number of lines", () => {
      const { result } = renderHook(() => useSongState());
      const [, actions] = result.current;

      const youtubeResult = {
        metadata: { videoId: "test123", title: "Test", author: "Author", description: "" },
        transcriptLength: 100,
        chart: {
          title: "Test Song",
          sections: [
            {
              name: "Bad Tab",
              type: "verse",
              chords: ["Am"],
              tab: ["e|--0--|", "B|--1--|"], // Only 2 lines, not 6
            },
          ],
        },
        provider: "test",
        model: "test",
      };

      act(() => {
        actions.loadFromYouTubeResult(youtubeResult);
      });

      const [state] = result.current;
      const tabRows = state.sections[0].rows.filter(r => r.kind === "tab-row");
      expect(tabRows.length).toBe(0);
    });
  });
});
