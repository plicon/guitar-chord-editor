import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrintableSongSheet } from "@/components/PrintableSongSheet";
import { Song } from "@/types/song";
import { Download } from "lucide-react";

interface PreviewSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song;
  onDownloadPDF: () => void;
}

export const PreviewSongDialog = ({
  open,
  onOpenChange,
  song,
  onDownloadPDF,
}: PreviewSongDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white text-gray-900 border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Print Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview of your song before downloading as PDF
          </DialogDescription>
        </DialogHeader>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <PrintableSongSheet song={song} />
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
};
