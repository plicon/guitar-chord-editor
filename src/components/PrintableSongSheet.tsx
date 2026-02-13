import { forwardRef } from "react";
import { Song } from "@/types/song";
import { ChordDiagramComponent } from "./ChordDiagram";
import { TabRowDisplay } from "./TabRowDisplay";
import { APP_CONFIG } from "@/config/appConfig";
import { isChordEdited } from "@/types/chord";
import { hasStrummingContent } from "@/types/strumming";
import { TabTechnique } from "@/types/tab";

const TECHNIQUE_LABELS: Record<TabTechnique, string> = {
  'h': 'Hammer-on',
  'p': 'Pull-off',
  '/': 'Slide up',
  '\\': 'Slide down',
  'b': 'Bend',
  'r': 'Release',
  '~': 'Vibrato',
};

interface PrintableSongSheetProps {
  song: Song;
}

/**
 * Printable sheet component for section-based songs
 * Handles multiple row types: chord-row, tab-row, etc.
 */
export const PrintableSongSheet = forwardRef<HTMLDivElement, PrintableSongSheetProps>(
  ({ song }, ref) => {
    const showStrumming = hasStrummingContent(song.strummingPattern) && song.strummingPattern;

    // Collect all used techniques from tab rows
    const usedTechniques = new Set<TabTechnique>();
    song.sections.forEach(section => {
      section.rows.forEach(row => {
        if (row.kind === 'tab-row') {
          row.measures.forEach(measure => {
            measure.columns.forEach(column => {
              column.strings.forEach(note => {
                if (note.technique) {
                  usedTechniques.add(note.technique);
                }
              });
            });
          });
        }
      });
    });

    const hasTechniques = usedTechniques.size > 0;

    return (
      <div
        ref={ref}
        className="bg-white p-4 min-h-[297mm] w-[210mm] mx-auto print:m-0 print:p-4 relative"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Watermark - visible in preview and print */}
        {APP_CONFIG.showWatermark && (
        <div 
            className="absolute pointer-events-none print:flex overflow-hidden"
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
        <div className={`mb-2 ${showStrumming ? "flex items-start justify-between gap-4" : ""}`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <img src="/ms-icon-310x310.png" alt="Fretkit Logo" className="w-16 h-16" />
              <h1 className="text-3xl font-bold text-gray-900">
                {song.title || "Untitled Song"}
              </h1>
            </div>
            {song.description && song.description.trim() && (
              <p className="text-sm text-gray-600 mt-1">{song.description}</p>
            )}
            {song.artist && (
              <p className="text-sm text-gray-500 mt-1">by {song.artist}</p>
            )}
          </div>

          {/* Strumming Pattern for Print */}
          {showStrumming && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                Strumming Pattern <span className="font-bold">{song.strummingPattern!.timeSignature}</span>
              </span>
              <div className="flex items-center gap-2">
                <div className="relative bg-gray-50 rounded border border-gray-200">
                  <div className="absolute inset-0 flex flex-col justify-center pointer-events-none" style={{ paddingTop: 14, paddingBottom: 7 }}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="w-full h-[1px] bg-gray-300" style={{ marginBottom: line < 4 ? 7 : 0 }} />
                    ))}
                  </div>
                  
                  <div className="flex items-center relative" style={{ height: 70 }}>
                    {song.strummingPattern!.beats.map((beat, beatIndex) => {
                      const beatLabel = beat.beatType === "on" 
                        ? String(Math.floor(beatIndex / song.strummingPattern!.subdivision) + 1)
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

        {/* Sections */}
        <div className="space-y-3">
          <div className="border-t-2 border-black pt-1" />
          
          {song.sections.map((section, sectionIndex) => {
            const isAlternate = sectionIndex % 2 === 1;
            const bgColor = isAlternate ? 'bg-gray-50' : 'bg-white';
            const borderColor = isAlternate ? 'border-gray-300' : 'border-gray-200';
            
            // Filter out empty rows
            const visibleRows = section.rows.filter(row => {
              if (row.kind === 'chord-row') {
                return row.chords.some(isChordEdited);
              }
              // Tab rows and other types are always visible if present
              return true;
            });
            
            if (visibleRows.length === 0) return null;
            
            return (
              <div key={section.id} className={`border-2 ${borderColor} rounded-lg ${bgColor}`} style={{ zIndex: 1 }}>
                {/* Section Title */}
                {section.name && (
                  <div className="px-3 py-1.5 border-b-2 border-gray-300">
                    <h2 className="text-base font-bold text-gray-800">
                      {section.name}
                    </h2>
                  </div>
                )}
                
                {/* Section Rows */}
                <div className="p-2 space-y-2">
                  {visibleRows.map((row) => (
                    <div key={row.id}>
                      {/* Row Subtitle */}
                      {row.subtitle && row.subtitle.trim() && (
                        <div className={`${isAlternate ? 'bg-gray-200' : 'bg-gray-100'} rounded px-2 py-0.5 mb-0.5`}>
                          <p className="text-xs text-gray-700 font-medium">
                            {row.subtitle}
                          </p>
                        </div>
                      )}
                      
                      {/* Chord Row */}
                      {row.kind === 'chord-row' && (
                        <div className="flex justify-center gap-2 flex-wrap">
                          {row.chords
                            .filter(isChordEdited)
                            .map((chord) => (
                              <ChordDiagramComponent
                                key={chord.id}
                                chord={chord}
                                size="print"
                                showPlaceholder={false}
                                printMode={true}
                              />
                            ))}
                        </div>
                      )}
                      
                      {/* Tab Row */}
                      {row.kind === 'tab-row' && (
                        <TabRowDisplay measures={row.measures} printMode={true} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-2 space-y-0.5">
          {/* Technique Legend */}
          {hasTechniques && (
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-600">
              <div className="font-semibold">Techniques:</div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {Array.from(usedTechniques).sort().map(technique => (
                  <span key={technique}>
                    <span className="font-mono font-semibold">{technique}</span> = {TECHNIQUE_LABELS[technique]}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* URL */}
          {APP_CONFIG.showRowUrl && (
            <div className="flex justify-end">
              <span className="text-[10px] text-gray-400">{APP_CONFIG.rowUrl}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PrintableSongSheet.displayName = "PrintableSongSheet";
