import { forwardRef } from "react";
import { ChordDiagram, isChordEdited } from "@/types/chord";
import { StrummingPattern, hasStrummingContent } from "@/types/strumming";
import { ChordDiagramComponent } from "./ChordDiagram";
import { APP_CONFIG } from "@/config/appConfig";


interface PrintableSheetProps {
  title: string;
  description?: string;
  rows: ChordDiagram[][];
  rowSubtitles?: string[];
  strummingPattern?: StrummingPattern | null;
}

export const PrintableSheet = forwardRef<HTMLDivElement, PrintableSheetProps>(
  ({ title, description, rows, rowSubtitles = [], strummingPattern }, ref) => {
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
        className="bg-white p-4 min-h-[297mm] w-[210mm] mx-auto print:m-0 print:p-4 relative"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Watermark - visible in preview and print */}
        {APP_CONFIG.showWatermark && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none print:flex overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            <span 
              className="text-gray-400 select-none whitespace-nowrap"
              style={{ 
                fontFamily: "'Permanent Marker', cursive",
                fontSize: '100px',
                opacity: 0.2,
                transform: 'rotate(-55deg) scale(1.9)',
                letterSpacing: '0.05em'
              }}
            >
              {APP_CONFIG.watermarkText || APP_CONFIG.appName}
            </span>
          </div>
        )}
        {/* Title and Strumming Pattern */}
        <div className={`mb-4 ${showStrumming ? "flex items-start justify-between gap-4" : ""}`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <img src="/ms-icon-310x310.png" alt="Fretkit Logo" className="w-24 h-24" />
              <h1 className="text-4xl font-bold text-gray-900">
                {title || "Chord Chart"}
              </h1>
            </div>
            {description && description.trim() && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>

          {/* Strumming Pattern for Print - Musical Staff Style */}
          {showStrumming && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Strumming Pattern</span>
              <div className="flex items-center gap-2">
                {/* Single continuous bar display */}
                <div className="relative bg-gray-50 rounded border border-gray-200">
                  {/* Staff lines */}
                  <div className="absolute inset-0 flex flex-col justify-center pointer-events-none" style={{ paddingTop: 16, paddingBottom: 8 }}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="w-full h-[1px] bg-gray-300" style={{ marginBottom: line < 4 ? 8 : 0 }} />
                    ))}
                  </div>
                  
                  <div className="flex items-center relative" style={{ height: 80 }}>
                    {strummingPattern.beats.map((beat, beatIndex) => {
                      const isOffBeat = beat.beatType === "off";
                      // For 2 bars, count 1-8 instead of repeating 1-4
                      const beatNumber = Math.floor(beatIndex / 2) + 1;
                      const beatLabel = isOffBeat ? "&" : String(beatNumber);
                            
                      return (
                        <div
                          key={beatIndex}
                          className="flex flex-col items-center justify-center relative"
                          style={{ width: 18, height: 80 }}
                        >
                          <span className={`absolute top-0 text-[8px] font-medium ${isOffBeat ? "text-gray-400" : "text-gray-600"}`}>
                            {beatLabel}
                          </span>
                          
                          {/* Filled up arrow - CSS based for html2canvas compatibility */}
                          {beat.stroke === "up" && (
                            <div className="absolute flex flex-col items-center" style={{ top: 14 }}>
                              <div 
                                style={{ 
                                  width: 0, 
                                  height: 0, 
                                  borderLeft: '6px solid transparent',
                                  borderRight: '6px solid transparent',
                                  borderBottom: '10px solid #1f2937'
                                }} 
                              />
                              <div style={{ width: 3, height: 18, backgroundColor: '#1f2937' }} />
                            </div>
                          )}
                          
                          {/* Filled down arrow - CSS based for html2canvas compatibility */}
                          {beat.stroke === "down" && (
                            <div className="absolute flex flex-col items-center" style={{ bottom: 6 }}>
                              <div style={{ width: 3, height: 18, backgroundColor: '#1f2937' }} />
                              <div 
                                style={{ 
                                  width: 0, 
                                  height: 0, 
                                  borderLeft: '6px solid transparent',
                                  borderRight: '6px solid transparent',
                                  borderTop: '10px solid #1f2937'
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chord Rows */}
        <div className="space-y-4">
          {/* Separator if first row has no subtitle */}
          {processedRows.length > 0 && !rowSubtitles[processedRows[0]?.originalIndex]?.trim() && (
            <div className="border-t-2 border-black pt-2" />
          )}
          {processedRows.map(({ chords, originalIndex }, idx) => {
            const subtitle = rowSubtitles[originalIndex];
            
            return (
              <div key={idx} className="space-y-1 relative" style={{ zIndex: 1 }}>
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
                {/* Row URL */}
                {APP_CONFIG.showRowUrl && (
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-400">{APP_CONFIG.rowUrl}</span>
                  </div>
                )}
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
