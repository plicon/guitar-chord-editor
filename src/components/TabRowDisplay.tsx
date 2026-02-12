import { TabMeasure, TAB_STRING_NAMES } from "@/types/tab";
import { cn } from "@/lib/utils";

interface TabRowDisplayProps {
  measures: TabMeasure[];
  className?: string;
}

/**
 * Read-only display component for tablature rows
 * Uses monospace font for proper alignment
 */
export function TabRowDisplay({ measures, className }: TabRowDisplayProps) {
  if (!measures || measures.length === 0) {
    return null;
  }

  return (
    <div className={cn("font-mono text-sm overflow-x-auto", className)}>
      {measures.map((measure, measureIndex) => (
        <div key={measure.id} className="mb-4">
          {/* Measure label */}
          <div className="text-xs text-muted-foreground mb-1">
            Measure {measureIndex + 1}
            {measure.timeSignature && ` (${measure.timeSignature})`}
          </div>
          
          {/* Tab grid - 6 strings */}
          <div className="bg-muted/20 rounded p-2 inline-block">
            {TAB_STRING_NAMES.map((stringName, stringIndex) => (
              <div key={stringIndex} className="flex items-center gap-0">
                {/* String label */}
                <span className="text-muted-foreground mr-1 w-3 text-right">
                  {stringName}
                </span>
                
                {/* Horizontal line */}
                <span className="text-muted-foreground">|</span>
                
                {/* Notes for this string */}
                {measure.columns.map((column, columnIndex) => {
                  const note = column.strings[stringIndex];
                  const fret = note.fret;
                  const technique = note.technique;
                  
                  return (
                    <span key={columnIndex} className="relative">
                      {/* Fret number or dash */}
                      <span className="inline-block w-7 text-center">
                        {fret !== null ? (
                          <>
                            {fret}
                            {technique && (
                              <span className="text-xs align-super text-blue-600">
                                {technique}
                              </span>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </span>
                      {/* Separator between columns */}
                      {columnIndex < measure.columns.length - 1 && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </span>
                  );
                })}
                
                {/* End line */}
                <span className="text-muted-foreground">|</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
