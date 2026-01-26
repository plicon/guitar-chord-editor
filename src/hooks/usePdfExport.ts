import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function usePdfExport(title: string) {
  const printRef = useRef<HTMLDivElement>(null);

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

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`${title || "chord-chart"}.pdf`);
  }, [title]);

  return {
    printRef,
    handleDownloadPDF,
  };
}
