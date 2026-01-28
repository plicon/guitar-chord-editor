import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChordDiagram, createEmptyChord, isChordEdited } from "@/types/chord";
import { ChordEditor } from "@/components/ChordEditor";
import { PrintableSheet } from "@/components/PrintableSheet";
import { StrummingPatternEditor } from "@/components/StrummingPatternEditor";
import { SavedChartsDialog } from "@/components/SavedChartsDialog";
import { AppHeader } from "@/components/AppHeader";
import { ChartMetadataSection } from "@/components/ChartMetadataSection";
import { ChordGridSection } from "@/components/ChordGridSection";
import { PreviewDialog } from "@/components/PreviewDialog";
import { Download, Eye } from "lucide-react";
import { useChartState } from "@/hooks/useChartState";
import { useChordDragAndDrop } from "@/hooks/useChordDragAndDrop";
import { usePdfExport } from "@/hooks/usePdfExport";

const Index = () => {
  const [state, actions] = useChartState();
  const [editingChord, setEditingChord] = useState<{
    rowIndex: number;
    chordIndex: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [strummingEditorOpen, setStrummingEditorOpen] = useState(false);
  const [savedChartsOpen, setSavedChartsOpen] = useState(false);

  // Internal rows state for drag and drop (synced with chart state)
  const [localRows, setLocalRows] = useState(state.rows);
  
  // Keep local rows in sync with chart state
  if (state.rows !== localRows && !editingChord) {
    setLocalRows(state.rows);
  }

  const handleRowsChange = useCallback((newRows: ChordDiagram[][]) => {
    setLocalRows(newRows);
    // Update the chart state rows through a chord save
    newRows.forEach((row, rowIndex) => {
      row.forEach((chord, chordIndex) => {
        if (state.rows[rowIndex]?.[chordIndex]?.id !== chord.id) {
          actions.handleSaveChord(chord, rowIndex, chordIndex);
        }
      });
    });
  }, [state.rows, actions]);

  const {
    sensors,
    activeChord,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useChordDragAndDrop(state.rows, handleRowsChange);

  // Use a dedicated ref for the always-mounted hidden PrintableSheet
  const hiddenPrintRef = useRef<HTMLDivElement>(null);
  const { handleDownloadPDF } = usePdfExport(state.title, hiddenPrintRef);

  const handleChordClick = useCallback((rowIndex: number, chordIndex: number) => {
    setEditingChord({ rowIndex, chordIndex });
  }, []);

  const handleSaveChord = useCallback((chord: ChordDiagram) => {
    if (editingChord) {
      actions.handleSaveChord(chord, editingChord.rowIndex, editingChord.chordIndex);
    }
  }, [editingChord, actions]);

  const handleLoadChart = async (id: string) => {
    await actions.handleLoadChart(id);
    setSavedChartsOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onNew={actions.handleNewChart}
        onOpen={() => setSavedChartsOpen(true)}
        onSave={actions.handleSave}
        onExport={actions.handleExportJson}
        onImport={actions.handleImportJson}
        isSaving={state.isSaving}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          <ChartMetadataSection
            title={state.title}
            description={state.description}
            strummingPattern={state.strummingPattern}
            onTitleChange={actions.setTitle}
            onDescriptionChange={actions.setDescription}
            onStrummingEditorOpen={() => setStrummingEditorOpen(true)}
          />

          <ChordGridSection
            rows={state.rows}
            rowSubtitles={state.rowSubtitles}
            chordsPerRow={state.chordsPerRow}
            activeChord={activeChord}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onChordClick={handleChordClick}
            onRowSubtitleChange={actions.handleRowSubtitleChange}
            onRemoveRow={actions.removeRow}
            onAddRow={actions.addRow}
            onChordsPerRowChange={actions.handleChordsPerRowChange}
          />

          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!actions.hasEditedChords}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleDownloadPDF} disabled={!actions.hasEditedChords}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {!actions.hasEditedChords && (
            <p className="text-center text-muted-foreground text-sm">
              Click on a chord diagram above to start adding chords
            </p>
          )}
        </div>
      </main>

      {/* Chord Editor Dialog */}
      {editingChord && (
        <ChordEditor
          chord={state.rows[editingChord.rowIndex][editingChord.chordIndex]}
          open={true}
          onClose={() => setEditingChord(null)}
          onSave={handleSaveChord}
        />
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={state.title}
        description={state.description}
        rows={state.rows}
        rowSubtitles={state.rowSubtitles}
        strummingPattern={state.strummingPattern}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Strumming Pattern Editor */}
      <StrummingPatternEditor
        pattern={state.strummingPattern}
        open={strummingEditorOpen}
        onClose={() => setStrummingEditorOpen(false)}
        onSave={actions.setStrummingPattern}
        onDelete={() => {
          actions.setStrummingPattern(null);
          setStrummingEditorOpen(false);
        }}
      />

      {/* Saved Charts Dialog */}
      <SavedChartsDialog
        open={savedChartsOpen}
        onClose={() => setSavedChartsOpen(false)}
        onLoad={handleLoadChart}
      />

      {/* Hidden printable content - always mounted for reliable PDF export */}
      <div className="fixed left-[-9999px] top-0">
        <PrintableSheet
          ref={hiddenPrintRef}
          title={state.title}
          description={state.description}
          rows={state.rows}
          rowSubtitles={state.rowSubtitles}
          strummingPattern={state.strummingPattern}
        />
      </div>
    </div>
  );
};

export default Index;
