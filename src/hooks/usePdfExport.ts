import { useCallback, RefObject } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { sanitizeFilename } from "@/lib/utils";
import { APP_VERSION } from "@/config/version";

/**
 * Pre-rasterizes all SVG elements inside a container to PNG images.
 * This is necessary because html2canvas has known issues with SVG rendering,
 * producing misaligned elements (nut, fingers, barres) especially in
 * production environments. By converting SVGs to images first, html2canvas
 * only needs to handle raster images which it does reliably.
 * 
 * Returns a cleanup function that restores the original SVGs.
 */
function rasterizeSvgs(container: HTMLElement): () => void {
  const svgs = container.querySelectorAll('svg');
  const restorations: Array<() => void> = [];

  svgs.forEach((svg) => {
    const svgRect = svg.getBoundingClientRect();
    if (svgRect.width === 0 || svgRect.height === 0) return;

    // Scale factor for crisp rendering
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Serialize the SVG to a string
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    // Ensure the SVG has explicit dimensions and namespace
    svgClone.setAttribute('width', String(svgRect.width));
    svgClone.setAttribute('height', String(svgRect.height));
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.width = svgRect.width;
    img.height = svgRect.height;

    // Create a promise-like pattern using the image's onload
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height);
      URL.revokeObjectURL(url);

      // Convert canvas to an img element
      const replacementImg = document.createElement('img');
      replacementImg.src = canvas.toDataURL('image/png');
      replacementImg.width = svgRect.width;
      replacementImg.height = svgRect.height;
      replacementImg.style.display = 'block';

      // Replace SVG with img
      const parent = svg.parentNode;
      if (parent) {
        parent.replaceChild(replacementImg, svg);
        restorations.push(() => {
          parent.replaceChild(svg, replacementImg);
        });
      }
    };

    img.src = url;
  });

  return () => {
    restorations.forEach((restore) => restore());
  };
}

/**
 * Waits for all SVGs inside a container to be rasterized to images.
 * Returns a cleanup function to restore original SVGs.
 */
async function rasterizeSvgsAsync(container: HTMLElement): Promise<() => void> {
  const svgs = Array.from(container.querySelectorAll('svg'));
  const restorations: Array<() => void> = [];

  await Promise.all(svgs.map((svg) => {
    return new Promise<void>((resolve) => {
      const svgRect = svg.getBoundingClientRect();
      if (svgRect.width === 0 || svgRect.height === 0) {
        resolve();
        return;
      }

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = svgRect.width * scale;
      canvas.height = svgRect.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      // Clone and serialize SVG
      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', String(svgRect.width));
      svgClone.setAttribute('height', String(svgRect.height));
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();

      img.onload = () => {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height);
        URL.revokeObjectURL(url);

        const replacementImg = document.createElement('img');
        replacementImg.src = canvas.toDataURL('image/png');
        replacementImg.width = svgRect.width;
        replacementImg.height = svgRect.height;
        replacementImg.style.display = 'block';

        const parent = svg.parentNode;
        if (parent) {
          parent.replaceChild(replacementImg, svg);
          restorations.push(() => {
            parent.replaceChild(svg, replacementImg);
          });
        }
        resolve();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(); // Don't block on errors, let html2canvas try the SVG
      };

      img.src = url;
    });
  }));

  return () => {
    restorations.forEach((restore) => restore());
  };
}

/**
 * Inserts spacer divs to prevent two kinds of page-split problems:
 *
 * 1. Row split: a [data-pdf-avoid-break] row straddles a page boundary.
 *    Fix: insert a spacer before the row to push it onto the next page.
 *
 * 2. Orphan header: a section header ([data-pdf-section-header] inside
 *    [data-pdf-section]) ends up on a different page than its first row
 *    ([data-pdf-first-row]), OR the header itself straddles a page boundary.
 *    Fix: insert a spacer before the entire section container so the header
 *    and its first row both start on the same new page.
 *
 * All positions are computed up-front (before any DOM mutation) and a running
 * `addedHeight` counter keeps subsequent elements correctly positioned as
 * spacers accumulate. Spacers are inserted in a second pass to avoid
 * invalidating getBoundingClientRect mid-loop.
 *
 * Returns a cleanup function that removes every inserted spacer.
 */
export function insertPageBreakSpacers(container: HTMLElement): () => void {
  const containerRect = container.getBoundingClientRect();
  // A4 page height in DOM pixels, proportional to the container's rendered width
  const pageHeightPx = containerRect.width * (297 / 210);

  const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-avoid-break]'));

  // Sections that have already received a section-level spacer – prevents a
  // second spacer if somehow multiple rows in the same section are processed.
  const processedSections = new Set<HTMLElement>();

  const insertions: { target: HTMLElement; spacerHeight: number }[] = [];
  let addedHeight = 0;

  for (const row of rows) {
    const rowRect = row.getBoundingClientRect();
    // Adjusted position accounts for spacers planned (but not yet inserted) above.
    let rowTop = rowRect.top - containerRect.top + addedHeight;
    const rowHeight = rowRect.height;

    // ── Concern 1: orphan section header ────────────────────────────────────
    // Only applies to rows explicitly marked as the first row of a section that
    // has a visible header.  When triggered we move the *whole section* rather
    // than just the row so the header travels with its content.
    if (row.hasAttribute('data-pdf-first-row')) {
      const sectionEl = row.closest<HTMLElement>('[data-pdf-section]');
      const headerEl = sectionEl?.querySelector<HTMLElement>('[data-pdf-section-header]');

      if (sectionEl && headerEl && !processedSections.has(sectionEl) && rowHeight < pageHeightPx) {
        const headerRect = headerEl.getBoundingClientRect();
        const headerTop  = headerRect.top - containerRect.top + addedHeight;
        const headerBottom = headerTop + headerRect.height;
        const headerPageIndex  = Math.floor(headerTop / pageHeightPx);
        const headerPageBottom = (headerPageIndex + 1) * pageHeightPx;

        const rowPageIndex  = Math.floor(rowTop / pageHeightPx);
        const rowBottom     = rowTop + rowHeight;
        const rowPageBottom = (rowPageIndex + 1) * pageHeightPx;

        const headerStraddles = headerBottom > headerPageBottom;
        // Header and first row land on different pages (orphan)
        const headerOrphaned  = headerPageIndex !== rowPageIndex;
        const rowStraddles    = rowBottom > rowPageBottom;

        if (headerStraddles || headerOrphaned || rowStraddles) {
          const sectionRect  = sectionEl.getBoundingClientRect();
          const sectionTop   = sectionRect.top - containerRect.top + addedHeight;
          const sectionPageIndex  = Math.floor(sectionTop / pageHeightPx);
          const sectionPageBottom = (sectionPageIndex + 1) * pageHeightPx;
          const spacerHeight = sectionPageBottom - sectionTop;

          // Guard: don't insert a full-page spacer (would happen only if the
          // section already sits exactly at a page boundary – nothing to fix).
          if (spacerHeight > 0 && spacerHeight < pageHeightPx) {
            insertions.push({ target: sectionEl, spacerHeight });
            addedHeight += spacerHeight;
            // Update rowTop so the row-level check below uses the new position.
            rowTop += spacerHeight;
            processedSections.add(sectionEl);
          }
        }
      }
    }

    // ── Concern 2: row straddles a page boundary ─────────────────────────────
    // Applies to every row (including first rows – in case the section-level
    // push above wasn't enough, e.g. an unusually tall header).
    const rowBottom  = rowTop + rowHeight;
    const pageIndex  = Math.floor(rowTop / pageHeightPx);
    const pageBottom = (pageIndex + 1) * pageHeightPx;

    if (rowBottom > pageBottom && rowHeight < pageHeightPx) {
      const spacerHeight = pageBottom - rowTop;
      insertions.push({ target: row, spacerHeight });
      addedHeight += spacerHeight;
    }
  }

  // ── Insert all spacers in a single DOM pass ──────────────────────────────
  const spacers: HTMLElement[] = [];
  for (const { target, spacerHeight } of insertions) {
    const spacer = document.createElement('div');
    spacer.style.height = `${Math.ceil(spacerHeight)}px`;
    target.parentNode?.insertBefore(spacer, target);
    spacers.push(spacer);
  }

  return () => {
    spacers.forEach((spacer) => spacer.parentNode?.removeChild(spacer));
  };
}

export function usePdfExport(title: string, printRef: RefObject<HTMLDivElement | null>, artist?: string) {

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current) return;

    // Force load fonts used in the printable sheet
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('14px system-ui'),
        document.fonts.load('16px system-ui'),
        document.fonts.load('bold 16px system-ui'),
        document.fonts.load('100px "Permanent Marker"'),
      ].map(p => p.catch(() => {})));
      await document.fonts.ready;
    }

    // Small delay for initial rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Pre-rasterize all SVGs to images to avoid html2canvas SVG rendering issues
    const restoreSvgs = await rasterizeSvgsAsync(printRef.current);

    // Insert spacers to prevent rows from being sliced across page boundaries
    const restoreSpacers = insertPageBreakSpacers(printRef.current);

    // Small delay for replaced images and spacers to settle in the DOM
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // A4 dimensions in mm
      const PAGE_WIDTH_MM = 210;
      const PAGE_HEIGHT_MM = 297;
      const MARGIN_MM = 4; // Match the p-4 padding
      const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - (MARGIN_MM * 2);
      const FOOTER_HEIGHT_MM = 8; // Reserved space for footer
      const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - (MARGIN_MM * 2) - FOOTER_HEIGHT_MM;
      const SECTION_GAP_MM = 3;

      const html2canvasOptions = {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      };

      // Find all sections marked with data-pdf-section
      const sections = Array.from(
        printRef.current.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[];

      // Helper to draw page footer
      const drawPageFooter = (pdf: jsPDF, pageNum: number, totalPages: number) => {
        const footerY = PAGE_HEIGHT_MM - MARGIN_MM - 2;
        const lineY = footerY - 3;

        // Thin separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(MARGIN_MM, lineY, PAGE_WIDTH_MM - MARGIN_MM, lineY);

        // Left side: Song title + artist
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(130, 130, 130);
        const songLabel = artist ? `${title || "Chord Chart"} — ${artist}` : (title || "Chord Chart");
        pdf.text(songLabel, MARGIN_MM, footerY);

        // Center: URL
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        const url = "fretkit.io";
        const urlWidth = pdf.getTextWidth(url);
        pdf.text(url, (PAGE_WIDTH_MM - urlWidth) / 2, footerY);

        // Right side: version + page number
        const rightText = `v${APP_VERSION}  ·  ${pageNum} / ${totalPages}`;
        const rightWidth = pdf.getTextWidth(rightText);
        pdf.text(rightText, PAGE_WIDTH_MM - MARGIN_MM - rightWidth, footerY);
      };

      // Fallback: if no sections found, use old single-capture method
      if (sections.length === 0) {
        const canvas = await html2canvas(printRef.current, html2canvasOptions);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgWidth = PAGE_WIDTH_MM;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        drawPageFooter(pdf, 1, 1);
        pdf.save(`${sanitizeFilename(title || "chord-chart")}.pdf`);
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let currentY = MARGIN_MM;
      let isFirstSection = true;
      let pageCount = 1;

      for (const section of sections) {
        const canvas = await html2canvas(section, html2canvasOptions);

        // Calculate dimensions of the captured section in mm
        const widthPx = canvas.width / 2; // html2canvas scale is 2
        const heightPx = canvas.height / 2;
        const scaleFactor = CONTENT_WIDTH_MM / widthPx;
        const heightMM = heightPx * scaleFactor;

        const remainingSpace = PAGE_HEIGHT_MM - MARGIN_MM - FOOTER_HEIGHT_MM - currentY;

        // If the section won't fit and we're not at the top of the page, add a new page
        if (heightMM > remainingSpace && !isFirstSection && currentY > MARGIN_MM) {
          pdf.addPage();
          pageCount++;
          currentY = MARGIN_MM;
        }

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);

        currentY += heightMM + SECTION_GAP_MM;
        isFirstSection = false;
      }

      // Draw footers on all pages
      const totalPages = pageCount;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        drawPageFooter(pdf, i, totalPages);
      }

      pdf.save(`${sanitizeFilename(title || "chord-chart")}.pdf`);
    } finally {
      // Always restore original SVGs and remove spacers so the UI isn't broken
      restoreSvgs();
      restoreSpacers();
    }
  }, [title, artist, printRef]);

  return {
    handleDownloadPDF,
  };
}
