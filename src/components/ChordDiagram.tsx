import { ChordDiagram as ChordDiagramType, isChordEdited } from "@/types/chord";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ChordDiagramProps {
  chord: ChordDiagramType;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showPlaceholder?: boolean;
  printMode?: boolean;
}

const sizeConfig = {
  sm: { width: 80, height: 100, fontSize: 10 },
  md: { width: 120, height: 150, fontSize: 14 },
  lg: { width: 160, height: 200, fontSize: 18 },
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
  const fretSpacing = (config.height - 30) / (chord.frets + 1);
  const nutHeight = 4;
  const startX = stringSpacing;
  const startY = 25;
  
  const edited = isChordEdited(chord);

  if (!edited && !showPlaceholder) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center cursor-pointer transition-all",
        !printMode && "hover:scale-105"
      )}
      onClick={onClick}
    >
      {/* Chord Name */}
      <span
        className="font-semibold text-foreground mb-1"
        style={{ fontSize: config.fontSize }}
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
            {chord.startFret === 1 ? (
              <rect
                x={startX}
                y={startY}
                width={stringSpacing * 5}
                height={nutHeight}
                className="fill-chord-fret"
              />
            ) : (
              <text
                x={startX - 10}
                y={startY + fretSpacing}
                className="fill-muted-foreground"
                fontSize={10}
                textAnchor="middle"
              >
                {chord.startFret}
              </text>
            )}

            {/* Strings */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={`string-${i}`}
                x1={startX + i * stringSpacing}
                y1={startY + (chord.startFret === 1 ? nutHeight : 0)}
                x2={startX + i * stringSpacing}
                y2={startY + fretSpacing * chord.frets}
                className="stroke-chord-string"
                strokeWidth={1}
              />
            ))}

            {/* Frets */}
            {Array.from({ length: chord.frets + 1 }).map((_, i) => (
              <line
                key={`fret-${i}`}
                x1={startX}
                y1={startY + i * fretSpacing + (chord.startFret === 1 && i === 0 ? nutHeight : 0)}
                x2={startX + stringSpacing * 5}
                y2={startY + i * fretSpacing + (chord.startFret === 1 && i === 0 ? nutHeight : 0)}
                className="stroke-chord-fret"
                strokeWidth={i === 0 && chord.startFret === 1 ? 0 : 1}
              />
            ))}

            {/* Barres */}
            {chord.barres.map((barre, i) => (
              <rect
                key={`barre-${i}`}
                x={startX + (6 - barre.fromString) * stringSpacing - 4}
                y={startY + (barre.fret - 0.5) * fretSpacing - 6}
                width={(barre.fromString - barre.toString) * stringSpacing + 8}
                height={12}
                rx={6}
                className="fill-chord-dot"
              />
            ))}

            {/* Finger positions */}
            {chord.fingers.map((finger, i) => (
              <circle
                key={`finger-${i}`}
                cx={startX + (6 - finger.string) * stringSpacing}
                cy={startY + (finger.fret - 0.5) * fretSpacing}
                r={stringSpacing / 3}
                className="fill-chord-dot"
              />
            ))}

            {/* Muted strings (X) */}
            {chord.mutedStrings.map((string) => (
              <text
                key={`muted-${string}`}
                x={startX + (6 - string) * stringSpacing}
                y={startY - 5}
                className="fill-muted-foreground"
                fontSize={12}
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
                cy={startY - 10}
                r={4}
                className="stroke-muted-foreground fill-none"
                strokeWidth={1.5}
              />
            ))}
          </>
        ) : null}
      </svg>
    </div>
  );
};
