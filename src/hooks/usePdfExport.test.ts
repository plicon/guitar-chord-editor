import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePdfExport } from "./usePdfExport";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  beforeEach(() => {
    vi.clearAllMocks();

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

  it("should return a ref and handleDownloadPDF function", () => {
    const { result } = renderHook(() => usePdfExport("Test Chart"));

    expect(result.current.printRef).toBeDefined();
    expect(result.current.printRef.current).toBeNull();
    expect(typeof result.current.handleDownloadPDF).toBe("function");
  });

  it("should not generate PDF if ref is not attached", async () => {
    const { result } = renderHook(() => usePdfExport("Test Chart"));

    await act(async () => {
      await result.current.handleDownloadPDF();
    });

    expect(html2canvas).not.toHaveBeenCalled();
    expect(jsPDF).not.toHaveBeenCalled();
  });

  it("should generate PDF when ref is attached to an element", async () => {
    const { result } = renderHook(() => usePdfExport("Test Chart"));

    // Create and attach a mock element to the ref
    const mockElement = document.createElement("div");
    Object.defineProperty(result.current.printRef, "current", {
      value: mockElement,
      writable: true,
    });

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
    const { result } = renderHook(() => usePdfExport(""));

    const mockElement = document.createElement("div");
    Object.defineProperty(result.current.printRef, "current", {
      value: mockElement,
      writable: true,
    });

    await act(async () => {
      await result.current.handleDownloadPDF();
    });

    expect(mockPdf.save).toHaveBeenCalledWith("chord-chart.pdf");
  });

  it("should calculate correct image height based on aspect ratio", async () => {
    // Set up canvas with specific dimensions
    mockCanvas.width = 1000;
    mockCanvas.height = 1500;

    const { result } = renderHook(() => usePdfExport("Test"));

    const mockElement = document.createElement("div");
    Object.defineProperty(result.current.printRef, "current", {
      value: mockElement,
      writable: true,
    });

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
    const { result, rerender } = renderHook(
      ({ title }) => usePdfExport(title),
      { initialProps: { title: "First Title" } }
    );

    const mockElement = document.createElement("div");
    Object.defineProperty(result.current.printRef, "current", {
      value: mockElement,
      writable: true,
    });

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

  it("should maintain stable ref across renders", () => {
    const { result, rerender } = renderHook(
      ({ title }) => usePdfExport(title),
      { initialProps: { title: "Test" } }
    );

    const initialRef = result.current.printRef;

    rerender({ title: "Updated" });

    expect(result.current.printRef).toBe(initialRef);
  });

  it("should memoize handleDownloadPDF based on title", () => {
    const { result, rerender } = renderHook(
      ({ title }) => usePdfExport(title),
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
