import { forwardRef } from "react";
import { ChordDiagram, isChordEdited } from "@/types/chord";
import { ChordDiagramComponent } from "./ChordDiagram";

interface PrintableSheetProps {
  title: string;
  rows: ChordDiagram[][];
}

export const PrintableSheet = forwardRef<HTMLDivElement, PrintableSheetProps>(
  ({ title, rows }, ref) => {
    // Filter to only include edited chords
    const editedRows = rows
      .map((row) => row.filter(isChordEdited))
      .filter((row) => row.length > 0);

    // Calculate appropriate size based on max chords in a row
    const maxChordsInRow = Math.max(...editedRows.map(row => row.length), 0);
    const diagramSize = maxChordsInRow >= 5 ? "md" : "lg";

    return (
      <div
        ref={ref}
        className="bg-white p-4 min-h-[297mm] w-[210mm] mx-auto print:m-0 print:p-4"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          {title || "Chord Chart"}
        </h1>

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
