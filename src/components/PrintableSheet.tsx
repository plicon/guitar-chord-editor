import { forwardRef } from "react";
import { ChordDiagram, isChordEdited } from "@/types/chord";
import { StrummingPattern, hasStrummingContent } from "@/types/strumming";
import { ChordDiagramComponent } from "./ChordDiagram";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PrintableSheetProps {
  title: string;
  rows: ChordDiagram[][];
  strummingPattern?: StrummingPattern | null;
}

export const PrintableSheet = forwardRef<HTMLDivElement, PrintableSheetProps>(
  ({ title, rows, strummingPattern }, ref) => {
    // Filter to only include edited chords
    const editedRows = rows
      .map((row) => row.filter(isChordEdited))
      .filter((row) => row.length > 0);

    // Calculate appropriate size based on max chords in a row
    const maxChordsInRow = Math.max(...editedRows.map(row => row.length), 0);
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
          <h1 className={`text-2xl font-bold text-gray-900 ${showStrumming ? "text-left" : "text-center"}`}>
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
                      .slice(barIndex * strummingPattern.beatsPerBar, (barIndex + 1) * strummingPattern.beatsPerBar)
                      .map((beat, beatIndex) => (
                        <div
                          key={beatIndex}
                          className="flex flex-col items-center justify-center relative"
                          style={{ width: 20, height: 36 }}
                        >
                          <span className="absolute top-0 text-[8px] text-gray-500">
                            {beatIndex + 1}
                          </span>
                          <div className="absolute top-1/2 w-full h-[1px] bg-gray-400" />
                          {beat.stroke === "up" && (
                            <ArrowUp size={12} className="text-gray-800 absolute" style={{ top: "20%" }} />
                          )}
                          {beat.stroke === "down" && (
                            <ArrowDown size={12} className="text-gray-800 absolute" style={{ top: "55%" }} />
                          )}
                          {beat.noteValue === "half" && beat.stroke && (
                            <div className="absolute bottom-0 w-2 h-[1px] bg-gray-800" />
                          )}
                        </div>
                      ))}
                  </div>
                  {barIndex < strummingPattern.bars - 1 && (
                    <div className="w-[2px] h-6 bg-gray-400 mx-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chord Rows */}
        <div className="space-y-4">
          {editedRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-center gap-3 flex-wrap"
            >
              {row.map((chord) => (
                <ChordDiagramComponent
                  key={chord.id}
                  chord={chord}
                  size={diagramSize}
                  showPlaceholder={false}
                  printMode={true}
                />
              ))}
            </div>
          ))}
        </div>

        {editedRows.length === 0 && (
          <p className="text-center text-gray-500 mt-20">
            No chords have been added yet.
          </p>
        )}
      </div>
    );
  }
);

PrintableSheet.displayName = "PrintableSheet";
