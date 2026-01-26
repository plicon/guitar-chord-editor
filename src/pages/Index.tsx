import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChordDiagram, createEmptyChord, isChordEdited } from "@/types/chord";
import { ChordRow } from "@/components/ChordRow";
import { ChordEditor } from "@/components/ChordEditor";
import { PrintableSheet } from "@/components/PrintableSheet";
import { Plus, Download, Eye, Music, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const createRow = (startId: number, chordsPerRow: number): ChordDiagram[] => 
  Array.from({ length: chordsPerRow }, (_, i) => 
    createEmptyChord(`chord-${startId + i}`)
  );

const Index = () => {
  const [title, setTitle] = useState("My Chord Chart");
  const [chordsPerRow, setChordsPerRow] = useState(4);
  const [rows, setRows] = useState<ChordDiagram[][]>([createRow(0, 4)]);
  const [editingChord, setEditingChord] = useState<{
    rowIndex: number;
    chordIndex: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleChordsPerRowChange = (newCount: number) => {
    if (newCount < 1 || newCount > 5) return;
    setChordsPerRow(newCount);
    // Adjust existing rows to match new count
    setRows(rows.map((row, rowIndex) => {
      const baseId = rowIndex * 5;
      if (row.length < newCount) {
        // Add more chords
        return [...row, ...Array.from({ length: newCount - row.length }, (_, i) => 
          createEmptyChord(`chord-${baseId + row.length + i}`)
        )];
      } else if (row.length > newCount) {
        // Remove excess chords
        return row.slice(0, newCount);
      }
      return row;
    }));
  };

  const addRow = () => {
    if (rows.length < 5) {
      const nextId = rows.length * 5;
      setRows([...rows, createRow(nextId, chordsPerRow)]);
    }
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleChordClick = (rowIndex: number, chordIndex: number) => {
    setEditingChord({ rowIndex, chordIndex });
  };

  const handleSaveChord = (chord: ChordDiagram) => {
    if (editingChord) {
      const newRows = [...rows];
      newRows[editingChord.rowIndex][editingChord.chordIndex] = chord;
      setRows(newRows);
    }
  };

  const handleDownloadPDF = async () => {
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
  };

  const hasEditedChords = rows.some((row) => row.some(isChordEdited));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Guitar Chord Creator
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Create and print beautiful chord diagrams
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Chart Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chart title..."
              className="text-xl font-semibold"
            />
          </div>

          {/* Chord Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Chord Diagrams
              </h2>
              <span className="text-sm text-muted-foreground">
                Click on a chord to edit
              </span>
            </div>

            <div className="space-y-4">
              {rows.map((row, rowIndex) => (
                <ChordRow
                  key={rowIndex}
                  chords={row}
                  onChordClick={(chordIndex) =>
                    handleChordClick(rowIndex, chordIndex)
                  }
                  onRemove={() => removeRow(rowIndex)}
                  showRemove={rows.length > 1}
                />
              ))}
            </div>

            {/* Chords per row control */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <span className="text-sm text-muted-foreground">Chords per row:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleChordsPerRowChange(chordsPerRow - 1)}
                  disabled={chordsPerRow <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-6 text-center font-medium">{chordsPerRow}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleChordsPerRowChange(chordsPerRow + 1)}
                  disabled={chordsPerRow >= 5}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {rows.length < 5 && (
              <Button
                variant="outline"
                onClick={addRow}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Row ({rows.length}/5)
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!hasEditedChords}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleDownloadPDF} disabled={!hasEditedChords}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {!hasEditedChords && (
            <p className="text-center text-muted-foreground text-sm">
              Click on a chord diagram above to start adding chords
            </p>
          )}
        </div>
      </main>

      {/* Chord Editor Dialog */}
      {editingChord && (
        <ChordEditor
          chord={rows[editingChord.rowIndex][editingChord.chordIndex]}
          open={true}
          onClose={() => setEditingChord(null)}
          onSave={handleSaveChord}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Print Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <PrintableSheet ref={printRef} title={title} rows={rows} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden printable content */}
      <div className="fixed left-[-9999px] top-0">
        <PrintableSheet ref={printRef} title={title} rows={rows} />
      </div>
    </div>
  );
};

export default Index;
