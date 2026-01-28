import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePdfExport } from "./usePdfExport";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { RefObject } from "react";

// Mock html2canvas
vi.mock("html2canvas", () => ({
  default: vi.fn(),
}));

// Mock jsPDF
vi.mock("jspdf", () => ({
  default: vi.fn(),
}));

describe("usePdfExport", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockPdf: { addImage: Mock; save: Mock };
  let mockRef: { current: HTMLDivElement | null };
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock element
    mockElement = document.createElement("div");

    // Create mutable mock ref
    mockRef = { current: null };

    // Create mock canvas
    mockCanvas = document.createElement("canvas");
    mockCanvas.width = 800;
    mockCanvas.height = 1000;
    Object.defineProperty(mockCanvas, "toDataURL", {
      value: vi.fn().mockReturnValue("data:image/png;base64,mockImageData"),
    });

    // Setup html2canvas mock
    (html2canvas as Mock).mockResolvedValue(mockCanvas);

    // Setup jsPDF mock
    mockPdf = {
      addImage: vi.fn(),
      save: vi.fn(),
    };
    (jsPDF as unknown as Mock).mockImplementation(() => mockPdf);
  });

  it("should return handleDownloadPDF function", () => {
    const { result } = renderHook(() => usePdfExport("Test Chart", mockRef));

    expect(typeof result.current.handleDownloadPDF).toBe("function");
  });

  it("should not generate PDF if ref is not attached", async () => {
    const { result } = renderHook(() => usePdfExport("Test Chart", mockRef));

    await act(async () => {
      await result.current.handleDownloadPDF();
    });

    expect(html2canvas).not.toHaveBeenCalled();
    expect(jsPDF).not.toHaveBeenCalled();
  });

  it("should generate PDF when ref is attached to an element", async () => {
    mockRef.current = mockElement;
    const { result } = renderHook(() => usePdfExport("Test Chart", mockRef));

    await act(async () => {
      await result.current.handleDownloadPDF();
    });

    // Verify html2canvas was called with correct options
    expect(html2canvas).toHaveBeenCalledWith(mockElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // Verify jsPDF was initialized with correct options
    expect(jsPDF).toHaveBeenCalledWith({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Verify image was added to PDF
    expect(mockPdf.addImage).toHaveBeenCalledWith(
      "data:image/png;base64,mockImageData",
      "PNG",
      0,
      0,
      210, // A4 width in mm
      expect.any(Number) // Calculated height
    );

    // Verify PDF was saved with correct filename
    expect(mockPdf.save).toHaveBeenCalledWith("Test Chart.pdf");
  });

  it("should use default filename when title is empty", async () => {
    mockRef.current = mockElement;
    const { result } = renderHook(() => usePdfExport("", mockRef));

    await act(async () => {
      await result.current.handleDownloadPDF();
    });

    expect(mockPdf.save).toHaveBeenCalledWith("chord-chart.pdf");
  });

  it("should calculate correct image height based on aspect ratio", async () => {
    // Set up canvas with specific dimensions
    mockCanvas.width = 1000;
    mockCanvas.height = 1500;

    mockRef.current = mockElement;
    const { result } = renderHook(() => usePdfExport("Test", mockRef));

    await act(async () => {
      await result.current.handleDownloadPDF();
    });

    // Expected height: (1500 * 210) / 1000 = 315
    expect(mockPdf.addImage).toHaveBeenCalledWith(
      expect.any(String),
      "PNG",
      0,
      0,
      210,
      315
    );
  });

  it("should update filename when title changes", async () => {
    mockRef.current = mockElement;
    const { result, rerender } = renderHook(
      ({ title }) => usePdfExport(title, mockRef),
      { initialProps: { title: "First Title" } }
    );

    // Generate PDF with first title
    await act(async () => {
      await result.current.handleDownloadPDF();
    });
    expect(mockPdf.save).toHaveBeenCalledWith("First Title.pdf");

    // Change title and generate again
    rerender({ title: "Second Title" });
    await act(async () => {
      await result.current.handleDownloadPDF();
    });
    expect(mockPdf.save).toHaveBeenCalledWith("Second Title.pdf");
  });

  it("should memoize handleDownloadPDF based on title and ref", () => {
    mockRef.current = mockElement;
    const { result, rerender } = renderHook(
      ({ title }) => usePdfExport(title, mockRef),
      { initialProps: { title: "Test" } }
    );

    const initialHandler = result.current.handleDownloadPDF;

    // Same title - handler should be the same
    rerender({ title: "Test" });
    expect(result.current.handleDownloadPDF).toBe(initialHandler);

    // Different title - handler should change
    rerender({ title: "Different" });
    expect(result.current.handleDownloadPDF).not.toBe(initialHandler);
  });
});
