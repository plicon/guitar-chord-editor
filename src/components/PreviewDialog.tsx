import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrintableSheet } from "@/components/PrintableSheet";
import { ChordDiagram } from "@/types/chord";
import { StrummingPattern } from "@/types/strumming";
import { Download } from "lucide-react";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  rows: ChordDiagram[][];
  rowSubtitles: string[];
  strummingPattern: StrummingPattern | null;
  onDownloadPDF: () => void;
}

export const PreviewDialog = forwardRef<HTMLDivElement, PreviewDialogProps>(
  ({ open, onOpenChange, title, description, rows, rowSubtitles, strummingPattern, onDownloadPDF }, ref) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white text-gray-900 border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Print Preview</DialogTitle>
          </DialogHeader>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <PrintableSheet
              ref={ref}
              title={title}
              description={description}
              rows={rows}
              rowSubtitles={rowSubtitles}
              strummingPattern={strummingPattern}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Close
            </Button>
            <Button onClick={onDownloadPDF} className="bg-blue-600 text-white hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

PreviewDialog.displayName = "PreviewDialog";
