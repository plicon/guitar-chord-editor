import { useState, useCallback, useRef, useEffect } from "react";
import { TabMeasure, TabColumn, createEmptyTabMeasure, createEmptyTabColumn, TAB_STRING_NAMES, isValidFret, TabTechnique } from "@/types/tab";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TECHNIQUE_LABELS: Record<TabTechnique, string> = {
  'h': 'Hammer-on',
  'p': 'Pull-off',
  '/': 'Slide up',
  '\\': 'Slide down',
  'b': 'Bend',
  'r': 'Release',
  '~': 'Vibrato',
};

interface TabRowEditorProps {
  measures: TabMeasure[];
  onChange: (measures: TabMeasure[]) => void;
  className?: string;
}

interface SelectedCell {
  measureIndex: number;
  columnIndex: number;
  stringIndex: number;
}

/**
 * Interactive editor for tablature rows
 * Renders a 6-string grid where users can click cells and type fret numbers
 */
export function TabRowEditor({ measures, onChange, className }: TabRowEditorProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize with one measure if empty
  useEffect(() => {
    if (!measures || measures.length === 0) {
      onChange([createEmptyTabMeasure()]);
    }
  }, [measures, onChange]);

  const handleCellClick = (measureIndex: number, columnIndex: number, stringIndex: number) => {
    setSelectedCell({ measureIndex, columnIndex, stringIndex });
    setInputBuffer('');
  };

  const updateNote = useCallback((
    measureIndex: number,
    columnIndex: number,
    stringIndex: number,
    fret: number | null,
    technique?: 'h' | 'p' | '/' | '\\' | 'b' | 'r' | '~'
  ) => {
    const newMeasures = [...measures];
    const measure = newMeasures[measureIndex];
    const column = measure.columns[columnIndex];
    const note = column.strings[stringIndex];
    
    column.strings[stringIndex] = {
      ...note,
      fret,
      technique,
    };
    
    onChange(newMeasures);
  }, [measures, onChange]);

  const updateTechnique = useCallback((
    measureIndex: number,
    columnIndex: number,
    stringIndex: number,
    technique: 'h' | 'p' | '/' | '\\' | 'b' | 'r' | '~' | undefined
  ) => {
    const newMeasures = [...measures];
    const measure = newMeasures[measureIndex];
    const column = measure.columns[columnIndex];
    const note = column.strings[stringIndex];
    
    // Only update technique if there's a fret number
    if (note.fret !== null) {
      column.strings[stringIndex] = {
        ...note,
        technique,
      };
      onChange(newMeasures);
    }
  }, [measures, onChange]);

  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;
    
    let { measureIndex, columnIndex, stringIndex } = selectedCell;
    
    switch (direction) {
      case 'up':
        stringIndex = Math.max(0, stringIndex - 1);
        break;
      case 'down':
        stringIndex = Math.min(5, stringIndex + 1);
        break;
      case 'left':
        columnIndex--;
        if (columnIndex < 0 && measureIndex > 0) {
          measureIndex--;
          columnIndex = measures[measureIndex].columns.length - 1;
        } else if (columnIndex < 0) {
          columnIndex = 0;
        }
        break;
      case 'right':
        columnIndex++;
        if (columnIndex >= measures[measureIndex].columns.length && measureIndex < measures.length - 1) {
          measureIndex++;
          columnIndex = 0;
        } else if (columnIndex >= measures[measureIndex].columns.length) {
          columnIndex = measures[measureIndex].columns.length - 1;
        }
        break;
    }
    
    setSelectedCell({ measureIndex, columnIndex, stringIndex });
    setInputBuffer('');
  }, [selectedCell, measures]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;
    
    const { measureIndex, columnIndex, stringIndex } = selectedCell;
    
    // Arrow key navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection('down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveSelection('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveSelection('right');
    }
    // Number input (0-9)
    else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const newBuffer = inputBuffer + e.key;
      const fretValue = parseInt(newBuffer, 10);
      
      if (isValidFret(fretValue)) {
        setInputBuffer(newBuffer);
        updateNote(measureIndex, columnIndex, stringIndex, fretValue);
        
        // Auto-advance to next cell after valid single-digit or if buffer is complete
        if (fretValue > 2 || newBuffer.length === 2) {
          moveSelection('right');
          setInputBuffer('');
        }
      } else {
        // Invalid fret, reset buffer
        setInputBuffer('');
      }
    }
    // Backspace/Delete - clear cell
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      updateNote(measureIndex, columnIndex, stringIndex, null);
      setInputBuffer('');
    }
    // Space - clear and move right
    else if (e.key === ' ') {
      e.preventDefault();
      updateNote(measureIndex, columnIndex, stringIndex, null);
      moveSelection('right');
      setInputBuffer('');
    }
    // Tab - move to next cell
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        moveSelection('left');
      } else {
        moveSelection('right');
      }
      setInputBuffer('');
    }
    // Technique keys
    else if (/^[hpbr~]$/.test(e.key) || e.key === '/' || e.key === '\\') {
      e.preventDefault();
      const currentNote = measures[measureIndex].columns[columnIndex].strings[stringIndex];
      if (currentNote.fret !== null) {
        const technique = e.key as 'h' | 'p' | '/' | '\\' | 'b' | 'r' | '~';
        updateTechnique(measureIndex, columnIndex, stringIndex, technique);
        moveSelection('right');
      }
      setInputBuffer('');
    }
    // Clear technique with 'x'
    else if (e.key === 'x') {
      e.preventDefault();
      updateTechnique(measureIndex, columnIndex, stringIndex, undefined);
      setInputBuffer('');
    }
    // Escape - deselect
    else if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedCell(null);
      setInputBuffer('');
    }
  }, [selectedCell, inputBuffer, moveSelection, updateNote, updateTechnique, measures]);

  // Handle keyboard events
  useEffect(() => {
    if (selectedCell) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedCell, handleKeyDown]);

  const addMeasure = () => {
    onChange([...measures, createEmptyTabMeasure()]);
  };

  const removeMeasure = (measureIndex: number) => {
    if (measures.length <= 1) return; // Keep at least one measure
    const newMeasures = measures.filter((_, i) => i !== measureIndex);
    onChange(newMeasures);
    
    // Clear selection if it was in the removed measure
    if (selectedCell?.measureIndex === measureIndex) {
      setSelectedCell(null);
    } else if (selectedCell && selectedCell.measureIndex > measureIndex) {
      // Adjust selection if after removed measure
      setSelectedCell({
        ...selectedCell,
        measureIndex: selectedCell.measureIndex - 1,
      });
    }
  };

  const addColumn = (measureIndex: number) => {
    const measure = measures[measureIndex];
    if (measure.columns.length >= 12) return; // Max 14 columns
    
    const newMeasures = [...measures];
    newMeasures[measureIndex] = {
      ...newMeasures[measureIndex],
      columns: [...newMeasures[measureIndex].columns, createEmptyTabColumn()],
    };
    onChange(newMeasures);
  };

  const removeColumn = (measureIndex: number) => {
    const measure = measures[measureIndex];
    if (measure.columns.length <= 4) return; // Keep at least 4 columns
    
    const newMeasures = [...measures];
    const lastColumnIndex = measure.columns.length - 1;
    newMeasures[measureIndex] = {
      ...newMeasures[measureIndex],
      columns: measure.columns.slice(0, -1), // Remove last column
    };
    onChange(newMeasures);
    
    // Clear or adjust selection if it was on the removed column
    if (selectedCell?.measureIndex === measureIndex && selectedCell.columnIndex === lastColumnIndex) {
      setSelectedCell(null);
    }
  };

  if (!measures || measures.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)} ref={gridRef}>
      {measures.map((measure, measureIndex) => (
        <div key={measure.id} className="border rounded-lg p-3 bg-card">
          {/* Measure controls */}
          <div className="flex items-center justify-end mb-2">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addColumn(measureIndex)}
                disabled={measure.columns.length >= 14}
                title="Add column"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeColumn(measureIndex)}
                disabled={measure.columns.length <= 4}
                title="Remove column"
              >
                <span className="text-sm font-bold">−</span>
              </Button>
            </div>
          </div>

          {/* Tab grid */}
          <div className="font-mono text-base overflow-x-auto">
            <div className="inline-block bg-muted/10 rounded p-2">
              {TAB_STRING_NAMES.map((stringName, stringIndex) => (
                <div key={stringIndex} className="flex items-center gap-0 min-h-[28px]">
                  {/* String label */}
                  <span className="text-muted-foreground mr-2 w-3 text-right font-bold">
                    {stringName}
                  </span>
                  
                  {/* Line */}
                  <span className="text-muted-foreground font-bold">|</span>
                  
                  {/* Cells for this string */}
                  {measure.columns.map((column, columnIndex) => {
                    const note = column.strings[stringIndex];
                    const isSelected = 
                      selectedCell?.measureIndex === measureIndex &&
                      selectedCell?.columnIndex === columnIndex &&
                      selectedCell?.stringIndex === stringIndex;
                    
                    return (
                      <div key={columnIndex} className="inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => handleCellClick(measureIndex, columnIndex, stringIndex)}
                          className={cn(
                            "inline-block w-8 h-6 text-center border border-transparent rounded relative",
                            "hover:bg-muted hover:border-border transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-ring",
                            isSelected && "bg-primary/20 border-primary ring-2 ring-primary"
                          )}
                        >
                          {note.fret !== null ? (
                            <>
                              <span className="font-bold">{note.fret}</span>
                              {note.technique && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[10px] text-blue-600 font-bold absolute -top-1 -right-1 cursor-help">
                                      {note.technique}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{TECHNIQUE_LABELS[note.technique]}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            ''
                          )}
                        </button>
                        
                        {columnIndex < measure.columns.length - 1 && (
                          <span className="text-muted-foreground px-0.5">-</span>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* End line */}
                  <span className="text-muted-foreground font-bold">|</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions for selected cell */}
          {selectedCell?.measureIndex === measureIndex && (
            <div className="mt-2 text-xs text-muted-foreground">
              Type 0-24 to set fret • h/p/b/r/~/\ to add technique • x to clear technique • Space/Del to clear • Arrows to navigate • Tab to move • Esc to deselect
            </div>
          )}
        </div>
      ))}

      {/* Add measure button */}
      <Button
        variant="outline"
        onClick={addMeasure}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Measure
      </Button>
    </div>
    </TooltipProvider>
  );
}
