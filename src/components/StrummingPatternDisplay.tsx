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
  // Reduced widths for better space efficiency
  const beatWidth = compact ? 14 : 20;
  const height = compact ? 36 : 48;
  const arrowHeight = (height - 8) / 2;

  return (
    <div className="flex items-center gap-1 overflow-x-auto max-w-full">
      {/* Single continuous bar display */}
      <div className="flex items-center border border-border rounded-md bg-card/50 px-0.5">
        {pattern.beats.map((beat, beatIndex) => {
          const beatLabel = beat.beatType === "on" 
            ? String(Math.floor(beatIndex / pattern.subdivision) + 1)
            : beat.beatType;

          return (
            <div
              key={beatIndex}
              className="flex flex-col items-center justify-center relative"
              style={{ width: beatWidth, height }}
            >
              {/* Beat label */}
              <span className={cn(
                "absolute top-0 text-[8px] font-medium",
                beat.beatType === "on" ? "text-muted-foreground" : "text-muted-foreground/50"
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
    </div>
  );
};
