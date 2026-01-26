import { Button } from "@/components/ui/button";
import { ChordDiagram } from "@/types/chord";
import { ChordRow } from "@/components/ChordRow";
import { ChordDiagramComponent } from "@/components/ChordDiagram";
import { Plus, Minus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";

interface ChordGridSectionProps {
  rows: ChordDiagram[][];
  rowSubtitles: string[];
  chordsPerRow: number;
  activeChord: ChordDiagram | null;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: () => void;
  onChordClick: (rowIndex: number, chordIndex: number) => void;
  onRowSubtitleChange: (index: number, value: string) => void;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
  onChordsPerRowChange: (count: number) => void;
}

export const ChordGridSection = ({
  rows,
  rowSubtitles,
  chordsPerRow,
  activeChord,
  sensors,
  onDragStart,
  onDragOver,
  onDragEnd,
  onChordClick,
  onRowSubtitleChange,
  onRemoveRow,
  onAddRow,
  onChordsPerRowChange,
}: ChordGridSectionProps) => {
  return (
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
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="space-y-4">
          {rows.map((row, rowIndex) => (
            <ChordRow
              key={rowIndex}
              chords={row}
              rowIndex={rowIndex}
              subtitle={rowSubtitles[rowIndex] || ""}
              onSubtitleChange={(value) => onRowSubtitleChange(rowIndex, value)}
              onChordClick={(chordIndex) => onChordClick(rowIndex, chordIndex)}
              onRemove={() => onRemoveRow(rowIndex)}
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

      <div className="flex items-center justify-center gap-4 pt-2">
        <span className="text-sm text-muted-foreground">Chords per row:</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChordsPerRowChange(chordsPerRow - 1)}
            disabled={chordsPerRow <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-6 text-center font-medium">{chordsPerRow}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChordsPerRowChange(chordsPerRow + 1)}
            disabled={chordsPerRow >= 5}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onAddRow}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Row
      </Button>
    </div>
  );
};
