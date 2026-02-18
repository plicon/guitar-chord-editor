import { useCallback, RefObject } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { sanitizeFilename } from "@/lib/utils";

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

export function usePdfExport(title: string, printRef: RefObject<HTMLDivElement | null>) {

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

    // Small delay for replaced images to settle in the DOM
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // A4 dimensions in mm
      const PAGE_WIDTH_MM = 210;
      const PAGE_HEIGHT_MM = 297;
      const MARGIN_MM = 4; // Match the p-4 padding
      const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - (MARGIN_MM * 2);
      const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - (MARGIN_MM * 2);
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

      // Fallback: if no sections found, use old single-capture method
      if (sections.length === 0) {
        const canvas = await html2canvas(printRef.current, html2canvasOptions);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgWidth = PAGE_WIDTH_MM;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`${sanitizeFilename(title || "chord-chart")}.pdf`);
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let currentY = MARGIN_MM;
      let isFirstSection = true;

      for (const section of sections) {
        const canvas = await html2canvas(section, html2canvasOptions);

        // Calculate dimensions of the captured section in mm
        const widthPx = canvas.width / 2; // html2canvas scale is 2
        const heightPx = canvas.height / 2;
        const scaleFactor = CONTENT_WIDTH_MM / widthPx;
        const heightMM = heightPx * scaleFactor;

        const remainingSpace = PAGE_HEIGHT_MM - MARGIN_MM - currentY;

        // If the section won't fit and we're not at the top of the page, add a new page
        if (heightMM > remainingSpace && !isFirstSection && currentY > MARGIN_MM) {
          pdf.addPage();
          currentY = MARGIN_MM;
        }

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);

        currentY += heightMM + SECTION_GAP_MM;
        isFirstSection = false;
      }

      pdf.save(`${sanitizeFilename(title || "chord-chart")}.pdf`);
    } finally {
      // Always restore original SVGs so the UI isn't broken
      restoreSvgs();
    }
  }, [title]);

  return {
    handleDownloadPDF,
  };
}
