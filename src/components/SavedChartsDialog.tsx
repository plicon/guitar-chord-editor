import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChordChartMetadata } from "@/types/chordChart";
import { listCharts } from "@/services/storage";
import { FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SavedChartsDialogProps {
  open: boolean;
  onClose: () => void;
  onLoad: (id: string) => void;
}

export const SavedChartsDialog = ({ open, onClose, onLoad }: SavedChartsDialogProps) => {
  const [charts, setCharts] = useState<ChordChartMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (open) {
      loadCharts();
    }
  }, [open]);

  const loadCharts = async () => {
    setLoading(true);
    try {
      const savedCharts = await listCharts();
      setCharts(savedCharts);
    } catch (error) {
      console.error("Failed to load charts:", error);
      toast.error("Failed to load saved charts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saved Charts</DialogTitle>
          <DialogDescription className="sr-only">
            Browse and manage your saved chord charts
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : charts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No saved charts yet</p>
            <p className="text-sm">Create a chart and click Save to store it</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onLoad(chart.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chart.title || chart.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(chart.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
