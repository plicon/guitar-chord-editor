import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePdfExport, insertPageBreakSpacers } from "./usePdfExport";
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
  let mockPdf: { addImage: Mock; save: Mock; addPage: Mock; setDrawColor: Mock; setLineWidth: Mock; line: Mock; setFont: Mock; setFontSize: Mock; setTextColor: Mock; text: Mock; getTextWidth: Mock; setPage: Mock };
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
      addPage: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      line: vi.fn(),
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text: vi.fn(),
      getTextWidth: vi.fn().mockReturnValue(20),
      setPage: vi.fn(),
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
      logging: false,
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
    expect(mockPdf.save).toHaveBeenCalledWith("test-chart.pdf");
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
    expect(mockPdf.save).toHaveBeenCalledWith("first-title.pdf");

    // Change title and generate again
    rerender({ title: "Second Title" });
    await act(async () => {
      await result.current.handleDownloadPDF();
    });
    expect(mockPdf.save).toHaveBeenCalledWith("second-title.pdf");
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

// ─── insertPageBreakSpacers ────────────────────────────────────────────────────
//
// A 210px-wide container produces a page height of exactly 297px
// (210 × 297/210), which keeps all expected spacer heights as integers.
//
// DOM layout used throughout:
//   container [data-pdf-section?]
//     section [data-pdf-section]
//       header [data-pdf-section-header]   ← optional
//       rowsWrapper
//         row [data-pdf-avoid-break] [data-pdf-first-row?]
//
// getBoundingClientRect is mocked per-element. Container.top = 0 matches the
// production setup (position:fixed; top:0).

describe("insertPageBreakSpacers", () => {
  const PAGE_H = 297; // 210 × (297/210)

  let container: HTMLDivElement;

  /** Mock getBoundingClientRect on any element. */
  const mockBCR = (
    el: HTMLElement,
    opts: { top?: number; height?: number; width?: number }
  ) => {
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: opts.top ?? 0,
      left: 0,
      right: opts.width ?? 0,
      bottom: (opts.top ?? 0) + (opts.height ?? 0),
      width: opts.width ?? 0,
      height: opts.height ?? 0,
      x: 0,
      y: opts.top ?? 0,
      toJSON: () => ({}),
    } as DOMRect);
  };

  /**
   * Build a section element with an optional header, appended to `container`.
   * Returns the section element and a rowsWrapper div to add rows into.
   */
  const makeSection = (
    sectionTop: number,
    headerHeight: number | null = null
  ): { section: HTMLDivElement; rowsWrapper: HTMLDivElement } => {
    const section = document.createElement("div");
    section.setAttribute("data-pdf-section", "");
    mockBCR(section, { top: sectionTop, height: 500, width: 210 });

    if (headerHeight !== null) {
      const header = document.createElement("div");
      header.setAttribute("data-pdf-section-header", "");
      // Header starts at the same top as the section (it's the first child).
      mockBCR(header, { top: sectionTop, height: headerHeight });
      section.appendChild(header);
    }

    const rowsWrapper = document.createElement("div");
    section.appendChild(rowsWrapper);
    container.appendChild(section);
    return { section, rowsWrapper };
  };

  /**
   * Append a row to a parent element, optionally marking it as the first row
   * of a section (which activates the orphan-header check).
   */
  const addRow = (
    parent: HTMLElement,
    top: number,
    height: number,
    isFirstRow = false
  ): HTMLDivElement => {
    const row = document.createElement("div");
    row.setAttribute("data-pdf-avoid-break", "true");
    if (isFirstRow) row.setAttribute("data-pdf-first-row", "true");
    mockBCR(row, { top, height });
    parent.appendChild(row);
    return row;
  };

  /**
   * Return the height (in px) of the spacer immediately preceding `el`,
   * or null if no spacer exists there.
   */
  const spacerHeightBefore = (el: HTMLElement): number | null => {
    const prev = el.previousElementSibling as HTMLElement | null;
    if (!prev?.style.height) return null;
    return parseFloat(prev.style.height);
  };

  beforeEach(() => {
    container = document.createElement("div");
    mockBCR(container, { top: 0, width: 210, height: 2000 });
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  // ── Basic row behaviour ────────────────────────────────────────────────────

  it("inserts no spacers when the container has no rows", () => {
    const before = container.querySelectorAll("div").length;
    const cleanup = insertPageBreakSpacers(container);
    expect(container.querySelectorAll("div").length).toBe(before);
    cleanup();
  });

  it("inserts no spacer when a row fits entirely within a page", () => {
    // top=50, height=100 → bottom=150 < 297 ✓
    const row = addRow(container, 50, 100);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(row)).toBeNull();
    cleanup();
  });

  it("inserts a spacer before a row that straddles a page boundary", () => {
    // top=250, height=100 → bottom=350 > 297; spacer = 297−250 = 47
    const row = addRow(container, 250, 100);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(row)).toBe(47);
    cleanup();
  });

  it("inserts no spacer when a row is taller than a full page", () => {
    // height=300 > pageHeight=297 → can never fit; skip
    const row = addRow(container, 250, 300);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(row)).toBeNull();
    cleanup();
  });

  it("does not insert a spacer for rows that fit, only for those that straddle", () => {
    const fits    = addRow(container, 100, 80);  // bottom=180 < 297
    const straddles = addRow(container, 250, 100); // bottom=350 > 297
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(fits)).toBeNull();
    expect(spacerHeightBefore(straddles)).toBe(47); // 297−250
    cleanup();
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  it("cleanup function removes all inserted spacers", () => {
    const row = addRow(container, 250, 100);
    const before = container.querySelectorAll("div").length;
    const cleanup = insertPageBreakSpacers(container);
    expect(container.querySelectorAll("div").length).toBeGreaterThan(before);
    cleanup();
    expect(container.querySelectorAll("div").length).toBe(before);
    expect(spacerHeightBefore(row)).toBeNull();
  });

  // ── addedHeight tracking ───────────────────────────────────────────────────

  it("accounts for earlier spacers when computing positions of subsequent rows", () => {
    // Row 1: top=250, height=100 → straddles page 1; spacer=47, addedHeight=47
    // Row 2: raw top=520 → adjusted top=567, bottom=667 > 594 (page 2 end);
    //         spacer = 594−567 = 27
    const row1 = addRow(container, 250, 100);
    const row2 = addRow(container, 520, 100);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(row1)).toBe(47);
    expect(spacerHeightBefore(row2)).toBe(27);
    cleanup();
  });

  // ── Section + header: first row straddles ─────────────────────────────────

  it("inserts a spacer before the section (not the row) when the first row straddles and a header is present", () => {
    // Section top=220; header top=220 h=30 → bottom=250 (page 0, no straddle)
    // First row top=255, h=100 → bottom=355 > 297 (straddles)
    // Section spacer = 297−220 = 77; after push rowTop=332 < 594 → no row spacer
    const { section, rowsWrapper } = makeSection(220, 30);
    const row = addRow(rowsWrapper, 255, 100, true);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(section)).toBe(77); // spacer pushed the whole section
    expect(spacerHeightBefore(row)).toBeNull();   // no direct spacer on the row
    cleanup();
  });

  // ── Section + header: header itself straddles ──────────────────────────────

  it("inserts a spacer before the section when the header straddles a page boundary", () => {
    // Section top=270; header top=270 h=40 → bottom=310 > 297 (straddles!)
    // First row top=315, h=80 → bottom=395
    // Section spacer = 297−270 = 27
    const { section, rowsWrapper } = makeSection(270, 40);
    const row = addRow(rowsWrapper, 315, 80, true);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(section)).toBe(27);
    expect(spacerHeightBefore(row)).toBeNull();
    cleanup();
  });

  // ── Section + header: orphan header (different pages, no straddling) ───────

  it("inserts a spacer before the section when the header and first row are on different pages", () => {
    // Section top=270; header top=270 h=20 → bottom=290 (page 0)
    // First row raw top=300 → adjusted=300; floor(300/297)=1 (page 1)
    // headerPageIndex=0 ≠ rowPageIndex=1 → orphan → section spacer = 297−270 = 27
    const { section, rowsWrapper } = makeSection(270, 20);
    const row = addRow(rowsWrapper, 300, 80, true);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(section)).toBe(27);
    expect(spacerHeightBefore(row)).toBeNull();
    cleanup();
  });

  // ── Section without a header ───────────────────────────────────────────────

  it("inserts spacer before the row (not the section) when the section has no header", () => {
    // No data-pdf-section-header → no orphan check → only row-level logic applies
    const { section, rowsWrapper } = makeSection(220, null);
    // Row is NOT marked as data-pdf-first-row because there is no header
    const row = addRow(rowsWrapper, 250, 100);
    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(section)).toBeNull(); // section untouched
    expect(spacerHeightBefore(row)).toBe(47);       // 297−250
    cleanup();
  });

  // ── Guard: section already at a page boundary ──────────────────────────────

  it("falls back to a row-level spacer when the section starts at the top of the page (section spacer would equal a full page)", () => {
    // sectionTop=0 → spacerHeight would be 297 = pageHeight → guard fires → no section spacer
    // Row still straddles → row gets its own spacer: 297−255 = 42
    const { rowsWrapper } = makeSection(0, 30);
    const row = addRow(rowsWrapper, 255, 100, true);
    const cleanup = insertPageBreakSpacers(container);
    const sectionEl = container.querySelector("[data-pdf-section]") as HTMLElement;
    expect(spacerHeightBefore(sectionEl)).toBeNull(); // guard prevented section spacer
    expect(spacerHeightBefore(row)).toBe(42);          // row got its own spacer
    cleanup();
  });

  // ── Multiple sections ──────────────────────────────────────────────────────

  it("handles multiple sections independently with correct addedHeight tracking", () => {
    // Section 1: top=220, header h=30; first row top=255 h=100 → straddles
    //   → section spacer = 297−220 = 77; addedHeight = 77
    //
    // Section 2: raw top=450 → adjusted = 527 (page 1: 297–594)
    //   Header: adjusted top=527, bottom=557 (page 1)
    //   Row 2:  raw top=550 → adjusted=627 (page 2: 594–891)
    //   headerOrphaned: page 1 ≠ page 2 → section spacer = 594−527 = 67
    const { section: s1, rowsWrapper: rw1 } = makeSection(220, 30);
    addRow(rw1, 255, 100, true);

    const { section: s2, rowsWrapper: rw2 } = makeSection(450, 30);
    addRow(rw2, 550, 80, true);

    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(s1)).toBe(77);
    expect(spacerHeightBefore(s2)).toBe(67);
    cleanup();
  });

  it("only inserts one section spacer even if a section has multiple rows", () => {
    // Section with 3 rows; only the first (data-pdf-first-row) triggers the section check.
    // processedSections prevents double-insertion for the same section.
    //
    // Section spacer = 297−220 = 77; addedHeight=77
    // Row 1 adjusted: 255+77=332, bottom=432 < 594 ✓
    // Row 2 adjusted: 380+77=457, bottom=507 < 594 ✓   (height=50 keeps it on page 2)
    // Row 3 adjusted: 440+77=517, bottom=557 < 594 ✓   (height=40 keeps it on page 2)
    const { section, rowsWrapper } = makeSection(220, 30);
    addRow(rowsWrapper, 255, 100, true); // first row → triggers section spacer
    addRow(rowsWrapper, 380, 50);        // second row → fits on page 2 after push
    addRow(rowsWrapper, 440, 40);        // third row  → fits on page 2 after push

    const cleanup = insertPageBreakSpacers(container);
    expect(spacerHeightBefore(section)).toBe(77); // exactly one section spacer

    // Count total spacers inserted into the entire container
    const allDivs = Array.from(container.querySelectorAll("div"));
    const spacers = allDivs.filter((d) => (d as HTMLElement).style.height);
    // Only the section spacer; rows 2 & 3 don't straddle after the push.
    expect(spacers.length).toBe(1);
    cleanup();
  });
});
