import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChordDiagram as ChordDiagramType } from "@/types/chord";
import { ChordDiagramComponent } from "./ChordDiagram";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface SortableChordProps {
  chord: ChordDiagramType;
  onClick: () => void;
}

export const SortableChord = ({
  chord,
  onClick,
}: SortableChordProps) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-80"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-muted hover:bg-accent"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <ChordDiagramComponent
        chord={chord}
        onClick={onClick}
        size="md"
        showPlaceholder={true}
        printMode={false}
      />
    </div>
  );
};
