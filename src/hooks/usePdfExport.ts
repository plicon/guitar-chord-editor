import { useCallback, RefObject } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { sanitizeFilename } from "@/lib/utils";

export function usePdfExport(title: string, printRef: RefObject<HTMLDivElement | null>) {

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current) return;

    // Force load fonts by checking specific font faces used in the document
    if (document.fonts) {
      // Trigger font loading for system fonts
      await Promise.all([
        document.fonts.load('14px system-ui'),
        document.fonts.load('16px system-ui'),
        document.fonts.load('100px "Permanent Marker"'),
      ].map(p => p.catch(() => {}))); // Ignore errors if fonts don't exist
      
      // Wait for all fonts to be ready
      await document.fonts.ready;
    }
    
    // Increased delay to ensure SVGs and fonts are fully rendered
    // This is especially important for production environments
    await new Promise(resolve => setTimeout(resolve, 300));

    // Debug logging (can be removed after testing)
    if (typeof console !== 'undefined' && console.log) {
      console.log('PDF Export Debug:', {
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
        fonts: document.fonts ? Array.from(document.fonts.values()).map(f => ({
          family: f.family,
          status: f.status
        })) : 'N/A',
        elementSize: {
          width: printRef.current.offsetWidth,
          height: printRef.current.offsetHeight
        }
      });
    }

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: false,
      removeContainer: true,
      imageTimeout: 0,
      // Force synchronous SVG rendering
      foreignObjectRendering: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    // Only add additional pages if content height significantly exceeds one page (margin of 1mm)
    let heightLeft = imgHeight - pageHeight;
    let position = -pageHeight;

    while (heightLeft > 1) {
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
    }

    pdf.save(`${sanitizeFilename(title || "chord-chart")}.pdf`);
  }, [title]);

  return {
    handleDownloadPDF,
  };
}
