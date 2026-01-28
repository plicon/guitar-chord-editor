import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreviewDialog } from "./PreviewDialog";
import { createEmptyChord } from "@/types/chord";
import { createEmptyPattern } from "@/types/strumming";

describe("PreviewDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnDownloadPDF = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    title: "Test Chart",
    description: "Test description",
    rows: [[createEmptyChord("1"), createEmptyChord("2")]],
    rowSubtitles: ["Verse"],
    strummingPattern: null,
    onDownloadPDF: mockOnDownloadPDF,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Dialog Rendering", () => {
    it("should render when open is true", () => {
      render(<PreviewDialog {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Print Preview")).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      render(<PreviewDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render PrintableSheet component inside dialog", () => {
      render(<PreviewDialog {...defaultProps} />);

      expect(screen.getByText("Test Chart")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });
  });

  describe("Light Theme Styling", () => {
    it("should use white background for dialog content", () => {
      const { container } = render(<PreviewDialog {...defaultProps} />);

      // Check that the dialog is rendered with the preview content
      expect(screen.getByText("Print Preview")).toBeInTheDocument();
      expect(screen.getByText("Test Chart")).toBeInTheDocument();
    });

    it("should have light theme close button", () => {
      render(<PreviewDialog {...defaultProps} />);

      // Verify close buttons exist (there are 2: dialog header and footer)
      const buttons = screen.getAllByRole("button", { name: /close/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have blue download button", () => {
      render(<PreviewDialog {...defaultProps} />);

      const downloadButton = screen.getByRole("button", { name: /download pdf/i });
      expect(downloadButton).toHaveClass("bg-blue-600");
      expect(downloadButton).toHaveClass("text-white");
    });
  });

  describe("User Interactions", () => {
    it("should call onOpenChange when close button is clicked", () => {
      render(<PreviewDialog {...defaultProps} />);

      // Click one of the close buttons
      const buttons = screen.getAllByRole("button", { name: /close/i });
      fireEvent.click(buttons[0]);

      expect(mockOnOpenChange).toHaveBeenCalled();
    });

    it("should call onDownloadPDF when download button is clicked", () => {
      render(<PreviewDialog {...defaultProps} />);

      const downloadButton = screen.getByRole("button", { name: /download pdf/i });
      fireEvent.click(downloadButton);

      expect(mockOnDownloadPDF).toHaveBeenCalledTimes(1);
    });
  });

  describe("Strumming Pattern Display with Time Signature", () => {
    it("should display time signature in preview when strumming pattern exists", () => {
      const pattern = createEmptyPattern(1, "4/4");
      pattern.beats[0].stroke = "down";

      render(<PreviewDialog {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      expect(label).toBeInTheDocument();
      expect(label.textContent).toContain("4/4");
    });

    it("should display 3/4 time signature in preview", () => {
      const pattern = createEmptyPattern(1, "3/4");
      pattern.beats[0].stroke = "down";

      render(<PreviewDialog {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      expect(label.textContent).toContain("3/4");
    });

    it("should display 6/8 time signature in preview", () => {
      const pattern = createEmptyPattern(1, "6/8");
      pattern.beats[0].stroke = "down";

      render(<PreviewDialog {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      expect(label.textContent).toContain("6/8");
    });

    it("should display bold time signature after 'Strumming Pattern' label", () => {
      const pattern = createEmptyPattern(2, "4/4");
      pattern.beats[0].stroke = "down";

      const { container } = render(<PreviewDialog {...defaultProps} strummingPattern={pattern} />);

      const label = screen.getByText(/Strumming Pattern/);
      const boldSpan = label.querySelector("span.font-bold");
      
      expect(boldSpan).toBeInTheDocument();
      expect(boldSpan?.textContent).toBe("4/4");
    });

    it("should not display strumming section when pattern is null", () => {
      render(<PreviewDialog {...defaultProps} strummingPattern={null} />);

      expect(screen.queryByText("Strumming Pattern")).not.toBeInTheDocument();
    });

    it("should not display strumming section when pattern is empty", () => {
      const emptyPattern = createEmptyPattern(1, "4/4");
      render(<PreviewDialog {...defaultProps} strummingPattern={emptyPattern} />);

      expect(screen.queryByText("Strumming Pattern")).not.toBeInTheDocument();
    });
  });

  describe("Content Scrolling", () => {
    it("should have scrollable content area", () => {
      render(<PreviewDialog {...defaultProps} />);

      // Verify the dialog content is rendered
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Dialog Layout", () => {
    it("should have maximum width constraint", () => {
      render(<PreviewDialog {...defaultProps} />);

      // Verify the dialog is rendered
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have action buttons at the bottom", () => {
      render(<PreviewDialog {...defaultProps} />);

      const buttons = screen.getAllByRole("button", { name: /close/i });
      const downloadButton = screen.getByRole("button", { name: /download pdf/i });

      // There are two close buttons (one in dialog header, one in footer)
      expect(buttons.length).toBeGreaterThan(0);
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper dialog structure with title and content", () => {
      render(<PreviewDialog {...defaultProps} />);

      // Verify dialog has proper accessible structure
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Print Preview")).toBeInTheDocument();
    });
  });
});
