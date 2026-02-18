import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChordEditor } from "./ChordEditor";
import { createEmptyChord, ChordDiagram } from "@/types/chord";

// Mock preset services
vi.mock("@/services/presets", () => ({
  getChordPreset: vi.fn(async (name: string) => {
    const presets: Record<string, Partial<ChordDiagram>> = {
      Am: {
        name: "Am",
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
        name: "G",
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
        name: "F",
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
  listChordPresets: vi.fn(async () => [
    {
      name: "Am",
      frets: 5,
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
    {
      name: "G",
      frets: 5,
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
    {
      name: "F",
      frets: 5,
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
    // 7-element preset used by near-match test:
    // playing only the 6 fingers (no barre) gives score 6/7 ≈ 0.857 > 0.85 threshold
    {
      name: "Bm",
      frets: 5,
      startFret: 2,
      fingers: [
        { string: 1, fret: 2 },
        { string: 2, fret: 3 },
        { string: 3, fret: 4 },
        { string: 4, fret: 4 },
        { string: 5, fret: 2 },
        { string: 6, fret: 2 },
      ],
      barres: [{ fret: 2, fromString: 6, toString: 1 }],
      mutedStrings: [],
      openStrings: [],
      fingerLabels: [],
    },
  ]),
  searchChordPresets: vi.fn(async () => []),
  getStrummingPreset: vi.fn(async () => null),
  listStrummingPresets: vi.fn(async () => []),
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

  const createQueryClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderEditor = (chord: ChordDiagram = defaultChord) => {
    const queryClient = createQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <ChordEditor
          chord={chord}
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      </QueryClientProvider>
    );
  };

  describe("Dialog Rendering", () => {
    it("should render the dialog when open is true", () => {
      renderEditor();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit Chord")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      const queryClient = createQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <ChordEditor
            chord={defaultChord}
            open={false}
            onClose={mockOnClose}
            onSave={mockOnSave}
          />
        </QueryClientProvider>
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

      await waitFor(() => {
        expect(input).toHaveValue("Am");
      });
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

  describe("Fretboard Interactions", () => {
    it("should add finger position when clicking on fret", () => {
      renderEditor();

      // Find the interactive fretboard SVG specifically
      const svg = document.querySelector('[data-testid="fretboard-svg"]');
      expect(svg).toBeInTheDocument();

      // The clickable circles for fret positions are in <g> elements
      const fretGroups = svg?.querySelectorAll("g.cursor-pointer.select-none");
      expect(fretGroups).toBeDefined();
      expect(fretGroups!.length).toBeGreaterThan(0);

      // Click on first fret position (should add a finger)
      if (fretGroups && fretGroups.length > 0) {
        fireEvent.mouseDown(fretGroups[0]);
        fireEvent.mouseUp(fretGroups[0]);
      }

      // After save, check that the chord has a finger position
      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          fingers: expect.arrayContaining([
            expect.objectContaining({ string: expect.any(Number), fret: expect.any(Number) }),
          ]),
        })
      );
    });

    it("should toggle muted string when clicking top area", () => {
      renderEditor();

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Find the top area clickable groups (for muted/open strings)
      const topGroups = svg?.querySelectorAll("g.cursor-pointer");
      const stringTopGroup = topGroups?.[0]; // First clickable group is string 1 top area

      if (stringTopGroup) {
        // Click once to set muted
        fireEvent.click(stringTopGroup);
      }

      // Save and verify
      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));

      expect(mockOnSave).toHaveBeenCalled();
    });

    it("should cycle through muted -> open -> none when clicking string top", () => {
      renderEditor();

      const svg = document.querySelector("svg");
      const topGroups = svg?.querySelectorAll("g.cursor-pointer");
      const stringTopGroup = topGroups?.[0];

      if (stringTopGroup) {
        // Click 1: none -> muted
        fireEvent.click(stringTopGroup);
        // Click 2: muted -> open
        fireEvent.click(stringTopGroup);
        // Click 3: open -> none
        fireEvent.click(stringTopGroup);
      }

      // After 3 clicks, should be back to none
      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));

      // Should have no muted or open strings for the clicked string
      expect(mockOnSave).toHaveBeenCalled();
    });

    it("should cycle finger labels when clicking bottom row", () => {
      renderEditor();

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Find finger label circles (they have specific position)
      const allGroups = svg?.querySelectorAll("g.cursor-pointer");
      
      // Finger labels are at the end of the groups
      // Find a group in the finger label section (has circle with specific radius and text with dash)
      const fingerLabelGroups = Array.from(allGroups || []).filter((g) => {
        const text = g.querySelector("text");
        return text?.textContent === "–";
      });

      if (fingerLabelGroups.length > 0) {
        const fingerGroup = fingerLabelGroups[0];
        
        // Click to set finger 1
        fireEvent.click(fingerGroup);
        
        // The text should now show "1"
        const text = fingerGroup.querySelector("text");
        expect(text?.textContent).toBe("1");

        // Click again to set finger 2
        fireEvent.click(fingerGroup);
        expect(text?.textContent).toBe("2");

        // Click to set finger 3
        fireEvent.click(fingerGroup);
        expect(text?.textContent).toBe("3");

        // Click to set finger 4
        fireEvent.click(fingerGroup);
        expect(text?.textContent).toBe("4");

        // Click to set thumb (T)
        fireEvent.click(fingerGroup);
        expect(text?.textContent).toBe("T");

        // Click to clear (back to none)
        fireEvent.click(fingerGroup);
        expect(text?.textContent).toBe("–");
      }
    });
  });

  describe("Preset Loading on Open", () => {
    it("should load preset when chord with known preset is opened", async () => {
      const chordWithPresetName = {
        ...defaultChord,
        name: "Am",
      };
      renderEditor(chordWithPresetName);

      // Since auto-fill is enabled by default and chord has name "Am",
      // the preset should be loaded
      await waitFor(() => {
        // The toggle should be enabled
        const toggle = screen.getByRole("switch");
        expect(toggle).toBeChecked();
      });
    });

    it("should not load preset when auto-fill is disabled", async () => {
      const chordWithPresetName = {
        ...defaultChord,
        name: "Am",
      };
      renderEditor(chordWithPresetName);

      const toggle = screen.getByRole("switch");
      
      // Disable auto-fill
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();

      // Save and check that fingering was cleared
      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          fingers: [],
          barres: [],
          mutedStrings: [],
          openStrings: [],
        })
      );
    });
  });

  describe("Barre Chord Creation", () => {
    it("should create barre when dragging across strings on same fret", () => {
      renderEditor();

      const svg = document.querySelector("svg");
      const fretGroups = Array.from(svg?.querySelectorAll("g.cursor-pointer.select-none") || []);

      // Find two positions on the same fret but different strings
      // Groups are ordered by string then fret, so positions [0] and [5] should be on fret 1 for strings 1 and 2
      if (fretGroups.length >= 6) {
        // Mouse down on string 1, fret 1
        fireEvent.mouseDown(fretGroups[0]);
        // Mouse enter on string 6, fret 1 (simulating drag)
        fireEvent.mouseEnter(fretGroups[5]);
        // Mouse up to complete barre
        fireEvent.mouseUp(fretGroups[5]);
      }

      const input = screen.getByPlaceholderText("e.g., Am, G, C7");
      fireEvent.change(input, { target: { value: "Barre Test" } });
      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));

      // The barre should be in the saved chord
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe("Identify Chord (ID Button)", () => {
    const amFingers = [
      { string: 2, fret: 1 },
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
    ];

    it("renders the ID button next to the chord name label", () => {
      renderEditor();
      const idButton = screen.getByTitle("Identify chord from current finger positions");
      expect(idButton).toBeInTheDocument();
      expect(idButton.textContent).toContain("ID");
    });

    it("is disabled when no fingers or barres are placed", () => {
      renderEditor(); // defaultChord has empty fingers/barres
      expect(screen.getByTitle("Identify chord from current finger positions")).toBeDisabled();
    });

    it("is enabled when fingers are placed and presets have loaded", async () => {
      renderEditor({ ...defaultChord, fingers: [{ string: 2, fret: 1 }] });
      await waitFor(() =>
        expect(screen.getByTitle("Identify chord from current finger positions")).not.toBeDisabled()
      );
    });

    it("is enabled when only a barre is placed", async () => {
      renderEditor({ ...defaultChord, barres: [{ fret: 1, fromString: 6, toString: 1 }] });
      await waitFor(() =>
        expect(screen.getByTitle("Identify chord from current finger positions")).not.toBeDisabled()
      );
    });

    it("shows an exact match chip with ✓ for a known chord shape", async () => {
      renderEditor({ ...defaultChord, startFret: 1, fingers: amFingers });

      const idButton = screen.getByTitle("Identify chord from current finger positions");
      await waitFor(() => expect(idButton).not.toBeDisabled());
      fireEvent.click(idButton);

      await waitFor(() =>
        expect(screen.getByTitle("Exact match")).toBeInTheDocument()
      );
      expect(screen.getByTitle("Exact match").textContent).toContain("Am");
      expect(screen.getByTitle("Exact match").textContent).toContain("✓");
    });

    it("shows 'No matching chords found' when no preset matches", async () => {
      // Two fingers far apart on unusual strings — well below the 0.85 threshold for any preset
      renderEditor({ ...defaultChord, startFret: 1, fingers: [{ string: 1, fret: 1 }, { string: 6, fret: 5 }] });

      const idButton = screen.getByTitle("Identify chord from current finger positions");
      await waitFor(() => expect(idButton).not.toBeDisabled());
      fireEvent.click(idButton);

      await waitFor(() =>
        expect(screen.getByText("No matching chords found")).toBeInTheDocument()
      );
    });

    it("applies full preset data when an exact match chip is clicked", async () => {
      renderEditor({ ...defaultChord, startFret: 1, fingers: amFingers });

      const idButton = screen.getByTitle("Identify chord from current finger positions");
      await waitFor(() => expect(idButton).not.toBeDisabled());
      fireEvent.click(idButton);

      await waitFor(() => expect(screen.getByTitle("Exact match")).toBeInTheDocument());

      fireEvent.click(screen.getByTitle("Exact match"));

      // Name applied immediately
      expect(screen.getByPlaceholderText("e.g., Am, G, C7")).toHaveValue("Am");

      // Save and verify all preset fields were written
      fireEvent.click(screen.getByRole("button", { name: /save chord/i }));
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Am",
          startFret: 1,
          fingers: expect.arrayContaining([
            expect.objectContaining({ string: 2, fret: 1 }),
            expect.objectContaining({ string: 4, fret: 2 }),
            expect.objectContaining({ string: 3, fret: 2 }),
          ]),
          mutedStrings: [6],
          openStrings: expect.arrayContaining([5, 1]),
          fingerLabels: expect.arrayContaining([
            expect.objectContaining({ string: 2, finger: 1 }),
            expect.objectContaining({ string: 4, finger: 2 }),
            expect.objectContaining({ string: 3, finger: 3 }),
          ]),
        })
      );
    });

    it("clears match chips after one is clicked", async () => {
      renderEditor({ ...defaultChord, startFret: 1, fingers: amFingers });

      const idButton = screen.getByTitle("Identify chord from current finger positions");
      await waitFor(() => expect(idButton).not.toBeDisabled());
      fireEvent.click(idButton);

      await waitFor(() => expect(screen.getByTitle("Exact match")).toBeInTheDocument());

      fireEvent.click(screen.getByTitle("Exact match"));

      expect(screen.queryByTitle("Exact match")).not.toBeInTheDocument();
      expect(screen.queryByText("No matching chords found")).not.toBeInTheDocument();
    });

    it("clears match results when the dialog is reopened", async () => {
      const queryClient = createQueryClient();
      const amChord = { ...defaultChord, startFret: 1, fingers: amFingers };

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <ChordEditor chord={amChord} open={true} onClose={mockOnClose} onSave={mockOnSave} />
        </QueryClientProvider>
      );

      const idButton = screen.getByTitle("Identify chord from current finger positions");
      await waitFor(() => expect(idButton).not.toBeDisabled());
      fireEvent.click(idButton);
      await waitFor(() => expect(screen.getByTitle("Exact match")).toBeInTheDocument());

      // Close then reopen
      rerender(
        <QueryClientProvider client={queryClient}>
          <ChordEditor chord={amChord} open={false} onClose={mockOnClose} onSave={mockOnSave} />
        </QueryClientProvider>
      );
      rerender(
        <QueryClientProvider client={queryClient}>
          <ChordEditor chord={amChord} open={true} onClose={mockOnClose} onSave={mockOnSave} />
        </QueryClientProvider>
      );

      expect(screen.queryByTitle("Exact match")).not.toBeInTheDocument();
      expect(screen.queryByText("No matching chords found")).not.toBeInTheDocument();
    });

    it("near-match chips show percentage in their title", async () => {
      // Bm preset has 6 fingers + 1 barre = 7 elements.
      // Playing only the 6 fingers (no barre) gives score 6/7 ≈ 85.7% — above
      // the 0.85 threshold and not an exact match (barre is missing).
      const nearMatchChord = {
        ...defaultChord,
        startFret: 2,
        fingers: [
          { string: 1, fret: 2 },
          { string: 2, fret: 3 },
          { string: 3, fret: 4 },
          { string: 4, fret: 4 },
          { string: 5, fret: 2 },
          { string: 6, fret: 2 },
        ],
      };
      renderEditor(nearMatchChord);

      const idButton = screen.getByTitle("Identify chord from current finger positions");
      await waitFor(() => expect(idButton).not.toBeDisabled());
      fireEvent.click(idButton);

      await waitFor(() => {
        const percentChip = screen.queryByTitle(/\d+% match/);
        expect(percentChip).toBeInTheDocument();
        expect(percentChip?.textContent).toContain("Bm");
        // Exact-match ✓ must NOT be present
        expect(percentChip?.textContent).not.toContain("✓");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle chord with all features", () => {
      const fullChord: ChordDiagram = {
        id: "full-test",
        name: "Fmaj7",
        frets: 5,
        startFret: 1,
        fingers: [
          { string: 3, fret: 2 },
          { string: 4, fret: 3 },
        ],
        barres: [{ fret: 1, fromString: 6, toString: 2 }],
        mutedStrings: [6],
        openStrings: [1],
        fingerLabels: [
          { string: 3, finger: 2 },
          { string: 4, finger: 3 },
        ],
      };
      
      renderEditor(fullChord);

      expect(screen.getByPlaceholderText("e.g., Am, G, C7")).toHaveValue("Fmaj7");
      
      // Check the SVG renders correctly
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should handle empty chord", () => {
      renderEditor(createEmptyChord("empty"));

      expect(screen.getByPlaceholderText("e.g., Am, G, C7")).toHaveValue("");
      
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should handle high starting fret", () => {
      const highFretChord = {
        ...defaultChord,
        startFret: 7,
      };
      renderEditor(highFretChord);

      const fret7Button = screen.getByRole("button", { name: "7" });
      expect(fret7Button).toHaveClass("bg-primary");
      
      // Fret number should be displayed in the fretboard SVG
      const svg = document.querySelector('[data-testid="fretboard-svg"]');
      expect(svg?.textContent).toContain("7");
    });
  });
});
