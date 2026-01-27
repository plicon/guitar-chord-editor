import { ChordDiagram } from "@/types/chord";
import { ChordDiagramComponent } from "./ChordDiagram";
import { SortableChord } from "./SortableChord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ChordRowProps {
  chords: ChordDiagram[];
  rowIndex: number;
  subtitle?: string;
  onSubtitleChange?: (value: string) => void;
  onChordClick: (index: number) => void;
  onRemove: () => void;
  showRemove?: boolean;
  printMode?: boolean;
}

export const ChordRow = ({
  chords,
  rowIndex,
  subtitle = "",
  onSubtitleChange,
  onChordClick,
  onRemove,
  showRemove = false,
  printMode = false,
}: ChordRowProps) => {
  const isMobile = useIsMobile();
  const shouldScroll = isMobile && chords.length > 3;

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  }[chords.length] || "grid-cols-4";

  const { setNodeRef } = useDroppable({
    id: `row-${rowIndex}`,
    data: { rowIndex },
  });

  if (printMode) {
    return (
      <div className="relative group">
        <div className={`grid ${gridCols} gap-4 p-4 bg-card rounded-lg border border-border`}>
          {chords.map((chord, index) => (
            <ChordDiagramComponent
              key={chord.id}
              chord={chord}
              onClick={() => onChordClick(index)}
              size="md"
              showPlaceholder={false}
              printMode={true}
            />
          ))}
        </div>
      </div>
    );
  }

  const chordsContent = (
    <SortableContext
      items={chords.map((c) => c.id)}
      strategy={horizontalListSortingStrategy}
    >
      {shouldScroll ? (
        <div className="flex gap-4 p-4 bg-card rounded-lg border border-border min-w-max">
          {chords.map((chord, index) => (
            <div key={chord.id} className="flex-shrink-0 w-[calc(33.333%-0.667rem)]">
              <SortableChord
                chord={chord}
                onClick={() => onChordClick(index)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-4 p-4 bg-card rounded-lg border border-border`}>
          {chords.map((chord, index) => (
            <SortableChord
              key={chord.id}
              chord={chord}
              onClick={() => onChordClick(index)}
            />
          ))}
        </div>
      )}
    </SortableContext>
  );

  return (
    <div className="relative group space-y-2" ref={setNodeRef}>
      {/* Subtitle Input */}
      <Input
        value={subtitle}
        onChange={(e) => onSubtitleChange?.(e.target.value)}
        placeholder="Add a comment for this row (optional)..."
        className="text-sm h-8 bg-transparent border-dashed"
      />
      
      {shouldScroll ? (
        <ScrollArea className="w-full whitespace-nowrap">
          {chordsContent}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        chordsContent
      )}

      {showRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-2 top-8 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
