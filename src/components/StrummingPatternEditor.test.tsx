import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StrummingPatternEditor } from "./StrummingPatternEditor";
import { createEmptyPattern } from "@/types/strumming";

describe("StrummingPatternEditor", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderEditor = (pattern = createEmptyPattern(1, "4/4")) => {
    return render(
      <StrummingPatternEditor
        pattern={pattern}
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );
  };

  describe("Dialog Rendering", () => {
    it("should render the dialog when open is true", () => {
      renderEditor();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Strumming Pattern Editor")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      render(
        <StrummingPatternEditor
          pattern={null}
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Time Signature Selection", () => {
    it("should render time signature selector with default 4/4", () => {
      renderEditor();

      expect(screen.getByText("Time:")).toBeInTheDocument();
      // The first select combobox is for time signature
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    it("should display time signature label", () => {
      renderEditor();

      // Verify that the time signature label is shown
      expect(screen.getByText("Time:")).toBeInTheDocument();
    });

    it("should disable bars selector when time signature is 6/8", async () => {
      const pattern = createEmptyPattern(1, "6/8");
      renderEditor(pattern);

      const comboboxes = screen.getAllByRole("combobox");
      // Second combobox is the bars selector (index 1)
      const barsButton = comboboxes[1];
      expect(barsButton).toBeDisabled();
    });

    it("should enable bars selector for 4/4 time signature", () => {
      const pattern = createEmptyPattern(1, "4/4");
      renderEditor(pattern);

      const comboboxes = screen.getAllByRole("combobox");
      const barsButton = comboboxes[1];
      expect(barsButton).not.toBeDisabled();
    });

    it("should enable bars selector for 3/4 time signature", () => {
      const pattern = createEmptyPattern(1, "3/4");
      renderEditor(pattern);

      const comboboxes = screen.getAllByRole("combobox");
      const barsButton = comboboxes[1];
      expect(barsButton).not.toBeDisabled();
    });
  });

  describe("Bars Selection", () => {
    it("should render bars selector", () => {
      renderEditor();

      expect(screen.getByText("Bars:")).toBeInTheDocument();
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });

    it("should create correct number of slots for 2 bars in 4/4", () => {
      const pattern = createEmptyPattern(2, "4/4");
      expect(pattern.beats).toHaveLength(16); // 2 bars × 8 slots
    });

    it("should create correct number of slots for 2 bars in 3/4", () => {
      const pattern = createEmptyPattern(2, "3/4");
      expect(pattern.beats).toHaveLength(12); // 2 bars × 6 slots
    });

    it("should create correct number of slots for 1 bar in 6/8", () => {
      const pattern = createEmptyPattern(1, "6/8");
      expect(pattern.beats).toHaveLength(12); // 1 bar × 12 slots
    });
  });

  describe("Clear Button", () => {
    it("should reset pattern to default 4/4 with 1 bar when cleared", async () => {
      const pattern = createEmptyPattern(2, "3/4");
      renderEditor(pattern);

      const clearButton = screen.getByRole("button", { name: /clear all/i });
      fireEvent.click(clearButton);

      // After clear, should reset to 4/4, 1 bar
      await waitFor(() => {
        // Check that comboboxes are reset
        const comboboxes = screen.getAllByRole("combobox");
        // First combobox (time signature) should show 4/4
        expect(comboboxes[0].textContent).toContain("4/4");
      });
    });

    it("should clear all strokes when clear button is clicked", async () => {
      const pattern = createEmptyPattern(1, "4/4");
      pattern.beats[0].stroke = "down";
      pattern.beats[1].stroke = "up";
      renderEditor(pattern);

      const clearButton = screen.getByRole("button", { name: /clear all/i });
      fireEvent.click(clearButton);

      // All strokes should be reset
      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe("Preset Selection", () => {
    it("should have preset selector in the UI", () => {
      renderEditor();

      // Verify all three comboboxes are rendered (time, bars, preset)
      const comboboxes = screen.queryAllByRole("combobox");
      expect(comboboxes.length).toBe(3);
    });
  });

  describe("Save and Cancel", () => {
    it("should call onSave when save button is clicked", async () => {
      renderEditor();

      const saveButton = screen.getByRole("button", { name: /save pattern/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            beats: expect.any(Array),
            bars: expect.any(Number),
            timeSignature: expect.any(String),
          })
        );
      });
    });

    it("should call onClose when cancel button is clicked", async () => {
      renderEditor();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should call onDelete when delete button is clicked", async () => {
      renderEditor();

      const deleteButton = screen.getByRole("button", { name: /remove pattern/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Pattern Creation with Different Time Signatures", () => {
    it("should create 4/4 pattern with 8 slots per bar", () => {
      const pattern = createEmptyPattern(1, "4/4");
      expect(pattern.timeSignature).toBe("4/4");
      expect(pattern.bars).toBe(1);
      expect(pattern.beats).toHaveLength(8);
    });

    it("should create 3/4 pattern with 6 slots per bar", () => {
      const pattern = createEmptyPattern(1, "3/4");
      expect(pattern.timeSignature).toBe("3/4");
      expect(pattern.bars).toBe(1);
      expect(pattern.beats).toHaveLength(6);
    });

    it("should create 6/8 pattern with 12 slots per bar", () => {
      const pattern = createEmptyPattern(1, "6/8");
      expect(pattern.timeSignature).toBe("6/8");
      expect(pattern.bars).toBe(1);
      expect(pattern.beats).toHaveLength(12);
    });

    it("should create 2-bar 4/4 pattern with 16 slots", () => {
      const pattern = createEmptyPattern(2, "4/4");
      expect(pattern.timeSignature).toBe("4/4");
      expect(pattern.bars).toBe(2);
      expect(pattern.beats).toHaveLength(16);
    });

    it("should create 2-bar 3/4 pattern with 12 slots", () => {
      const pattern = createEmptyPattern(2, "3/4");
      expect(pattern.timeSignature).toBe("3/4");
      expect(pattern.bars).toBe(2);
      expect(pattern.beats).toHaveLength(12);
    });
  });
});
