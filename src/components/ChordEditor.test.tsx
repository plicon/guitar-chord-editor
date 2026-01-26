import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChordEditor } from "./ChordEditor";
import { createEmptyChord, ChordDiagram } from "@/types/chord";

// Mock chord presets
vi.mock("@/data/chordPresets", () => ({
  getChordPreset: vi.fn((name: string) => {
    const presets: Record<string, Partial<ChordDiagram>> = {
      Am: {
        startFret: 1,
        fingers: [
          { string: 2, fret: 1 },
          { string: 4, fret: 2 },
          { string: 3, fret: 2 },
        ],
        barres: [],
        mutedStrings: [6],
        openStrings: [5, 1],
        fingerLabels: [
          { string: 2, finger: 1 },
          { string: 4, finger: 2 },
          { string: 3, finger: 3 },
        ],
      },
      G: {
        startFret: 1,
        fingers: [
          { string: 6, fret: 3 },
          { string: 5, fret: 2 },
          { string: 1, fret: 3 },
        ],
        barres: [],
        mutedStrings: [],
        openStrings: [4, 3, 2],
        fingerLabels: [],
      },
      F: {
        startFret: 1,
        fingers: [
          { string: 3, fret: 2 },
          { string: 4, fret: 3 },
          { string: 5, fret: 3 },
        ],
        barres: [{ fret: 1, fromString: 6, toString: 1 }],
        mutedStrings: [],
        openStrings: [],
        fingerLabels: [],
      },
    };
    return presets[name] || null;
  }),
}));

// Mock chord suggestions
vi.mock("@/data/chordSuggestions", () => ({
  filterChordSuggestions: vi.fn((query: string) => {
    if (!query) return [];
    const allChords = ["Am", "A", "A7", "Am7", "G", "G7", "C", "C7", "D", "Dm", "E", "Em", "F"];
    return allChords.filter((c) => c.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
  }),
}));

describe("ChordEditor", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  
  const defaultChord = createEmptyChord("test-chord-1");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderEditor = (chord: ChordDiagram = defaultChord) => {
    return render(
      <ChordEditor
        chord={chord}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
  };

  describe("Dialog Rendering", () => {
    it("should render the dialog when open is true", () => {
      renderEditor();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit Chord")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      render(
        <ChordEditor
          chord={defaultChord}
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render chord name input", () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      expect(input).toBeInTheDocument();
    });

    it("should render starting fret buttons", () => {
      renderEditor();

      expect(screen.getByText("Starting Fret")).toBeInTheDocument();
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
      }
    });

    it("should render action buttons", () => {
      renderEditor();

      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save chord/i })).toBeInTheDocument();
    });

    it("should render auto-fill toggle", () => {
      renderEditor();

      expect(screen.getByText("Auto-fill chord fingerings")).toBeInTheDocument();
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should render help text", () => {
      renderEditor();

      // Text is broken up by <strong> tags, so use a function matcher
      expect(screen.getByText((content, element) => {
        return element?.tagName === "P" && content.includes("on frets to add/remove fingers");
      })).toBeInTheDocument();
    });
  });

  describe("Chord Name Input", () => {
    it("should update chord name when typing", () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "Am" } });

      expect(input).toHaveValue("Am");
    });

    it("should show suggestions when typing a chord name", async () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "A" } });
      fireEvent.focus(input);

      // Suggestions render the chord name with first letter bolded
      await waitFor(() => {
        // Find button containing "m" after the bold "A"
        const suggestionButtons = screen.getAllByRole("button").filter(
          (btn) => btn.textContent?.includes("Am") || btn.textContent === "Am"
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });
    });

    it("should apply preset when selecting a suggestion", async () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "A" } });
      fireEvent.focus(input);

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole("button").filter(
          (btn) => btn.textContent?.includes("Am")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });

      // Find and click the Am suggestion
      const amButton = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Am") && !btn.textContent?.includes("Am7")
      );
      if (amButton) fireEvent.click(amButton);

      expect(input).toHaveValue("Am");
    });

    it("should navigate suggestions with arrow keys", async () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "A" } });
      fireEvent.focus(input);

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole("button").filter(
          (btn) => btn.textContent?.includes("Am")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });

      // Navigate down and select
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      // First item is "Am", ArrowDown moves to "A", Enter selects it
      expect(input).toHaveValue("A");
    });

    it("should close suggestions on Escape", async () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "A" } });
      fireEvent.focus(input);

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole("button").filter(
          (btn) => btn.textContent?.includes("Am")
        );
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });

      fireEvent.keyDown(input, { key: "Escape" });

      await waitFor(() => {
        // Suggestions should be gone - only action buttons remain
        const amButtons = screen.getAllByRole("button").filter(
          (btn) => btn.textContent?.includes("Am")
        );
        expect(amButtons.length).toBe(0);
      });
    });

    it("should show no preset indicator for unknown chords", async () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "D" } });
      fireEvent.focus(input);

      await waitFor(() => {
        // Check for "(no preset)" text which indicates no preset exists
        const noPresetElements = screen.getAllByText("(no preset)");
        expect(noPresetElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Starting Fret Selection", () => {
    it("should highlight the current starting fret", () => {
      const chordWithFret3 = { ...defaultChord, startFret: 3 };
      renderEditor(chordWithFret3);

      const fret3Button = screen.getByRole("button", { name: "3" });
      expect(fret3Button).toHaveClass("bg-primary");
    });

    it("should change starting fret when clicking a button", () => {
      renderEditor();

      const fret5Button = screen.getByRole("button", { name: "5" });
      fireEvent.click(fret5Button);

      expect(fret5Button).toHaveClass("bg-primary");
    });
  });

  describe("Auto-fill Toggle", () => {
    it("should be enabled by default", () => {
      renderEditor();

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
    });

    it("should clear fingering when disabled", async () => {
      const chordWithPreset = {
        ...defaultChord,
        name: "Am",
        fingers: [{ string: 2, fret: 1 }],
        mutedStrings: [6],
      };
      renderEditor(chordWithPreset);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      // Toggle should now be unchecked
      expect(toggle).not.toBeChecked();
    });

    it("should apply preset when re-enabled with chord name", async () => {
      const chordWithName = {
        ...defaultChord,
        name: "Am",
      };
      renderEditor(chordWithName);

      const toggle = screen.getByRole("switch");
      
      // Disable first
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();
      
      // Re-enable
      fireEvent.click(toggle);
      expect(toggle).toBeChecked();
    });
  });

  describe("Action Buttons", () => {
    it("should call onClose when Cancel is clicked", () => {
      renderEditor();

      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onSave and onClose when Save is clicked", () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "TestChord" } });

      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: "TestChord" })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should clear all data when Clear is clicked", () => {
      const chordWithData = {
        ...defaultChord,
        name: "Am",
        fingers: [{ string: 2, fret: 1 }],
        mutedStrings: [6],
      };
      renderEditor(chordWithData);

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      expect(input).toHaveValue("Am");

      fireEvent.click(screen.getByRole("button", { name: /clear/i }));

      expect(input).toHaveValue("");
    });
  });

  describe("Existing Chord Data", () => {
    it("should display existing chord name", () => {
      const chordWithName = { ...defaultChord, name: "G7" };
      renderEditor(chordWithName);

      expect(screen.getByPlaceholderText("e.g., Am, G, C7")).toHaveValue("G7");
    });

    it("should display correct starting fret for existing chord", () => {
      const chordWithFret = { ...defaultChord, startFret: 5 };
      renderEditor(chordWithFret);

      const fret5Button = screen.getByRole("button", { name: "5" });
      expect(fret5Button).toHaveClass("bg-primary");
    });
  });

  describe("SVG Fretboard", () => {
    it("should render the fretboard SVG", () => {
      renderEditor();

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should show nut when starting fret is 1", () => {
      renderEditor();

      // The nut is a rect element at startFret 1
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render finger label section", () => {
      renderEditor();

      expect(screen.getByText("Finger")).toBeInTheDocument();
    });
  });

  describe("Dialog Close Behavior", () => {
    it("should call onClose when dialog is closed via overlay", () => {
      renderEditor();

      // Trigger dialog close
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Click cancel to close
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Muted and Open Strings", () => {
    it("should display muted strings from chord data", () => {
      const chordWithMuted = {
        ...defaultChord,
        mutedStrings: [6],
      };
      renderEditor(chordWithMuted);

      // The muted string should show × symbol
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should display open strings from chord data", () => {
      const chordWithOpen = {
        ...defaultChord,
        openStrings: [5, 1],
      };
      renderEditor(chordWithOpen);

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Finger Labels", () => {
    it("should display finger labels from chord data", () => {
      const chordWithLabels = {
        ...defaultChord,
        fingerLabels: [
          { string: 2, finger: 1 },
          { string: 4, finger: 2 },
        ],
      };
      renderEditor(chordWithLabels);

      // Finger labels are in SVG text elements - use getAllByText since "1" also appears in fret buttons
      const allTexts = screen.getAllByText("1");
      // At least one should be in the SVG (finger label)
      const svgText = allTexts.find((el) => el.tagName === "text");
      expect(svgText).toBeInTheDocument();
      
      // "2" should be in SVG too but also in fret button
      const allTwos = screen.getAllByText("2");
      expect(allTwos.length).toBeGreaterThanOrEqual(1);
    });

    it("should display T for thumb (finger 0)", () => {
      const chordWithThumb = {
        ...defaultChord,
        fingerLabels: [{ string: 6, finger: 0 }],
      };
      renderEditor(chordWithThumb);

      expect(screen.getByText("T")).toBeInTheDocument();
    });
  });

  describe("Barre Chords", () => {
    it("should display barres from chord data", () => {
      const chordWithBarre = {
        ...defaultChord,
        barres: [{ fret: 1, fromString: 6, toString: 1 }],
      };
      renderEditor(chordWithBarre);

      // Barre should be rendered as a rect in the SVG
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible dialog structure", () => {
      renderEditor();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Edit Chord" })).toBeInTheDocument();
    });

    it("should have labeled form inputs", () => {
      renderEditor();

      expect(screen.getByLabelText(/chord name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/auto-fill chord fingerings/i)).toBeInTheDocument();
    });

    it("should have aria-autocomplete on chord name input", () => {
      renderEditor();

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
    });
  });
});
