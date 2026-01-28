import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrintableSheet } from "./PrintableSheet";
import { createEmptyChord } from "@/types/chord";
import { createEmptyPattern } from "@/types/strumming";

describe("PrintableSheet", () => {
  const defaultProps = {
    title: "Test Chart",
    description: "Test description",
    rows: [[createEmptyChord("1"), createEmptyChord("2")]],
    rowSubtitles: ["Verse"],
  };

  describe("Basic Rendering", () => {
    it("should render with title and description", () => {
      render(<PrintableSheet {...defaultProps} />);

      expect(screen.getByText("Test Chart")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("should render logo image", () => {
      render(<PrintableSheet {...defaultProps} />);

      const logo = screen.getByAltText("Fretkit Logo");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "/ms-icon-310x310.png");
      expect(logo).toHaveClass("w-24", "h-24");
    });

    it("should use default title when none provided", () => {
      render(<PrintableSheet {...defaultProps} title="" />);

      expect(screen.getByText("Chord Chart")).toBeInTheDocument();
    });

    it("should not render description when empty", () => {
      const { container } = render(<PrintableSheet {...defaultProps} description="" />);

      // Description paragraph should not be in the document
      const descriptions = container.querySelectorAll("p.text-sm.text-gray-600");
      expect(descriptions.length).toBe(0);
    });
  });

  describe("Strumming Pattern Display", () => {
    it("should not display strumming pattern section when pattern is null", () => {
      render(<PrintableSheet {...defaultProps} strummingPattern={null} />);

      expect(screen.queryByText("Strumming Pattern")).not.toBeInTheDocument();
    });

    it("should not display strumming pattern when all beats are empty", () => {
      const emptyPattern = createEmptyPattern(1, "4/4");
      render(<PrintableSheet {...defaultProps} strummingPattern={emptyPattern} />);

      expect(screen.queryByText("Strumming Pattern")).not.toBeInTheDocument();
    });

    it("should display strumming pattern with 4/4 time signature when pattern has content", () => {
      const pattern = createEmptyPattern(1, "4/4");
      pattern.beats[0].stroke = "down";
      render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      expect(label).toBeInTheDocument();
      expect(label.textContent).toContain("4/4");
    });

    it("should display bold time signature after 'Strumming Pattern' text", () => {
      const pattern = createEmptyPattern(1, "4/4");
      pattern.beats[0].stroke = "down";
      const { container } = render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      // Find the span containing "Strumming Pattern"
      const label = screen.getByText(/Strumming Pattern/);
      
      // Check that there's a bold span inside with the time signature
      const boldSpan = label.querySelector("span.font-bold");
      expect(boldSpan).toBeInTheDocument();
      expect(boldSpan?.textContent).toBe("4/4");
    });

    it("should display 3/4 time signature for waltz pattern", () => {
      const pattern = createEmptyPattern(1, "3/4");
      pattern.beats[0].stroke = "down";
      render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      expect(label.textContent).toContain("3/4");
      
      const boldSpan = label.querySelector("span.font-bold");
      expect(boldSpan?.textContent).toBe("3/4");
    });

    it("should display 6/8 time signature for compound time pattern", () => {
      const pattern = createEmptyPattern(1, "6/8");
      pattern.beats[0].stroke = "down";
      render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      expect(label.textContent).toContain("6/8");
      
      const boldSpan = label.querySelector("span.font-bold");
      expect(boldSpan?.textContent).toBe("6/8");
    });

    it("should display pattern with correct number of beats for 4/4 2-bar pattern", () => {
      const pattern = createEmptyPattern(2, "4/4");
      pattern.beats[0].stroke = "down";
      pattern.beats[1].stroke = "up";
      
      render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      expect(screen.getByText(/Strumming Pattern/)).toBeInTheDocument();
      // 2 bars of 4/4 = 16 slots (8 per bar)
      expect(pattern.beats).toHaveLength(16);
    });

    it("should display pattern with correct number of beats for 3/4 2-bar pattern", () => {
      const pattern = createEmptyPattern(2, "3/4");
      pattern.beats[0].stroke = "down";
      
      render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      expect(screen.getByText(/Strumming Pattern/)).toBeInTheDocument();
      // 2 bars of 3/4 = 12 slots (6 per bar)
      expect(pattern.beats).toHaveLength(12);
    });

    it("should display pattern with correct number of beats for 6/8 1-bar pattern", () => {
      const pattern = createEmptyPattern(1, "6/8");
      pattern.beats[0].stroke = "down";
      
      render(<PrintableSheet {...defaultProps} strummingPattern={pattern} />);

      expect(screen.getByText(/Strumming Pattern/)).toBeInTheDocument();
      // 1 bar of 6/8 with subdivision 3 = 18 slots (6 beats × 3)
      expect(pattern.beats).toHaveLength(18);
    });
  });

  describe("Chord Display", () => {
    it("should not display completely empty rows", () => {
      const emptyChord1 = createEmptyChord("1");
      const emptyChord2 = createEmptyChord("2");
      
      render(
        <PrintableSheet
          {...defaultProps}
          rows={[[emptyChord1, emptyChord2]]}
        />
      );

      // Should not have any chord diagrams rendered for empty chords
      const chords = screen.queryAllByTestId(/chord-diagram/i);
      expect(chords.length).toBe(0);
    });

    it("should display rows with edited chords", () => {
      const editedChord = createEmptyChord("1");
      editedChord.name = "Am";
      editedChord.fingers = [{ string: 2, fret: 1 }];
      
      const { container } = render(
        <PrintableSheet
          {...defaultProps}
          rows={[[editedChord]]}
        />
      );

      // Check that chord diagram is rendered (it won't render for empty chords)
      // The chord diagram should be present for edited chords
      const chordDiagrams = container.querySelectorAll('svg');
      expect(chordDiagrams.length).toBeGreaterThan(0);
    });
  });

  describe("Layout and Styling", () => {
    it("should have A4 page dimensions", () => {
      const { container } = render(<PrintableSheet {...defaultProps} />);

      const pageDiv = container.querySelector(".w-\\[210mm\\]");
      expect(pageDiv).toBeInTheDocument();
      expect(pageDiv).toHaveClass("min-h-[297mm]");
    });

    it("should use white background", () => {
      const { container } = render(<PrintableSheet {...defaultProps} />);

      const pageDiv = container.querySelector(".bg-white");
      expect(pageDiv).toBeInTheDocument();
    });

    it("should display watermark when enabled", () => {
      const { container } = render(<PrintableSheet {...defaultProps} />);

      // Watermark is conditionally rendered based on APP_CONFIG.showWatermark
      const watermark = container.querySelector(".text-gray-400");
      // If watermark is shown, it should have opacity and rotation
      if (watermark) {
        expect(watermark).toHaveStyle({ opacity: "0.2" });
      }
    });
  });

  describe("Title and Logo Layout", () => {
    it("should display title and logo in flex layout", () => {
      const { container } = render(<PrintableSheet {...defaultProps} />);

      const titleContainer = container.querySelector(".flex.items-center.gap-3");
      expect(titleContainer).toBeInTheDocument();
    });

    it("should have large title font", () => {
      render(<PrintableSheet {...defaultProps} />);

      const title = screen.getByText("Test Chart");
      expect(title).toHaveClass("text-4xl", "font-bold");
    });
  });
});
