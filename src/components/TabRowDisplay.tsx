import { TabMeasure, TAB_STRING_NAMES, TabTechnique } from "@/types/tab";
import { StrummingPattern, getBeatLabel } from "@/types/strumming";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TECHNIQUE_LABELS: Record<TabTechnique, string> = {
  'h': 'Hammer-on',
  'p': 'Pull-off',
  '/': 'Slide up',
  '\\': 'Slide down',
  'b': 'Bend',
  'r': 'Release',
  '~': 'Vibrato',
};

interface TabRowDisplayProps {
  measures: TabMeasure[];
  className?: string;
  printMode?: boolean;
  strummingPattern?: StrummingPattern | null;
}

/**
 * Read-only display component for tablature rows
 * Uses monospace font for proper alignment
 */
export function TabRowDisplay({ measures, className, printMode = false, strummingPattern }: TabRowDisplayProps) {
  if (!measures || measures.length === 0) {
    return null;
  }

  const subdivision = strummingPattern?.subdivision;

  return (
    <TooltipProvider>
      <div className={cn("font-mono text-base", !printMode && "overflow-x-auto", className)}>
      {measures.map((measure, measureIndex) => (
        <div key={measure.id} className="mb-2">
          {/* Tab grid - 6 strings */}
          <div className={cn(
            "rounded p-2 inline-block",
            printMode ? "bg-gray-100" : "bg-muted/20",
            strummingPattern && "pt-5",
          )}>
            {TAB_STRING_NAMES.map((stringName, stringIndex) => (
              <div key={stringIndex} className="flex items-center gap-0">
                {/* String label */}
                <span
                  className={cn(!printMode && "text-muted-foreground")}
                  style={{
                    display: 'inline-block',
                    width: '0.75rem',
                    textAlign: 'right',
                    marginRight: '0.25rem',
                    ...(printMode && { color: '#4b5563' }),
                  }}
                >
                  {stringName}
                </span>

                {/* Horizontal line */}
                <span className={cn("font-bold", printMode ? "text-gray-600" : "text-muted-foreground")}>|</span>

                {/* Notes for this string */}
                {measure.columns.map((column, columnIndex) => {
                  const note = column.strings[stringIndex];
                  const fret = note.fret;
                  const technique = note.technique;
                  const isBeatBoundary = subdivision !== undefined && (columnIndex + 1) % subdivision === 0;

                  // Beat label: only above the top string row
                  const beatLabel = strummingPattern && stringIndex === 0 ? (() => {
                    const beatType = getBeatLabel(columnIndex, strummingPattern.subdivision);
                    const beatNum = Math.floor(columnIndex / strummingPattern.subdivision) + 1;
                    return beatType === 'on' ? String(beatNum) : beatType;
                  })() : null;

                  return (
                    <span key={columnIndex} className="inline-flex items-center">
                      {/* Cell — relative so beat label can be positioned above it */}
                      <span className="relative inline-block">
                        {beatLabel !== null && (
                          <span
                            className="absolute bottom-full left-0 right-0 flex justify-center pb-0.5 pointer-events-none"
                            style={{ fontSize: 9, color: printMode ? '#9ca3af' : undefined }}
                          >
                            {beatLabel}
                          </span>
                        )}
                        <span className={cn("inline-block w-7 text-center font-bold", printMode ? "text-gray-900" : "")}>
                          {fret !== null ? (
                            <>
                              {fret}
                              {technique && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={cn("text-xs align-super cursor-help", printMode ? "text-blue-700" : "text-blue-600")}>
                                      {technique}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{TECHNIQUE_LABELS[technique]}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            '-'
                          )}
                        </span>
                      </span>

                      {/* Beat-aware separator */}
                      {columnIndex < measure.columns.length - 1 && (
                        isBeatBoundary
                          ? <span className={cn("font-bold", printMode ? "text-gray-500" : "text-primary/50")} style={{ padding: '0 1px' }}>|</span>
                          : <span className={printMode ? "text-gray-400" : "text-muted-foreground"}>-</span>
                      )}
                    </span>
                  );
                })}

                {/* End line */}
                <span className={cn("font-bold", printMode ? "text-gray-600" : "text-muted-foreground")}>|</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    </TooltipProvider>
  );
}
