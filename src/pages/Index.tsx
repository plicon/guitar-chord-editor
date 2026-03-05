import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChordDiagram } from "@/types/chord";
import { ChordEditor } from "@/components/ChordEditor";
import { PrintableSheet } from "@/components/PrintableSheet";
import { PrintableSongSheet } from "@/components/PrintableSongSheet";
import { StrummingPatternEditor } from "@/components/StrummingPatternEditor";
import { SavedChartsDialog } from "@/components/SavedChartsDialog";
import { AppHeader } from "@/components/AppHeader";
import { ChartMetadataSection } from "@/components/ChartMetadataSection";
import { PreviewDialog } from "@/components/PreviewDialog";
import { PreviewSongDialog } from "@/components/PreviewSongDialog";
import { AppFooter } from "@/components/AppFooter";
import { SongSectionView } from "@/components/SongSectionView";
import { YouTubeImportDialog } from "@/components/YouTubeImportDialog";
import { Download, Eye, Plus } from "lucide-react";
import { useSongState } from "@/hooks/useSongState";
import { useChordPresetCache } from "@/hooks/useChordPresetCache";
import { usePdfExport } from "@/hooks/usePdfExport";
import { SectionType, SectionTypeLabels, Song, SongSection, SectionRow } from "@/types/song";
import { StrummingPattern } from "@/types/strumming";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to convert Song sections to rows format for preview/PDF
function songToRows(song: Song): { rows: ChordDiagram[][], rowSubtitles: string[], sectionIndices: number[], sectionTitles: string[] } {
  const rows: ChordDiagram[][] = [];
  const rowSubtitles: string[] = [];
  const sectionIndices: number[] = [];
  const sectionTitles: string[] = song.sections.map(s => s.name);
  
  song.sections.forEach((section, sectionIndex) => {
    section.rows.forEach(row => {
      if (row.kind === 'chord-row') {
        rows.push(row.chords);
        // Only include row-specific subtitles, not section names
        rowSubtitles.push(row.subtitle || '');
        sectionIndices.push(sectionIndex);
      }
    });
  });
  
  return { rows, rowSubtitles, sectionIndices, sectionTitles };
}


// Sortable section wrapper for drag and drop
interface SortableSectionProps {
  section: SongSection;
  sectionIndex: number;
  onToggleCollapsed: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<SongSection>) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddRow: (sectionId: string, rowType: 'chord-row' | 'tab-row') => void;
  onRemoveRow: (sectionId: string, rowId: string) => void;
  onChordClick: (sectionId: string, rowId: string, chordIndex: number) => void;
  onUpdateRowSubtitle: (sectionId: string, rowId: string, subtitle: string) => void;
  onUpdateRow: (sectionId: string, rowId: string, updates: Partial<SectionRow>) => void;
  onAddChordToRow: (sectionId: string, rowId: string) => void;
  onRemoveChordFromRow: (sectionId: string, rowId: string) => void;
  onDuplicateChord: (sectionId: string, rowId: string, chordIndex: number) => void;
  strummingPattern?: StrummingPattern | null;
  dragHandleProps?: ReturnType<typeof useSortable>['listeners'];
}

function SortableSection({ section, sectionIndex, dragHandleProps, ...props }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SongSectionView
        section={section}
        sectionIndex={sectionIndex}
        dragHandleProps={listeners}
        {...props}
      />
    </div>
  );
}

const Index = () => {
  const [state, actions] = useSongState();
  const { getPreset } = useChordPresetCache();
  const [editingChord, setEditingChord] = useState<{
    sectionId: string;
    rowId: string;
    chordIndex: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [strummingEditorOpen, setStrummingEditorOpen] = useState(false);
  const [savedChartsOpen, setSavedChartsOpen] = useState(false);
  const [youtubeImportOpen, setYoutubeImportOpen] = useState(false);
  // dnd-kit sensors — distance:8 ensures a tap/click is never mistaken for a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if it's a section drag
    const isSectionDrag = state.sections.some(s => s.id === activeId);
    if (isSectionDrag) {
      const oldIndex = state.sections.findIndex(s => s.id === activeId);
      const newIndex = state.sections.findIndex(s => s.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        actions.moveSection(oldIndex, newIndex);
      }
      return;
    }

    // It's a chord drag — find the row containing this chord and reorder
    for (const section of state.sections) {
      for (const row of section.rows) {
        if (row.kind !== 'chord-row') continue;
        const fromIndex = row.chords.findIndex(c => c.id === activeId);
        if (fromIndex !== -1) {
          const toIndex = row.chords.findIndex(c => c.id === overId);
          if (toIndex !== -1) {
            actions.reorderChordsInRow(section.id, row.id, fromIndex, toIndex);
          }
          return;
        }
      }
    }
  };

  // Use a dedicated ref for the always-mounted hidden PrintableSheet
  const hiddenPrintRef = useRef<HTMLDivElement>(null);
  const { handleDownloadPDF } = usePdfExport(state.title, hiddenPrintRef);

  const handleChordClick = useCallback((sectionId: string, rowId: string, chordIndex: number) => {
    setEditingChord({ sectionId, rowId, chordIndex });
  }, []);

  const handleSaveChord = useCallback((chord: ChordDiagram) => {
    if (editingChord) {
      actions.updateChord(
        editingChord.sectionId,
        editingChord.rowId,
        editingChord.chordIndex,
        chord
      );
    }
  }, [editingChord, actions]);

  const handleLoadSong = async (id: string) => {
    await actions.handleLoadSong(id);
    setSavedChartsOpen(false);
  };

  // Get current chord for editing
  const currentChord = editingChord ? (() => {
    const section = state.sections.find(s => s.id === editingChord.sectionId);
    const row = section?.rows.find(r => r.id === editingChord.rowId);
    if (row && row.kind === 'chord-row') {
      return row.chords[editingChord.chordIndex];
    }
    return null;
  })() : null;

  // Convert song to rows format for preview/PDF
  const currentSong = actions.getCurrentSong();
  const { rows, rowSubtitles, sectionIndices, sectionTitles } = songToRows(currentSong);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onNew={actions.handleNewSong}
        onNewAI={() => setYoutubeImportOpen(true)}
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

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sections</h2>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.keys(SectionTypeLabels) as SectionType[]).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => actions.addSection(type)}
                      >
                        {SectionTypeLabels[type]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {state.sections.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground mb-4">
                  No sections yet. Add a section to get started.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Section
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {(Object.keys(SectionTypeLabels) as SectionType[]).map((type) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => actions.addSection(type)}
                        >
                          {SectionTypeLabels[type]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={state.sections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {state.sections.map((section, index) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        sectionIndex={index}
                        onToggleCollapsed={actions.toggleSectionCollapsed}
                        onUpdateSection={actions.updateSection}
                        onRemoveSection={actions.removeSection}
                        onAddRow={(sectionId: string, rowType: 'chord-row' | 'tab-row') =>
                          actions.addRowToSection(sectionId, rowType, 4)
                        }
                        onRemoveRow={actions.removeRowFromSection}
                        onChordClick={handleChordClick}
                        onUpdateRowSubtitle={(sectionId: string, rowId: string, subtitle: string) => {
                          actions.updateRowInSection(sectionId, rowId, { subtitle });
                        }}
                        onUpdateRow={actions.updateRowInSection}
                        onAddChordToRow={actions.addChordToRow}
                        onRemoveChordFromRow={actions.removeChordFromRow}
                        onDuplicateChord={actions.duplicateChordInRow}
                        strummingPattern={state.strummingPattern}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!actions.hasEditedContent}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleDownloadPDF} disabled={!actions.hasEditedContent}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {!actions.hasEditedContent && (
            <p className="text-center text-muted-foreground text-sm">
              Add a section and click on a chord diagram to start editing
            </p>
          )}
        </div>
      </main>

      {/* Chord Editor Dialog */}
      {editingChord && currentChord && (
        <ChordEditor
          chord={currentChord}
          open={true}
          onClose={() => setEditingChord(null)}
          onSave={handleSaveChord}
        />
      )}

      {/* Preview Dialog */}
      <PreviewSongDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        song={currentSong}
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
        onLoad={handleLoadSong}
      />

      {/* Hidden printable content - always mounted for reliable PDF export */}
      <div className="fixed left-[-9999px] top-0">
        <PrintableSongSheet
          ref={hiddenPrintRef}
          song={currentSong}
        />
      </div>

      {/* YouTube Import Dialog */}
      <YouTubeImportDialog
        open={youtubeImportOpen}
        onOpenChange={setYoutubeImportOpen}
        onImport={(result) => actions.loadFromYouTubeResult(result, getPreset)}
      />

      <AppFooter />
    </div>
  );
};

export default Index;
