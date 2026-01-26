import { StrummingPattern } from "@/types/strumming";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrummingPatternDisplayProps {
  pattern: StrummingPattern;
  compact?: boolean;
}

export const StrummingPatternDisplay = ({
  pattern,
  compact = false,
}: StrummingPatternDisplayProps) => {
  const beatWidth = compact ? 18 : 24;
  const height = compact ? 40 : 52;
  const arrowHeight = (height - 8) / 2;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: pattern.bars }).map((_, barIndex) => (
        <div key={barIndex} className="flex items-center">
          {/* Bar beats */}
          <div className="flex items-center border border-border rounded-md bg-card/50 px-1">
            {pattern.beats
              .slice(barIndex * 8, (barIndex + 1) * 8)
              .map((beat, slotIndex) => {
                const isOffBeat = beat.beatType === "off";
                const beatLabel = isOffBeat ? "&" : String(Math.floor(slotIndex / 2) + 1);

                return (
                  <div
                    key={slotIndex}
                    className="flex flex-col items-center justify-center relative"
                    style={{ width: beatWidth, height }}
                  >
                    {/* Beat label */}
                    <span className={cn(
                      "absolute top-0 text-[9px]",
                      isOffBeat ? "text-muted-foreground/50" : "text-muted-foreground"
                    )}>
                      {beatLabel}
                    </span>

                    {/* Horizontal line */}
                    <div className="absolute top-1/2 w-full h-[2px] bg-muted-foreground/30" />

                    {/* Arrow */}
                    {beat.stroke === "up" && (
                      <ArrowUp
                        className="text-primary absolute"
                        style={{ top: "15%", width: beatWidth - 6, height: arrowHeight }}
                      />
                    )}
                    {beat.stroke === "down" && (
                      <ArrowDown
                        className="text-primary absolute"
                        style={{ top: "50%", width: beatWidth - 6, height: arrowHeight }}
                      />
                    )}
                    {beat.stroke === "rest" && (
                      <span className="text-muted-foreground text-xs absolute top-1/2 -translate-y-1/2">
                        •
                      </span>
                    )}

                    {/* Half note indicator */}
                    {beat.noteValue === "half" && beat.stroke && (
                      <div className="absolute bottom-1 w-2 h-[2px] bg-primary rounded" />
                    )}
                  </div>
                );
              })}
          </div>

          {/* Bar separator */}
          {barIndex < pattern.bars - 1 && (
            <div className="w-[2px] h-6 bg-muted-foreground/50 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
};
