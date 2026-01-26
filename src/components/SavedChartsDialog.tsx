import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChordChartMetadata } from "@/types/chordChart";
import { listCharts, deleteChart } from "@/services/storage";
import { Trash2, FileText, Loader2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteChart(id);
      setCharts(charts.filter((c) => c.id !== id));
      toast.success("Chart deleted");
    } catch (error) {
      console.error("Failed to delete chart:", error);
      toast.error("Failed to delete chart");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saved Charts</DialogTitle>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(chart.id, e)}
                    disabled={deletingId === chart.id}
                  >
                    {deletingId === chart.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
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
