import { TabMeasure, TAB_STRING_NAMES, TabTechnique } from "@/types/tab";
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
}

/**
 * Read-only display component for tablature rows
 * Uses monospace font for proper alignment
 */
export function TabRowDisplay({ measures, className, printMode = false }: TabRowDisplayProps) {
  if (!measures || measures.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("font-mono text-base overflow-x-auto", className)}>
      {measures.map((measure, measureIndex) => (
        <div key={measure.id} className="mb-2">
          {/* Tab grid - 6 strings */}
          <div className={cn("rounded p-2 inline-block", printMode ? "bg-gray-100" : "bg-muted/20")}>
            {TAB_STRING_NAMES.map((stringName, stringIndex) => (
              <div key={stringIndex} className="flex items-center gap-0">
                {/* String label */}
                <span className={cn("mr-1 w-3 text-right", printMode ? "text-gray-600" : "text-muted-foreground")}>
                  {stringName}
                </span>
                
                {/* Horizontal line */}
                <span className={cn("font-bold", printMode ? "text-gray-600" : "text-muted-foreground")}>|</span>
                
                {/* Notes for this string */}
                {measure.columns.map((column, columnIndex) => {
                  const note = column.strings[stringIndex];
                  const fret = note.fret;
                  const technique = note.technique;
                  
                  return (
                    <span key={columnIndex} className="relative">
                      {/* Fret number or dash */}
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
                      {/* Separator between columns */}
                      {columnIndex < measure.columns.length - 1 && (
                        <span className={printMode ? "text-gray-600" : "text-muted-foreground"}>-</span>
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
