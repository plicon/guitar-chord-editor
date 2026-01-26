import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChordDiagram, createEmptyChord, isChordEdited } from "@/types/chord";
import { StrummingPattern, hasStrummingContent } from "@/types/strumming";
import { ChordChart, createChordChart } from "@/types/chordChart";
import { ChordRow } from "@/components/ChordRow";
import { ChordEditor } from "@/components/ChordEditor";
import { PrintableSheet } from "@/components/PrintableSheet";
import { StrummingPatternEditor } from "@/components/StrummingPatternEditor";
import { StrummingPatternDisplay } from "@/components/StrummingPatternDisplay";
import { SavedChartsDialog } from "@/components/SavedChartsDialog";
import { Plus, Download, Eye, Music, Minus, ListMusic, Pencil, Save, FolderOpen, FileDown, FileUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ChordDiagramComponent } from "@/components/ChordDiagram";
import { 
  saveChart, 
  loadChart, 
  downloadChartAsJson, 
  importChartFromJson 
} from "@/services/storage";
import { toast } from "sonner";

const createRow = (startId: number, chordsPerRow: number): ChordDiagram[] => 
  Array.from({ length: chordsPerRow }, (_, i) => 
    createEmptyChord(`chord-${Date.now()}-${startId + i}`)
  );

const Index = () => {
  const [currentChartId, setCurrentChartId] = useState<string | null>(null);
  const [title, setTitle] = useState("My Chord Chart");
  const [description, setDescription] = useState("");
  const [chordsPerRow, setChordsPerRow] = useState(4);
  const [rows, setRows] = useState<ChordDiagram[][]>([createRow(0, 4)]);
  const [rowSubtitles, setRowSubtitles] = useState<string[]>([""]);
  const [editingChord, setEditingChord] = useState<{
    rowIndex: number;
    chordIndex: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeChord, setActiveChord] = useState<ChordDiagram | null>(null);
  const [strummingPattern, setStrummingPattern] = useState<StrummingPattern | null>(null);
  const [strummingEditorOpen, setStrummingEditorOpen] = useState(false);
  const [savedChartsOpen, setSavedChartsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Create current chart object
  const getCurrentChart = useCallback((): ChordChart => {
    const chart = createChordChart(
      title,
      description,
      chordsPerRow,
      rows,
      rowSubtitles,
      strummingPattern
    );
    if (currentChartId) {
      chart.id = currentChartId;
    }
    return chart;
  }, [title, description, chordsPerRow, rows, rowSubtitles, strummingPattern, currentChartId]);

  // Load chart into editor
  const loadChartIntoEditor = useCallback((chart: ChordChart) => {
    setCurrentChartId(chart.id);
    setTitle(chart.title);
    setDescription(chart.description);
    setChordsPerRow(chart.chordsPerRow);
    setRows(chart.rows);
    setRowSubtitles(chart.rowSubtitles);
    setStrummingPattern(chart.strummingPattern);
  }, []);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const chart = getCurrentChart();
      await saveChart(chart);
      setCurrentChartId(chart.id);
      toast.success("Chart saved successfully!");
    } catch (error) {
      console.error("Failed to save chart:", error);
      toast.error("Failed to save chart");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle load from saved charts
  const handleLoadChart = async (id: string) => {
    try {
      const chart = await loadChart(id);
      if (chart) {
        loadChartIntoEditor(chart);
        setSavedChartsOpen(false);
        toast.success("Chart loaded successfully!");
      }
    } catch (error) {
      console.error("Failed to load chart:", error);
      toast.error("Failed to load chart");
    }
  };

  // Handle JSON export
  const handleExportJson = () => {
    const chart = getCurrentChart();
    downloadChartAsJson(chart);
    toast.success("Chart exported as JSON");
  };

  // Handle JSON import
  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const chart = importChartFromJson(json);
        loadChartIntoEditor(chart);
        await saveChart(chart);
        toast.success("Chart imported successfully!");
      } catch (error) {
        console.error("Failed to import chart:", error);
        toast.error("Failed to import chart. Invalid format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be imported again
    event.target.value = "";
  };

  // Handle new chart
  const handleNewChart = () => {
    setCurrentChartId(null);
    setTitle("My Chord Chart");
    setDescription("");
    setChordsPerRow(4);
    setRows([createRow(0, 4)]);
    setRowSubtitles([""]);
    setStrummingPattern(null);
    toast.success("New chart created");
  };

  const handleChordsPerRowChange = (newCount: number) => {
    if (newCount < 1 || newCount > 5) return;
    setChordsPerRow(newCount);
    setRows(rows.map((row, rowIndex) => {
      const baseId = rowIndex * 5;
      if (row.length < newCount) {
        return [...row, ...Array.from({ length: newCount - row.length }, (_, i) => 
          createEmptyChord(`chord-${Date.now()}-${baseId + row.length + i}`)
        )];
      } else if (row.length > newCount) {
        return row.slice(0, newCount);
      }
      return row;
    }));
  };

  const addRow = () => {
    const nextId = rows.length * 5;
    setRows([...rows, createRow(nextId, chordsPerRow)]);
    setRowSubtitles([...rowSubtitles, ""]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
      setRowSubtitles(rowSubtitles.filter((_, i) => i !== index));
    }
  };

  const handleRowSubtitleChange = (index: number, value: string) => {
    const newSubtitles = [...rowSubtitles];
    newSubtitles[index] = value;
    setRowSubtitles(newSubtitles);
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

  const findChordPosition = (chordId: string): { rowIndex: number; chordIndex: number } | null => {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const chordIndex = rows[rowIndex].findIndex((c) => c.id === chordId);
      if (chordIndex !== -1) {
        return { rowIndex, chordIndex };
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const position = findChordPosition(active.id as string);
    if (position) {
      setActiveChord(rows[position.rowIndex][position.chordIndex]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activePos = findChordPosition(activeId);
    let overPos = findChordPosition(overId);

    if (!overPos && overId.startsWith("row-")) {
      const targetRowIndex = parseInt(overId.replace("row-", ""));
      if (activePos && targetRowIndex !== activePos.rowIndex) {
        overPos = { rowIndex: targetRowIndex, chordIndex: rows[targetRowIndex].length };
      }
    }

    if (!activePos || !overPos) return;

    if (activePos.rowIndex === overPos.rowIndex) {
      const newRows = [...rows];
      const row = [...newRows[activePos.rowIndex]];
      const [movedChord] = row.splice(activePos.chordIndex, 1);
      row.splice(overPos.chordIndex, 0, movedChord);
      newRows[activePos.rowIndex] = row;
      setRows(newRows);
    } else {
      const newRows = [...rows];
      const sourceRow = [...newRows[activePos.rowIndex]];
      const targetRow = [...newRows[overPos.rowIndex]];

      const [movedChord] = sourceRow.splice(activePos.chordIndex, 1);
      sourceRow.push(createEmptyChord(`chord-${Date.now()}-placeholder`));

      const emptyIndex = targetRow.findIndex((c) => !isChordEdited(c));
      if (emptyIndex !== -1) {
        targetRow[emptyIndex] = movedChord;
      } else {
        targetRow.splice(overPos.chordIndex, 0, movedChord);
        targetRow.pop();
      }

      newRows[activePos.rowIndex] = sourceRow;
      newRows[overPos.rowIndex] = targetRow;
      setRows(newRows);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveChord(null);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Guitar Chord Creator
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleNewChart}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSavedChartsOpen(true)}>
                <FolderOpen className="w-4 h-4 mr-1" />
                Open
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJson}>
                <FileDown className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="w-4 h-4 mr-1" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <ThemeToggle />
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Create and print beautiful chord diagrams
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title and Strumming Pattern Section */}
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
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
            </div>
            
            {/* Description Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description / Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes, tuning info, or instructions..."
                rows={3}
                className="resize-none"
              />
              <Button
                variant="outline"
                onClick={() => setStrummingEditorOpen(true)}
              >
                <ListMusic className="w-4 h-4 mr-2" />
                {strummingPattern ? "Edit Pattern" : "Add Strumming Pattern"}
              </Button>
            </div>

            {/* Strumming Pattern Display */}
            {hasStrummingContent(strummingPattern) && strummingPattern && (
              <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Strumming:
                </span>
                <StrummingPatternDisplay pattern={strummingPattern} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-auto"
                  onClick={() => setStrummingEditorOpen(true)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Chord Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Chord Diagrams
              </h2>
              <span className="text-sm text-muted-foreground">
                Drag to reorder • Click to edit
              </span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4">
                {rows.map((row, rowIndex) => (
                  <ChordRow
                    key={rowIndex}
                    chords={row}
                    rowIndex={rowIndex}
                    subtitle={rowSubtitles[rowIndex] || ""}
                    onSubtitleChange={(value) => handleRowSubtitleChange(rowIndex, value)}
                    onChordClick={(chordIndex) =>
                      handleChordClick(rowIndex, chordIndex)
                    }
                    onRemove={() => removeRow(rowIndex)}
                    showRemove={rows.length > 1}
                  />
                ))}
              </div>
              
              <DragOverlay>
                {activeChord ? (
                  <div className="opacity-90 scale-105">
                    <ChordDiagramComponent
                      chord={activeChord}
                      size="md"
                      showPlaceholder={true}
                      printMode={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

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

            <Button
              variant="outline"
              onClick={addRow}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
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
            <PrintableSheet ref={printRef} title={title} description={description} rows={rows} rowSubtitles={rowSubtitles} strummingPattern={strummingPattern} />
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

      {/* Strumming Pattern Editor */}
      <StrummingPatternEditor
        pattern={strummingPattern}
        open={strummingEditorOpen}
        onClose={() => setStrummingEditorOpen(false)}
        onSave={setStrummingPattern}
        onDelete={() => {
          setStrummingPattern(null);
          setStrummingEditorOpen(false);
        }}
      />

      {/* Saved Charts Dialog */}
      <SavedChartsDialog
        open={savedChartsOpen}
        onClose={() => setSavedChartsOpen(false)}
        onLoad={handleLoadChart}
      />

      {/* Hidden printable content */}
      <div className="fixed left-[-9999px] top-0">
        <PrintableSheet ref={printRef} title={title} description={description} rows={rows} rowSubtitles={rowSubtitles} strummingPattern={strummingPattern} />
      </div>
    </div>
  );
};

export default Index;
