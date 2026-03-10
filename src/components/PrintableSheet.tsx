import { forwardRef } from "react";
import { ChordDiagram, isChordEdited } from "@/types/chord";
import { StrummingPattern, hasStrummingContent } from "@/types/strumming";
import { ChordDiagramComponent } from "./ChordDiagram";
import { APP_CONFIG } from "@/config/appConfig";
import { APP_VERSION } from "@/config/version";


interface PrintableSheetProps {
  title: string;
  description?: string;
  rows: ChordDiagram[][];
  rowSubtitles?: string[];
  sectionIndices?: number[];
  sectionTitles?: string[];
  strummingPattern?: StrummingPattern | null;
}

export const PrintableSheet = forwardRef<HTMLDivElement, PrintableSheetProps>(
  ({ title, description, rows, rowSubtitles = [], sectionIndices = [], sectionTitles = [], strummingPattern }, ref) => {
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

    // Use print-optimized size - fits 5 diagrams per row on A4 with equal margins
    const diagramSize = "print";

    const showStrumming = hasStrummingContent(strummingPattern) && strummingPattern;

    return (
      <div
        ref={ref}
        className="bg-white p-4 w-[210mm] mx-auto print:m-0 print:p-4 relative overflow-hidden"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Watermark - visible in preview and print */}
        {APP_CONFIG.showWatermark && (
          <div 
            className="absolute pointer-events-none"
            style={{ 
              zIndex: 9999,
              top: 0,
              left: 0,
              width: '210mm',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span 
              className="text-gray-400 select-none whitespace-nowrap"
              style={{ 
                fontFamily: "'Permanent Marker', cursive",
                fontSize: '90px',
                opacity: 0.2,
                transform: 'rotate(-55deg)',
                letterSpacing: '0.05em',
                display: 'block',
              }}
            >
              {APP_CONFIG.watermarkText || APP_CONFIG.appName}
            </span>
          </div>
        )}
        {/* Title, Strumming Pattern, and Separator — all captured together as one PDF section */}
        <div data-pdf-section="header" className="mb-4">
          <div className={`${showStrumming ? "flex items-start justify-between gap-4" : ""}`}>
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
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Strumming Pattern <span className="font-bold">{strummingPattern.timeSignature}</span></span>
              <div className="flex items-center gap-2">
                {/* Single continuous bar display */}
                <div className="relative bg-gray-50 rounded border border-gray-200">
                  {/* Staff lines */}
                  <div className="absolute inset-0 flex flex-col justify-center pointer-events-none" style={{ paddingTop: 14, paddingBottom: 7 }}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="w-full h-[1px] bg-gray-300" style={{ marginBottom: line < 4 ? 7 : 0 }} />
                    ))}
                  </div>
                  
                  <div className="flex items-center relative" style={{ height: 70 }}>
                    {strummingPattern.beats.map((beat, beatIndex) => {
                      const beatLabel = beat.beatType === "on" 
                        ? String(Math.floor(beatIndex / strummingPattern.subdivision) + 1)
                        : beat.beatType;
                            
                      return (
                        <div
                          key={beatIndex}
                          className="flex flex-col items-center justify-center relative"
                          style={{ width: 14, height: 70 }}
                        >
                          <span className={`absolute top-0 text-[7px] font-medium ${beat.beatType === "on" ? "text-gray-600" : "text-gray-400"}`}>
                            {beatLabel}
                          </span>
                          
                          {/* Filled up arrow - CSS based for html2canvas compatibility */}
                          {beat.stroke === "up" && (
                            <div className="absolute flex flex-col items-center" style={{ top: 12 }}>
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
          {/* Separator — inside header section so it is captured in the PDF export */}
          {processedRows.length > 0 && !rowSubtitles[processedRows[0]?.originalIndex]?.trim() && (
            <div className="border-t-2 border-black mt-4 pt-2" />
          )}
        </div>

        {/* Chord Rows - Grouped by Section */}
        <div className="space-y-6">
          {(() => {
            // Group rows by section
            const sections: { sectionIndex: number; rows: typeof processedRows }[] = [];
            processedRows.forEach((row) => {
              const sectionIndex = sectionIndices[row.originalIndex] ?? 0;
              const lastSection = sections[sections.length - 1];
              
              if (!lastSection || lastSection.sectionIndex !== sectionIndex) {
                sections.push({ sectionIndex, rows: [row] });
              } else {
                lastSection.rows.push(row);
              }
            });
            
            return sections.map(({ sectionIndex, rows: sectionRows }) => {
              const sectionTitle = sectionTitles[sectionIndex] || '';
              const isAlternate = sectionIndex % 2 === 1;
              const borderColor = isAlternate ? 'border-gray-300' : 'border-gray-200';
              const bgStyle = isAlternate ? { backgroundColor: '#f9fafb' } : { backgroundColor: '#ffffff' };
              const subtitleBgStyle = isAlternate ? { backgroundColor: '#e5e7eb' } : { backgroundColor: '#f3f4f6' };

              return (
                <div key={sectionIndex} data-pdf-section className={`border-2 ${borderColor} rounded-lg`} style={{ zIndex: 1, ...bgStyle }}>
                  {/* Section Title */}
                  {sectionTitle && (
                    <div data-pdf-section-header className="px-4 py-3 border-b-2 border-gray-300">
                      <h2 className="text-lg font-bold text-gray-800">
                        {sectionTitle}
                      </h2>
                    </div>
                  )}

                  {/* All rows in this section */}
                  <div className="p-4 space-y-4">
                    {sectionRows.map(({ chords, originalIndex }, rowIdx) => {
                      const subtitle = rowSubtitles[originalIndex];

                      return (
                        <div key={originalIndex} data-pdf-avoid-break="true" data-pdf-first-row={sectionTitle && rowIdx === 0 ? "true" : undefined}>
                          {/* Row Subtitle */}
                          {subtitle && subtitle.trim() && (
                            <div className="rounded px-3 py-1.5 mb-2" style={subtitleBgStyle}>
                              <p className="text-sm text-gray-700 font-medium">
                                {subtitle}
                              </p>
                            </div>
                          )}
                          <div className="flex justify-center gap-3 flex-wrap">
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
                          {/* Row URL - only show on last row of section */}
                          {APP_CONFIG.showRowUrl && rowIdx === sectionRows.length - 1 && (
                            <div className="flex justify-end mt-2">
                              <span className="text-[10px] text-gray-400">{APP_CONFIG.rowUrl}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {processedRows.length === 0 && (
          <p className="text-center text-gray-500 mt-20">
            No chords have been added yet.
          </p>
        )}

        {/* Footer is now rendered directly in the PDF by usePdfExport */}
      </div>
    );
  }
);

PrintableSheet.displayName = "PrintableSheet";
