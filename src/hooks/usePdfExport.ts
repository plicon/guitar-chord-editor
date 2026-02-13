import { useCallback, RefObject } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { sanitizeFilename } from "@/lib/utils";

export function usePdfExport(title: string, printRef: RefObject<HTMLDivElement | null>) {

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
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
