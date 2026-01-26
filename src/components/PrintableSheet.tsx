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

    return (
      <div
        ref={ref}
        className="bg-white p-8 min-h-[297mm] w-[210mm] mx-auto print:m-0 print:p-8"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          {title || "Chord Chart"}
        </h1>

        {/* Chord Rows */}
        <div className="space-y-8">
          {editedRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-center gap-8 flex-wrap"
            >
              {row.map((chord) => (
                <ChordDiagramComponent
                  key={chord.id}
                  chord={chord}
                  size="lg"
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
