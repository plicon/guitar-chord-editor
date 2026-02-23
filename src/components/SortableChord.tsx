import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChordDiagram as ChordDiagramType, isChordEdited } from "@/types/chord";
import { ChordDiagramComponent } from "./ChordDiagram";
import { cn } from "@/lib/utils";
import { Copy, GripHorizontal } from "lucide-react";
import { useIsTouchDevice, useIsTablet } from "@/hooks/use-mobile";

interface SortableChordProps {
  chord: ChordDiagramType;
  onClick: () => void;
  onDuplicate?: () => void;
}

export const SortableChord = ({
  chord,
  onClick,
  onDuplicate,
}: SortableChordProps) => {
  const isTouch = useIsTouchDevice();
  const isTablet = useIsTablet();
  const alwaysShowHint = isTouch || isTablet;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chord.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const edited = isChordEdited(chord);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group cursor-grab active:cursor-grabbing select-none",
        isDragging && "z-50 opacity-80"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Duplicate button — top-right corner, only for edited chords */}
      {onDuplicate && edited && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="absolute top-0 right-0 z-10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-accent"
          title="Duplicate chord"
        >
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      )}

      <ChordDiagramComponent
        chord={chord}
        onClick={onClick}
        size="md"
        showPlaceholder={true}
        printMode={false}
      />

      {/* Drag hint — always visible on touch/tablet, hover-only on desktop */}
      <div
        className={cn(
          "absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity",
          alwaysShowHint
            ? "opacity-25"
            : "opacity-0 group-hover:opacity-30"
        )}
        title="Drag to reorder"
      >
        <GripHorizontal className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};
