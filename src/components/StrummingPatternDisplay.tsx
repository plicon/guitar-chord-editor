import { StrummingPattern } from "@/types/strumming";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StrummingPatternDisplayProps {
  pattern: StrummingPattern;
  compact?: boolean;
}

export const StrummingPatternDisplay = ({
  pattern,
  compact = false,
}: StrummingPatternDisplayProps) => {
  const beatWidth = compact ? 24 : 32;
  const height = compact ? 48 : 64;
  const arrowSize = compact ? 16 : 20;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: pattern.bars }).map((_, barIndex) => (
        <div key={barIndex} className="flex items-center">
          {/* Bar beats */}
          <div className="flex items-center border border-border rounded-md bg-card/50 px-1">
            {pattern.beats
              .slice(barIndex * pattern.beatsPerBar, (barIndex + 1) * pattern.beatsPerBar)
              .map((beat, beatIndex) => (
                <div
                  key={beatIndex}
                  className="flex flex-col items-center justify-center relative"
                  style={{ width: beatWidth, height }}
                >
                  {/* Beat number */}
                  <span className="absolute top-0 text-[10px] text-muted-foreground">
                    {beatIndex + 1}
                  </span>

                  {/* Horizontal line */}
                  <div className="absolute top-1/2 w-full h-[2px] bg-muted-foreground/30" />

                  {/* Arrow */}
                  {beat.stroke === "up" && (
                    <ArrowUp
                      size={arrowSize}
                      className="text-primary absolute"
                      style={{ top: "25%" }}
                    />
                  )}
                  {beat.stroke === "down" && (
                    <ArrowDown
                      size={arrowSize}
                      className="text-primary absolute"
                      style={{ top: "50%" }}
                    />
                  )}
                  {beat.stroke === "rest" && (
                    <span className="text-muted-foreground text-xs absolute top-1/2 -translate-y-1/2">
                      •
                    </span>
                  )}

                  {/* Half note indicator */}
                  {beat.noteValue === "half" && beat.stroke && (
                    <div className="absolute bottom-1 w-3 h-[2px] bg-primary rounded" />
                  )}
                </div>
              ))}
          </div>

          {/* Bar separator */}
          {barIndex < pattern.bars - 1 && (
            <div className="w-[2px] h-8 bg-muted-foreground/50 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
};
