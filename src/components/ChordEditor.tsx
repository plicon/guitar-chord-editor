import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChordDiagram, FingerPosition, Barre, FingerLabel } from "@/types/chord";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { filterChordSuggestions } from "@/data/chordSuggestions";

interface ChordEditorProps {
  chord: ChordDiagram;
  open: boolean;
  onClose: () => void;
  onSave: (chord: ChordDiagram) => void;
}

export const ChordEditor = ({ chord, open, onClose, onSave }: ChordEditorProps) => {
  const [editedChord, setEditedChord] = useState<ChordDiagram>({
    ...chord,
    fingerLabels: chord.fingerLabels || [],
  });
  const [dragStart, setDragStart] = useState<{ string: number; fret: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ string: number; fret: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const stringSpacing = 30;
  const fretSpacing = 35;
  const startX = 40;
  const startY = 50;
  const nutHeight = 5;

  // Update suggestions when chord name changes
  useEffect(() => {
    const filtered = filterChordSuggestions(editedChord.name);
    setSuggestions(filtered);
    setSelectedIndex(0);
    setShowSuggestions(filtered.length > 0 && editedChord.name.length > 0);
  }, [editedChord.name]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (value: string) => {
    setEditedChord({ ...editedChord, name: value });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEditedChord({ ...editedChord, name: suggestion });
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleStringTopClick = (string: number) => {
    const isMuted = editedChord.mutedStrings.includes(string);
    const isOpen = editedChord.openStrings.includes(string);

    if (!isMuted && !isOpen) {
      // Switch to muted
      setEditedChord({
        ...editedChord,
        mutedStrings: [...editedChord.mutedStrings, string],
      });
    } else if (isMuted) {
      // Switch to open
      setEditedChord({
        ...editedChord,
        mutedStrings: editedChord.mutedStrings.filter((s) => s !== string),
        openStrings: [...editedChord.openStrings, string],
      });
    } else {
      // Switch to neither
      setEditedChord({
        ...editedChord,
        openStrings: editedChord.openStrings.filter((s) => s !== string),
      });
    }
  };

  const handleFretMouseDown = (string: number, fret: number) => {
    setDragStart({ string, fret });
    setDragCurrent({ string, fret });
  };

  const handleFretMouseEnter = (string: number, fret: number) => {
    if (dragStart && dragStart.fret === fret) {
      setDragCurrent({ string, fret });
    }
  };

  const handleFretMouseUp = (string: number, fret: number) => {
    if (!dragStart) return;

    if (dragStart.string === string && dragStart.fret === fret) {
      // Single click - toggle finger position
      const existingIndex = editedChord.fingers.findIndex(
        (f) => f.string === string && f.fret === fret
      );

      if (existingIndex >= 0) {
        setEditedChord({
          ...editedChord,
          fingers: editedChord.fingers.filter((_, i) => i !== existingIndex),
        });
      } else {
        // Check if there's a barre at this position
        const barreIndex = editedChord.barres.findIndex(
          (b) => b.fret === fret && string >= b.toString && string <= b.fromString
        );
        
        if (barreIndex >= 0) {
          // Remove the barre
          setEditedChord({
            ...editedChord,
            barres: editedChord.barres.filter((_, i) => i !== barreIndex),
          });
        } else {
          // Add finger, remove any existing finger on this string
          const newFingers = editedChord.fingers.filter((f) => f.string !== string);
          const newFinger: FingerPosition = { string, fret };
          setEditedChord({
            ...editedChord,
            fingers: [...newFingers, newFinger],
            mutedStrings: editedChord.mutedStrings.filter((s) => s !== string),
            openStrings: editedChord.openStrings.filter((s) => s !== string),
          });
        }
      }
    } else if (dragStart.fret === fret && dragStart.string !== string) {
      // Drag completed - create barre
      const fromString = Math.max(dragStart.string, string);
      const toString = Math.min(dragStart.string, string);
      
      // Remove any existing barres on this fret
      const newBarres = editedChord.barres.filter((b) => b.fret !== fret);
      
      // Remove any individual fingers in the barre range
      const newFingers = editedChord.fingers.filter(
        (f) => f.fret !== fret || f.string < toString || f.string > fromString
      );
      
      const newBarre: Barre = { fret, fromString, toString };
      
      // Update muted/open strings
      const affectedStrings = Array.from(
        { length: fromString - toString + 1 },
        (_, i) => toString + i
      );
      
      setEditedChord({
        ...editedChord,
        barres: [...newBarres, newBarre],
        fingers: newFingers,
        mutedStrings: editedChord.mutedStrings.filter((s) => !affectedStrings.includes(s)),
        openStrings: editedChord.openStrings.filter((s) => !affectedStrings.includes(s)),
      });
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const handleFingerLabelClick = (string: number) => {
    const existing = editedChord.fingerLabels.find((f) => f.string === string);
    
    if (!existing) {
      // Add finger 1
      setEditedChord({
        ...editedChord,
        fingerLabels: [...editedChord.fingerLabels, { string, finger: 1 }],
      });
    } else if (existing.finger < 4) {
      // Increment finger
      setEditedChord({
        ...editedChord,
        fingerLabels: editedChord.fingerLabels.map((f) =>
          f.string === string ? { ...f, finger: f.finger + 1 } : f
        ),
      });
    } else {
      // Remove finger label
      setEditedChord({
        ...editedChord,
        fingerLabels: editedChord.fingerLabels.filter((f) => f.string !== string),
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
      fingerLabels: [],
    });
  };

  const hasFingerAt = (string: number, fret: number) => {
    return editedChord.fingers.some((f) => f.string === string && f.fret === fret);
  };

  const isInBarre = (string: number, fret: number) => {
    return editedChord.barres.some(
      (b) => b.fret === fret && string >= b.toString && string <= b.fromString
    );
  };

  const getFingerLabel = (string: number) => {
    return editedChord.fingerLabels.find((f) => f.string === string)?.finger;
  };

  // Calculate drag preview
  const getDragPreview = () => {
    if (!dragStart || !dragCurrent || dragStart.fret !== dragCurrent.fret) return null;
    if (dragStart.string === dragCurrent.string) return null;
    
    const fromString = Math.max(dragStart.string, dragCurrent.string);
    const toString = Math.min(dragStart.string, dragCurrent.string);
    
    return { fret: dragStart.fret, fromString, toString };
  };

  const dragPreview = getDragPreview();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Chord</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chord Name Input with Autocomplete */}
          <div className="space-y-2 relative">
            <Label htmlFor="chordName">Chord Name</Label>
            <Input
              ref={inputRef}
              id="chordName"
              value={editedChord.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 && editedChord.name.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="e.g., Am, G, C7"
              className="text-lg font-semibold"
              autoComplete="off"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      index === selectedIndex && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="font-semibold">{suggestion.charAt(0)}</span>
                    <span>{suggestion.slice(1)}</span>
                  </button>
                ))}
              </div>
            )}
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
            <svg 
              ref={svgRef} 
              width={220} 
              height={260}
              onMouseLeave={() => {
                if (dragStart) {
                  setDragStart(null);
                  setDragCurrent(null);
                }
              }}
            >
              {/* Muted/Open String Indicators - Top Section */}
              <text
                x={startX + stringSpacing * 2.5}
                y={15}
                className="fill-muted-foreground"
                fontSize={10}
                textAnchor="middle"
              >
                Click to toggle: × (muted) → ○ (open) → none
              </text>

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
                    <rect
                      x={startX + (6 - string) * stringSpacing - 12}
                      y={startY - 30}
                      width={24}
                      height={24}
                      className="fill-transparent hover:fill-muted rounded"
                      rx={4}
                    />
                    {isMuted && (
                      <text
                        x={startX + (6 - string) * stringSpacing}
                        y={startY - 12}
                        className="fill-destructive font-bold"
                        fontSize={16}
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        ×
                      </text>
                    )}
                    {isOpen && (
                      <circle
                        cx={startX + (6 - string) * stringSpacing}
                        cy={startY - 18}
                        r={6}
                        className="stroke-primary fill-none"
                        strokeWidth={2}
                        pointerEvents="none"
                      />
                    )}
                    {!isMuted && !isOpen && (
                      <circle
                        cx={startX + (6 - string) * stringSpacing}
                        cy={startY - 18}
                        r={6}
                        className="stroke-muted fill-none"
                        strokeWidth={1}
                        strokeDasharray="2,2"
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

              {/* Existing Barres */}
              {editedChord.barres.map((barre, i) => (
                <rect
                  key={`barre-${i}`}
                  x={startX + (6 - barre.fromString) * stringSpacing - 6}
                  y={startY + (barre.fret - 0.5) * fretSpacing - 8}
                  width={(barre.fromString - barre.toString) * stringSpacing + 12}
                  height={16}
                  rx={8}
                  className="fill-chord-dot"
                />
              ))}

              {/* Drag Preview Barre */}
              {dragPreview && (
                <rect
                  x={startX + (6 - dragPreview.fromString) * stringSpacing - 6}
                  y={startY + (dragPreview.fret - 0.5) * fretSpacing - 8}
                  width={(dragPreview.fromString - dragPreview.toString) * stringSpacing + 12}
                  height={16}
                  rx={8}
                  className="fill-chord-dot opacity-50"
                />
              )}

              {/* Clickable fret positions */}
              {[1, 2, 3, 4, 5, 6].map((string) =>
                [1, 2, 3, 4].map((fret) => {
                  const hasFinger = hasFingerAt(string, fret);
                  const inBarre = isInBarre(string, fret);
                  const isDragStart = dragStart?.string === string && dragStart?.fret === fret;
                  
                  return (
                    <g
                      key={`pos-${string}-${fret}`}
                      onMouseDown={() => handleFretMouseDown(string, fret)}
                      onMouseEnter={() => handleFretMouseEnter(string, fret)}
                      onMouseUp={() => handleFretMouseUp(string, fret)}
                      className="cursor-pointer select-none"
                    >
                      <circle
                        cx={startX + (6 - string) * stringSpacing}
                        cy={startY + (fret - 0.5) * fretSpacing}
                        r={12}
                        className={cn(
                          hasFinger || isDragStart
                            ? "fill-chord-dot"
                            : inBarre
                            ? "fill-transparent"
                            : "fill-transparent hover:fill-muted"
                        )}
                      />
                    </g>
                  );
                })
              )}

              {/* Finger Labels Section - Bottom */}
              <line
                x1={startX}
                y1={startY + fretSpacing * 4 + 15}
                x2={startX + stringSpacing * 5}
                y2={startY + fretSpacing * 4 + 15}
                className="stroke-border"
                strokeWidth={1}
              />
              
              <text
                x={startX - 20}
                y={startY + fretSpacing * 4 + 35}
                className="fill-muted-foreground"
                fontSize={10}
                textAnchor="middle"
              >
                Finger
              </text>

              {[1, 2, 3, 4, 5, 6].map((string) => {
                const fingerLabel = getFingerLabel(string);
                return (
                  <g
                    key={`finger-${string}`}
                    onClick={() => handleFingerLabelClick(string)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={startX + (6 - string) * stringSpacing}
                      cy={startY + fretSpacing * 4 + 32}
                      r={10}
                      className={cn(
                        fingerLabel ? "fill-primary" : "fill-transparent hover:fill-muted",
                        "stroke-border"
                      )}
                      strokeWidth={1}
                    />
                    <text
                      x={startX + (6 - string) * stringSpacing}
                      y={startY + fretSpacing * 4 + 36}
                      className={cn(
                        fingerLabel ? "fill-primary-foreground" : "fill-muted-foreground"
                      )}
                      fontSize={12}
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {fingerLabel || "–"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Help text */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p><strong>Click</strong> on frets to add/remove fingers</p>
            <p><strong>Drag</strong> across strings on same fret for barre chords</p>
            <p><strong>Bottom row:</strong> Click to set finger numbers (1-4)</p>
          </div>

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
