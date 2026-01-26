import { ChordDiagram } from "@/types/chord";
import { ChordDiagramComponent } from "./ChordDiagram";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface ChordRowProps {
  chords: ChordDiagram[];
  onChordClick: (index: number) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  printMode?: boolean;
}

export const ChordRow = ({
  chords,
  onChordClick,
  onRemove,
  showRemove = false,
  printMode = false,
}: ChordRowProps) => {
  return (
    <div className="relative group">
      <div className="grid grid-cols-4 gap-4 p-4 bg-card rounded-lg border border-border">
        {chords.map((chord, index) => (
          <ChordDiagramComponent
            key={chord.id}
            chord={chord}
            onClick={() => onChordClick(index)}
            size="md"
            showPlaceholder={!printMode}
            printMode={printMode}
          />
        ))}
      </div>
      {showRemove && !printMode && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
