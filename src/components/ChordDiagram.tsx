import { ChordDiagram as ChordDiagramType, isChordEdited } from "@/types/chord";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ChordDiagramProps {
  chord: ChordDiagramType;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "print";
  showPlaceholder?: boolean;
  printMode?: boolean;
}

const sizeConfig = {
  sm: { width: 80, height: 120, fontSize: 10, fingerSize: 8 },
  md: { width: 120, height: 170, fontSize: 14, fingerSize: 10 },
  lg: { width: 160, height: 220, fontSize: 18, fingerSize: 12 },
  print: { width: 138, height: 190, fontSize: 16, fingerSize: 11 }, // Optimized for 5 per row on A4
};

export const ChordDiagramComponent = ({
  chord,
  onClick,
  size = "md",
  showPlaceholder = true,
  printMode = false,
}: ChordDiagramProps) => {
  const config = sizeConfig[size];
  const stringSpacing = config.width / 7;
  const nutHeight = 4;
  const startX = stringSpacing;
  const startY = 30;
  
  const edited = isChordEdited(chord);

  // Show a leading empty fret when chord doesn't start at fret 1
  // and has no barre on its first displayed fret (e.g. D, D5)
  const hasBarreOnFirstFret = chord.barres.some(b => b.fret === 1);
  const showLeadingFret = chord.startFret > 1 && !hasBarreOnFirstFret;
  const displayFrets = showLeadingFret ? chord.frets + 1 : chord.frets;
  const displayStartFret = showLeadingFret ? chord.startFret - 1 : chord.startFret;
  const fretOffset = showLeadingFret ? 1 : 0;

  const fretSpacing = (config.height - 50) / (displayFrets + 1);

  if (!edited && !showPlaceholder) {
    return null;
  }

  const getFingerLabel = (string: number) => {
    return chord.fingerLabels?.find((f) => f.string === string)?.finger;
  };

  const hasFingerData = chord.fingerLabels && chord.fingerLabels.length > 0;

  // Print mode uses hardcoded light colors for PDF/preview
  const colors = printMode ? {
    foreground: "#111827", // gray-900
    muted: "#6b7280", // gray-500
    fret: "#44403c", // warm gray for frets
    string: "#57534e", // warm gray for strings
    dot: "#92400e", // amber-700 for finger dots
  } : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center cursor-pointer transition-all select-none",
        "active:scale-95 touch-manipulation",
        !printMode && "hover:scale-105"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
    >
      {/* Chord Name */}
      <span
        className={cn("font-semibold mb-1", !printMode && "text-foreground")}
        style={{ 
          fontSize: config.fontSize,
          ...(printMode && { color: colors?.foreground })
        }}
      >
        {chord.name || (showPlaceholder ? "" : "")}
      </span>

      <svg
        width={config.width}
        height={config.height}
        className={cn(
          "rounded-md",
          !edited && showPlaceholder && !printMode && "bg-chord-empty"
        )}
      >
        {!edited && showPlaceholder && !printMode ? (
          <g>
            <Plus
              x={config.width / 2 - 12}
              y={config.height / 2 - 12}
              width={24}
              height={24}
              className="text-muted-foreground"
            />
          </g>
        ) : edited ? (
          <>
            {/* Nut or fret number */}
            {displayStartFret === 1 ? (
              <rect
                x={startX}
                y={startY}
                width={stringSpacing * 5}
                height={nutHeight}
                className={!printMode ? "fill-chord-fret" : undefined}
                fill={printMode ? colors?.fret : undefined}
              />
            ) : (
              <text
                x={startX - 8}
                y={startY + fretSpacing * 0.7}
                className={!printMode ? "fill-muted-foreground" : undefined}
                fill={printMode ? colors?.muted : undefined}
                fontSize={config.fingerSize}
                textAnchor="middle"
              >
                {displayStartFret}
              </text>
            )}

            {/* Strings */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={`string-${i}`}
                x1={startX + i * stringSpacing}
                y1={startY + (displayStartFret === 1 ? nutHeight : 0)}
                x2={startX + i * stringSpacing}
                y2={startY + fretSpacing * displayFrets}
                className={!printMode ? "stroke-chord-string" : undefined}
                stroke={printMode ? colors?.string : undefined}
                strokeWidth={1}
              />
            ))}

            {/* Frets */}
            {Array.from({ length: displayFrets + 1 }).map((_, i) => (
              <line
                key={`fret-${i}`}
                x1={startX}
                y1={startY + i * fretSpacing + (displayStartFret === 1 && i === 0 ? nutHeight : 0)}
                x2={startX + stringSpacing * 5}
                y2={startY + i * fretSpacing + (displayStartFret === 1 && i === 0 ? nutHeight : 0)}
                className={!printMode ? "stroke-chord-fret" : undefined}
                stroke={printMode ? colors?.fret : undefined}
                strokeWidth={i === 0 && displayStartFret === 1 ? 0 : 1}
              />
            ))}

            {/* Barres */}
            {chord.barres.map((barre, i) => {
              const minString = Math.min(barre.fromString, barre.toString);
              const maxString = Math.max(barre.fromString, barre.toString);
              return (
                <rect
                  key={`barre-${i}`}
                  x={startX + (6 - maxString) * stringSpacing - 4}
                  y={startY + (barre.fret + fretOffset - 0.5) * fretSpacing - 6}
                  width={(maxString - minString) * stringSpacing + 8}
                  height={12}
                  rx={6}
                  className={!printMode ? "fill-chord-dot" : undefined}
                  fill={printMode ? colors?.dot : undefined}
                />
              );
            })}

            {/* Finger positions */}
            {chord.fingers.map((finger, i) => (
              <circle
                key={`finger-${i}`}
                cx={startX + (6 - finger.string) * stringSpacing}
                cy={startY + (finger.fret + fretOffset - 0.5) * fretSpacing}
                r={stringSpacing / 3}
                className={!printMode ? "fill-chord-dot" : undefined}
                fill={printMode ? colors?.dot : undefined}
              />
            ))}

            {/* Muted strings (X) */}
            {chord.mutedStrings.map((string) => (
              <text
                key={`muted-${string}`}
                x={startX + (6 - string) * stringSpacing}
                y={startY - 8}
                className={!printMode ? "fill-muted-foreground font-bold" : "font-bold"}
                fill={printMode ? colors?.muted : undefined}
                fontSize={config.fingerSize + 2}
                textAnchor="middle"
              >
                ×
              </text>
            ))}

            {/* Open strings (O) */}
            {chord.openStrings.map((string) => (
              <circle
                key={`open-${string}`}
                cx={startX + (6 - string) * stringSpacing}
                cy={startY - 12}
                r={config.fingerSize / 2.5}
                className={!printMode ? "stroke-muted-foreground fill-none" : "fill-none"}
                stroke={printMode ? colors?.muted : undefined}
                strokeWidth={1.5}
              />
            ))}

            {/* Finger labels at bottom */}
            {hasFingerData && (
              <>
                {[1, 2, 3, 4, 5, 6].map((string) => {
                  const fingerLabel = getFingerLabel(string);
                  if (fingerLabel === undefined) return null;
                  return (
                    <text
                      key={`label-${string}`}
                      x={startX + (6 - string) * stringSpacing}
                      y={startY + fretSpacing * displayFrets + 15}
                      className={!printMode ? "fill-foreground font-medium" : "font-medium"}
                      fill={printMode ? colors?.foreground : undefined}
                      fontSize={config.fingerSize}
                      textAnchor="middle"
                    >
                      {fingerLabel === 0 ? "T" : fingerLabel}
                    </text>
                  );
                })}
              </>
            )}
          </>
        ) : null}
      </svg>
    </div>
  );
};
