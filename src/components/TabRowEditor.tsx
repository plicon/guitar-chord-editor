import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import { TabMeasure, TabColumn, createEmptyTabMeasure, createEmptyTabColumn, TAB_STRING_NAMES, isValidFret, TabTechnique } from "@/types/tab";
import { StrummingPattern, getSlotsPerBar, getBeatLabel } from "@/types/strumming";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Minus, Delete, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsTablet, useIsTouchDevice } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const TECHNIQUE_LABELS: Record<TabTechnique, string> = {
  'h': 'Hammer-on',
  'p': 'Pull-off',
  '/': 'Slide up',
  '\\': 'Slide down',
  'b': 'Bend',
  'r': 'Release',
  '~': 'Vibrato',
};

const TECHNIQUE_KEYS: TabTechnique[] = ['h', 'p', '/', '\\', 'b', 'r', '~'];

interface TabRowEditorProps {
  measures: TabMeasure[];
  onChange: (measures: TabMeasure[]) => void;
  strummingPattern?: StrummingPattern | null;
  className?: string;
}

interface SelectedCell {
  measureIndex: number;
  columnIndex: number;
  stringIndex: number;
}

/**
 * Returns Tailwind classes for a cell based on column count and touch mode.
 */
function getCellClass(columns: number, touch: boolean): string {
  if (touch) {
    if (columns <= 8)  return "w-12 h-12 min-w-[48px] min-h-[48px]";
    if (columns <= 13) return "w-11 h-11 min-w-[44px] min-h-[44px]";
    if (columns <= 16) return "w-10 h-10 min-w-[40px] min-h-[40px]";
    return                    "w-9  h-9  min-w-[36px] min-h-[36px]";
  } else {
    if (columns <= 8)  return "w-9 h-7";
    if (columns <= 13) return "w-8 h-6";
    if (columns <= 16) return "w-7 h-6";
    return                    "w-6 h-5";
  }
}

/**
 * Interactive editor for tablature rows
 * Renders a 6-string grid where users can click cells and type fret numbers.
 * On touch devices, an on-screen numpad and technique toolbar are shown.
 */
export function TabRowEditor({ measures, onChange, strummingPattern, className }: TabRowEditorProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const gridRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouchDevice();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const showTouchControls = isTouch || isTablet;

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
    technique?: TabTechnique
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
    technique: TabTechnique | undefined
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
        const technique = e.key as TabTechnique;
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

  // Clear selection when the user clicks outside this editor instance
  useEffect(() => {
    if (!selectedCell) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setSelectedCell(null);
        setInputBuffer('');
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [selectedCell]);

  // On-screen numpad handler
  const handleNumpadPress = useCallback((digit: number) => {
    if (!selectedCell) return;
    const { measureIndex, columnIndex, stringIndex } = selectedCell;

    const newBuffer = inputBuffer + digit.toString();
    const fretValue = parseInt(newBuffer, 10);

    if (isValidFret(fretValue)) {
      setInputBuffer(newBuffer);
      updateNote(measureIndex, columnIndex, stringIndex, fretValue);

      if (fretValue > 2 || newBuffer.length === 2) {
        moveSelection('right');
        setInputBuffer('');
      }
    } else {
      setInputBuffer('');
    }
  }, [selectedCell, inputBuffer, updateNote, moveSelection]);

  const handleClearCell = useCallback(() => {
    if (!selectedCell) return;
    const { measureIndex, columnIndex, stringIndex } = selectedCell;
    updateNote(measureIndex, columnIndex, stringIndex, null);
    setInputBuffer('');
  }, [selectedCell, updateNote]);

  const handleTechniquePress = useCallback((technique: TabTechnique) => {
    if (!selectedCell) return;
    const { measureIndex, columnIndex, stringIndex } = selectedCell;
    const currentNote = measures[measureIndex].columns[columnIndex].strings[stringIndex];
    if (currentNote.fret !== null) {
      // Toggle technique off if already set to same value
      const newTechnique = currentNote.technique === technique ? undefined : technique;
      updateTechnique(measureIndex, columnIndex, stringIndex, newTechnique);
    }
  }, [selectedCell, measures, updateTechnique]);

  const addMeasure = () => {
    const columns = strummingPattern
      ? getSlotsPerBar(strummingPattern.timeSignature, strummingPattern.subdivision)
      : 8;
    onChange([...measures, createEmptyTabMeasure(columns)]);
  };

  const removeMeasure = (measureIndex: number) => {
    if (measures.length <= 1) return;
    const newMeasures = measures.filter((_, i) => i !== measureIndex);
    onChange(newMeasures);

    if (selectedCell?.measureIndex === measureIndex) {
      setSelectedCell(null);
    } else if (selectedCell && selectedCell.measureIndex > measureIndex) {
      setSelectedCell({
        ...selectedCell,
        measureIndex: selectedCell.measureIndex - 1,
      });
    }
  };

  const addColumn = (measureIndex: number) => {
    const measure = measures[measureIndex];
    if (measure.columns.length >= 32) return;

    const newMeasures = [...measures];
    newMeasures[measureIndex] = {
      ...newMeasures[measureIndex],
      columns: [...newMeasures[measureIndex].columns, createEmptyTabColumn()],
    };
    onChange(newMeasures);
  };

  const removeColumn = (measureIndex: number) => {
    const measure = measures[measureIndex];
    if (measure.columns.length <= 4) return;

    const newMeasures = [...measures];
    const lastColumnIndex = measure.columns.length - 1;
    newMeasures[measureIndex] = {
      ...newMeasures[measureIndex],
      columns: measure.columns.slice(0, -1),
    };
    onChange(newMeasures);

    if (selectedCell?.measureIndex === measureIndex && selectedCell.columnIndex === lastColumnIndex) {
      setSelectedCell(null);
    }
  };

  const syncMeasureToPattern = (measureIndex: number) => {
    if (!strummingPattern) return;
    const target = getSlotsPerBar(strummingPattern.timeSignature, strummingPattern.subdivision);
    const measure = measures[measureIndex];
    const current = measure.columns.length;

    let newColumns: TabColumn[];
    if (target > current) {
      const toAdd = Array.from({ length: target - current }, () => createEmptyTabColumn());
      newColumns = [...measure.columns, ...toAdd];
    } else {
      newColumns = measure.columns.slice(0, target);
    }

    const newMeasures = [...measures];
    newMeasures[measureIndex] = { ...measure, columns: newColumns };
    onChange(newMeasures);

    if (
      selectedCell?.measureIndex === measureIndex &&
      selectedCell.columnIndex >= target
    ) {
      setSelectedCell(null);
    }
  };

  if (!measures || measures.length === 0) {
    return null;
  }

  // Get selected note info for the toolbar
  const selectedNote = selectedCell
    ? measures[selectedCell.measureIndex]?.columns[selectedCell.columnIndex]?.strings[selectedCell.stringIndex]
    : null;

  const subdivision = strummingPattern?.subdivision;

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)} ref={gridRef}>
      {measures.map((measure, measureIndex) => {
        const columnCount = measure.columns.length;
        const cellClass = getCellClass(columnCount, showTouchControls);
        const targetColumns = strummingPattern
          ? getSlotsPerBar(strummingPattern.timeSignature, strummingPattern.subdivision)
          : null;
        const needsSync = targetColumns !== null && columnCount !== targetColumns;

        return (
          <div key={measure.id} className="relative group border rounded-lg p-3 bg-card">
            {/* Tab grid */}
            <ScrollArea className="w-full">
              <div className="font-mono text-base">
                <div className={cn(
                  "inline-block bg-muted/10 rounded p-2",
                  strummingPattern && "pt-5"
                )}>
                  {TAB_STRING_NAMES.map((stringName, stringIndex) => (
                    <div key={stringIndex} className={cn(
                      "flex items-center gap-0",
                      showTouchControls ? "min-h-[44px]" : "min-h-[28px]"
                    )}>
                      {/* String label */}
                      <span className={cn(
                        "text-muted-foreground mr-2 text-right font-bold",
                        showTouchControls ? "w-5 text-base" : "w-3"
                      )}>
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
                        const isBeatBoundary = subdivision !== undefined && (columnIndex + 1) % subdivision === 0;

                        // Beat label: only rendered above the top string row
                        const beatLabel = strummingPattern && stringIndex === 0 ? (() => {
                          const beatType = getBeatLabel(columnIndex, strummingPattern.subdivision);
                          const beatNum = Math.floor(columnIndex / strummingPattern.subdivision) + 1;
                          return beatType === 'on' ? String(beatNum) : beatType;
                        })() : null;

                        return (
                          <Fragment key={columnIndex}>
                            <div className="relative inline-flex items-center justify-center">
                              {beatLabel !== null && (
                                <span className="absolute bottom-full left-0 right-0 flex justify-center pb-0.5 text-[10px] text-muted-foreground pointer-events-none">
                                  {beatLabel}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCellClick(measureIndex, columnIndex, stringIndex)}
                                className={cn(
                                  "inline-flex items-center justify-center text-center border border-transparent rounded relative touch-manipulation",
                                  "hover:bg-muted hover:border-border transition-colors",
                                  "focus:outline-none focus:ring-2 focus:ring-ring",
                                  isSelected && "bg-primary/20 border-primary ring-2 ring-primary",
                                  cellClass
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
                            </div>

                            {columnIndex < measure.columns.length - 1 && (
                              isBeatBoundary
                                ? <span className="text-primary/50 font-bold px-0.5">|</span>
                                : <span className="text-muted-foreground px-0.5">-</span>
                            )}
                          </Fragment>
                        );
                      })}

                      {/* End line */}
                      <span className="text-muted-foreground font-bold">|</span>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Instructions for selected cell - keyboard devices only */}
            {selectedCell?.measureIndex === measureIndex && !showTouchControls && (
              <div className="mt-2 text-xs text-muted-foreground">
                Type 0-24 to set fret • h/p/b/r/~/\ to add technique • x to clear technique • Space/Del to clear • Arrows to navigate • Tab to move • Esc to deselect
              </div>
            )}

            {/* Add/Remove Column Buttons - always visible on touch, hover on desktop */}
            <div className={cn(
              "flex gap-2 justify-center mt-3",
              showTouchControls
                ? "opacity-100"
                : "absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            )}>
              <Button
                variant="outline"
                size="sm"
                className={cn("bg-background", showTouchControls ? "h-9 px-3" : "h-7 px-2")}
                onClick={() => removeColumn(measureIndex)}
                disabled={measure.columns.length <= 4}
                title={measure.columns.length <= 4 ? "Minimum 4 columns per measure" : "Remove column"}
              >
                <Minus className="w-3 h-3 mr-1" />
                Column
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("bg-background", showTouchControls ? "h-9 px-3" : "h-7 px-2")}
                onClick={() => addColumn(measureIndex)}
                disabled={measure.columns.length >= 32}
                title={measure.columns.length >= 32 ? "Maximum 32 columns per measure" : "Add column"}
              >
                <Plus className="w-3 h-3 mr-1" />
                Column
              </Button>
              {needsSync && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("bg-background", showTouchControls ? "h-9 px-3" : "h-7 px-2")}
                  onClick={() => syncMeasureToPattern(measureIndex)}
                  title={`Resize this measure to match the strumming pattern (${targetColumns} columns)`}
                >
                  Sync to pattern ({targetColumns} cols)
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add/Remove Measure Buttons */}
      <div className={cn(
        "relative border-2 border-dashed rounded-lg p-4 transition-colors",
        showTouchControls ? "" : "group hover:border-primary/50"
      )}>
        <p className="text-center text-muted-foreground text-sm">
          {measures.length} {measures.length === 1 ? 'measure' : 'measures'}
        </p>
        <div className={cn(
          "flex gap-2 justify-center mt-2",
          showTouchControls
            ? "opacity-100"
            : "absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        )}>
          <Button
            variant="outline"
            size="sm"
            className={cn("bg-background", showTouchControls ? "h-9 px-3" : "h-7 px-2")}
            onClick={() => removeMeasure(measures.length - 1)}
            disabled={measures.length <= 1}
            title={measures.length <= 1 ? "Minimum 1 measure per row" : "Remove measure"}
          >
            <Minus className="w-3 h-3 mr-1" />
            Measure
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("bg-background", showTouchControls ? "h-9 px-3" : "h-7 px-2")}
            onClick={addMeasure}
            title="Add measure"
          >
            <Plus className="w-3 h-3 mr-1" />
            Measure
          </Button>
        </div>
      </div>

      {/* On-screen input toolbar for touch devices */}
      {showTouchControls && selectedCell && (
        <div className="sticky bottom-0 z-10 bg-card border rounded-lg p-3 shadow-lg space-y-3">
          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => moveSelection('left')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => moveSelection('up')}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => moveSelection('down')}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => moveSelection('right')}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Clear / Deselect */}
            <div className="ml-4 flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={handleClearCell}
              >
                <Delete className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-3 text-muted-foreground"
                onClick={() => { setSelectedCell(null); setInputBuffer(''); }}
              >
                Done
              </Button>
            </div>
          </div>

          {/* Number pad */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button
                key={digit}
                variant="secondary"
                className="h-11 w-11 min-w-[44px] min-h-[44px] text-lg font-bold"
                onClick={() => handleNumpadPress(digit)}
              >
                {digit}
              </Button>
            ))}
          </div>

          {/* Technique buttons */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {TECHNIQUE_KEYS.map((tech) => (
              <Button
                key={tech}
                variant={selectedNote?.technique === tech ? "default" : "outline"}
                size="sm"
                className="h-9 px-3 text-sm"
                onClick={() => handleTechniquePress(tech)}
                disabled={!selectedNote || selectedNote.fret === null}
                title={TECHNIQUE_LABELS[tech]}
              >
                {tech} <span className="ml-1 text-xs opacity-70">{TECHNIQUE_LABELS[tech]}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
