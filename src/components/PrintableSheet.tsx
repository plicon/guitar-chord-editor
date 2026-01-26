import { forwardRef } from "react";
import { ChordDiagram, isChordEdited } from "@/types/chord";
import { StrummingPattern, hasStrummingContent } from "@/types/strumming";
import { ChordDiagramComponent } from "./ChordDiagram";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PrintableSheetProps {
  title: string;
  rows: ChordDiagram[][];
  rowSubtitles?: string[];
  strummingPattern?: StrummingPattern | null;
}

export const PrintableSheet = forwardRef<HTMLDivElement, PrintableSheetProps>(
  ({ title, rows, rowSubtitles = [], strummingPattern }, ref) => {
    // Process rows to keep structure but filter completely empty rows
    // Keep empty chords between filled ones
    const processedRows = rows.map((row, rowIndex) => {
      const hasAnyEdited = row.some(isChordEdited);
      if (!hasAnyEdited) return null;
      
      // Find first and last edited chord indices
      let firstEditedIndex = -1;
      let lastEditedIndex = -1;
      row.forEach((chord, index) => {
        if (isChordEdited(chord)) {
          if (firstEditedIndex === -1) firstEditedIndex = index;
          lastEditedIndex = index;
        }
      });
      
      // Return only chords from first to last edited (keeping empties in between)
      return {
        chords: row.slice(firstEditedIndex, lastEditedIndex + 1),
        originalIndex: rowIndex,
      };
    }).filter(Boolean) as { chords: ChordDiagram[]; originalIndex: number }[];

    // Calculate appropriate size based on max chords in a row
    const maxChordsInRow = Math.max(...processedRows.map(r => r.chords.length), 0);
    const diagramSize = maxChordsInRow >= 5 ? "md" : "lg";

    const showStrumming = hasStrummingContent(strummingPattern) && strummingPattern;

    return (
      <div
        ref={ref}
        className="bg-white p-4 min-h-[297mm] w-[210mm] mx-auto print:m-0 print:p-4"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Title and Strumming Pattern */}
        <div className={`mb-6 ${showStrumming ? "flex items-start justify-between gap-4" : ""}`}>
          <h1 className={`text-2xl font-bold text-gray-900 ${showStrumming ? "text-left" : "text-left"}`}>
            {title || "Chord Chart"}
          </h1>

          {/* Strumming Pattern for Print */}
          {showStrumming && (
            <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1">
              <span className="text-xs text-gray-600 mr-2">Strumming:</span>
              {Array.from({ length: strummingPattern.bars }).map((_, barIndex) => (
                <div key={barIndex} className="flex items-center">
                  <div className="flex items-center border border-gray-200 rounded px-1">
                    {strummingPattern.beats
                      .slice(barIndex * 8, (barIndex + 1) * 8)
                      .map((beat, slotIndex) => {
                        const isOffBeat = beat.beatType === "off";
                        const beatLabel = isOffBeat ? "&" : String(Math.floor(slotIndex / 2) + 1);
                        
                        return (
                          <div
                            key={slotIndex}
                            className="flex flex-col items-center justify-center relative"
                            style={{ width: 16, height: 110 }}
                          >
                            <span className={`absolute top-0 text-[9px] ${isOffBeat ? "text-gray-400" : "text-gray-500"}`}>
                              {beatLabel}
                            </span>
                            <div className="absolute top-1/2 w-full h-[1px] bg-gray-400" />
                            {beat.stroke === "up" && (
                              <ArrowUp className="text-gray-800 absolute" style={{ top: 12, width: 14, height: 42 }} />
                            )}
                            {beat.stroke === "down" && (
                              <ArrowDown className="text-gray-800 absolute" style={{ bottom: 8, width: 14, height: 42 }} />
                            )}
                            {beat.noteValue === "half" && beat.stroke && (
                              <div className="absolute bottom-1 w-2 h-[2px] bg-gray-800" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                  {barIndex < strummingPattern.bars - 1 && (
                    <div className="w-[2px] h-10 bg-gray-400 mx-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chord Rows */}
        <div className="space-y-4">
          {processedRows.map(({ chords, originalIndex }, idx) => {
            const subtitle = rowSubtitles[originalIndex];
            
            return (
              <div key={idx} className="space-y-1">
                {/* Row Subtitle */}
                {subtitle && subtitle.trim() && (
                  <div className="bg-gray-100 rounded px-3 py-1.5 mb-1">
                    <p className="text-sm text-gray-700 font-medium">
                      {subtitle}
                    </p>
                  </div>
                )}
                <div className="flex justify-start gap-3 flex-wrap">
                  {chords.map((chord) => (
                    <ChordDiagramComponent
                      key={chord.id}
                      chord={chord}
                      size={diagramSize}
                      showPlaceholder={!isChordEdited(chord)}
                      printMode={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {processedRows.length === 0 && (
          <p className="text-center text-gray-500 mt-20">
            No chords have been added yet.
          </p>
        )}
      </div>
    );
  }
);

PrintableSheet.displayName = "PrintableSheet";
