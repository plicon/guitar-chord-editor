import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChordDiagram, FingerPosition } from "@/types/chord";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface ChordEditorProps {
  chord: ChordDiagram;
  open: boolean;
  onClose: () => void;
  onSave: (chord: ChordDiagram) => void;
}

export const ChordEditor = ({ chord, open, onClose, onSave }: ChordEditorProps) => {
  const [editedChord, setEditedChord] = useState<ChordDiagram>(chord);
  
  const stringSpacing = 30;
  const fretSpacing = 35;
  const startX = 40;
  const startY = 50;
  const nutHeight = 5;

  const handleStringTopClick = (string: number) => {
    const isMuted = editedChord.mutedStrings.includes(string);
    const isOpen = editedChord.openStrings.includes(string);

    if (isMuted) {
      // Switch to open
      setEditedChord({
        ...editedChord,
        mutedStrings: editedChord.mutedStrings.filter((s) => s !== string),
        openStrings: [...editedChord.openStrings, string],
      });
    } else if (isOpen) {
      // Switch to neither
      setEditedChord({
        ...editedChord,
        openStrings: editedChord.openStrings.filter((s) => s !== string),
      });
    } else {
      // Switch to muted
      setEditedChord({
        ...editedChord,
        mutedStrings: [...editedChord.mutedStrings, string],
      });
    }
  };

  const handleFretClick = (string: number, fret: number) => {
    const existingIndex = editedChord.fingers.findIndex(
      (f) => f.string === string && f.fret === fret
    );

    if (existingIndex >= 0) {
      // Remove existing finger
      setEditedChord({
        ...editedChord,
        fingers: editedChord.fingers.filter((_, i) => i !== existingIndex),
      });
    } else {
      // Remove any existing finger on this string and add new one
      const newFingers = editedChord.fingers.filter((f) => f.string !== string);
      const newFinger: FingerPosition = { string, fret };
      setEditedChord({
        ...editedChord,
        fingers: [...newFingers, newFinger],
        mutedStrings: editedChord.mutedStrings.filter((s) => s !== string),
        openStrings: editedChord.openStrings.filter((s) => s !== string),
      });
    }
  };

  const handleSave = () => {
    onSave(editedChord);
    onClose();
  };

  const handleClear = () => {
    setEditedChord({
      ...editedChord,
      name: "",
      fingers: [],
      barres: [],
      mutedStrings: [],
      openStrings: [],
    });
  };

  const hasFingerAt = (string: number, fret: number) => {
    return editedChord.fingers.some((f) => f.string === string && f.fret === fret);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Chord</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chord Name Input */}
          <div className="space-y-2">
            <Label htmlFor="chordName">Chord Name</Label>
            <Input
              id="chordName"
              value={editedChord.name}
              onChange={(e) =>
                setEditedChord({ ...editedChord, name: e.target.value })
              }
              placeholder="e.g., Am, G, C7"
              className="text-lg font-semibold"
            />
          </div>

          {/* Start Fret Selector */}
          <div className="space-y-2">
            <Label>Starting Fret</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((fret) => (
                <Button
                  key={fret}
                  variant={editedChord.startFret === fret ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedChord({ ...editedChord, startFret: fret })}
                >
                  {fret}
                </Button>
              ))}
            </div>
          </div>

          {/* Interactive Fretboard */}
          <div className="flex justify-center py-4">
            <svg width={220} height={220}>
              {/* String labels */}
              {["E", "A", "D", "G", "B", "e"].map((label, i) => (
                <text
                  key={`label-${i}`}
                  x={startX + (5 - i) * stringSpacing}
                  y={startY + fretSpacing * 4 + 20}
                  className="fill-muted-foreground"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {label}
                </text>
              ))}

              {/* Clickable areas for muted/open */}
              {[1, 2, 3, 4, 5, 6].map((string) => {
                const isMuted = editedChord.mutedStrings.includes(string);
                const isOpen = editedChord.openStrings.includes(string);
                return (
                  <g
                    key={`top-${string}`}
                    onClick={() => handleStringTopClick(string)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={startX + (6 - string) * stringSpacing}
                      cy={startY - 15}
                      r={10}
                      className="fill-transparent hover:fill-muted"
                    />
                    {isMuted && (
                      <text
                        x={startX + (6 - string) * stringSpacing}
                        y={startY - 10}
                        className="fill-destructive"
                        fontSize={14}
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        ×
                      </text>
                    )}
                    {isOpen && (
                      <circle
                        cx={startX + (6 - string) * stringSpacing}
                        cy={startY - 15}
                        r={5}
                        className="stroke-primary fill-none"
                        strokeWidth={2}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}

              {/* Nut */}
              {editedChord.startFret === 1 && (
                <rect
                  x={startX}
                  y={startY}
                  width={stringSpacing * 5}
                  height={nutHeight}
                  className="fill-chord-fret"
                />
              )}

              {/* Fret number if not at nut */}
              {editedChord.startFret > 1 && (
                <text
                  x={startX - 15}
                  y={startY + fretSpacing * 0.7}
                  className="fill-muted-foreground"
                  fontSize={12}
                  textAnchor="middle"
                >
                  {editedChord.startFret}
                </text>
              )}

              {/* Strings */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={`string-${i}`}
                  x1={startX + i * stringSpacing}
                  y1={startY + (editedChord.startFret === 1 ? nutHeight : 0)}
                  x2={startX + i * stringSpacing}
                  y2={startY + fretSpacing * 4}
                  className="stroke-chord-string"
                  strokeWidth={1.5}
                />
              ))}

              {/* Frets */}
              {Array.from({ length: 5 }).map((_, i) => (
                <line
                  key={`fret-${i}`}
                  x1={startX}
                  y1={startY + i * fretSpacing + (editedChord.startFret === 1 && i === 0 ? nutHeight : 0)}
                  x2={startX + stringSpacing * 5}
                  y2={startY + i * fretSpacing + (editedChord.startFret === 1 && i === 0 ? nutHeight : 0)}
                  className="stroke-chord-fret"
                  strokeWidth={i === 0 && editedChord.startFret === 1 ? 0 : 1}
                />
              ))}

              {/* Clickable fret positions */}
              {[1, 2, 3, 4, 5, 6].map((string) =>
                [1, 2, 3, 4].map((fret) => {
                  const hasFinger = hasFingerAt(string, fret);
                  return (
                    <g
                      key={`pos-${string}-${fret}`}
                      onClick={() => handleFretClick(string, fret)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={startX + (6 - string) * stringSpacing}
                        cy={startY + (fret - 0.5) * fretSpacing}
                        r={12}
                        className={cn(
                          hasFinger ? "fill-chord-dot" : "fill-transparent hover:fill-muted"
                        )}
                      />
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Help text */}
          <p className="text-sm text-muted-foreground text-center">
            Click on frets to add/remove fingers. Click above strings to toggle muted (×) or open (○).
          </p>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Chord</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
