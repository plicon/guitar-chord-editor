import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StrummingPattern, StrumBeat, createEmptyPattern, BeatType, TimeSignature, getSlotsPerBar } from "@/types/strumming";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { strummingPresets, applyPresetToBeats } from "@/data/strummingPresets";

interface StrummingPatternEditorProps {
  pattern: StrummingPattern | null;
  open: boolean;
  onClose: () => void;
  onSave: (pattern: StrummingPattern) => void;
  onDelete: () => void;
}

export const StrummingPatternEditor = ({
  pattern,
  open,
  onClose,
  onSave,
  onDelete,
}: StrummingPatternEditorProps) => {
  const [editedPattern, setEditedPattern] = useState<StrummingPattern>(
    pattern || createEmptyPattern(1)
  );
  useEffect(() => {
    if (open) {
      setEditedPattern(pattern || createEmptyPattern(1));
    }
  }, [open, pattern]);

  const handleBarsChange = (value: string) => {
    const newBars = parseInt(value);
    const slotsPerBar = getSlotsPerBar(editedPattern.timeSignature);
    const newBeats: StrumBeat[] = Array.from(
      { length: newBars * slotsPerBar },
      (_, i) => editedPattern.beats[i] || { 
        stroke: null, 
        noteValue: "full",
        beatType: (i % 2 === 0 ? "on" : "off") as BeatType
      }
    );
    setEditedPattern({
      ...editedPattern,
      bars: newBars,
      beats: newBeats,
    });
  };

  const handleTimeSignatureChange = (value: string) => {
    const newTimeSignature = value as TimeSignature;
    // For 6/8, force to 1 bar only
    const newBars = newTimeSignature === "6/8" ? 1 : editedPattern.bars;
    const newPattern = createEmptyPattern(newBars, newTimeSignature);
    setEditedPattern(newPattern);
  };

  const handlePresetChange = (presetName: string) => {
    const preset = strummingPresets.find((p) => p.name === presetName);
    if (preset) {
      // Automatically adjust bars to match the preset's bar count
      const targetBars = Math.max(preset.bars, editedPattern.bars);
      const newBeats = applyPresetToBeats(preset, targetBars, editedPattern.timeSignature);
      setEditedPattern({
        ...editedPattern,
        bars: targetBars,
        beats: newBeats,
      });
    }
  };

  // Filter presets by current time signature
  const filteredPresets = strummingPresets.filter(
    p => p.timeSignature === editedPattern.timeSignature
  );

  const handleBeatClick = (beatIndex: number, clickPosition: "up" | "down") => {
    const newBeats = [...editedPattern.beats];
    const currentBeat = newBeats[beatIndex];

    // Toggle logic: if already the same stroke, clear it
    if (
      (clickPosition === "up" && currentBeat.stroke === "up") ||
      (clickPosition === "down" && currentBeat.stroke === "down")
    ) {
      newBeats[beatIndex] = { ...currentBeat, stroke: null };
    } else {
      newBeats[beatIndex] = {
        ...currentBeat,
        stroke: clickPosition,
      };
    }

    setEditedPattern({ ...editedPattern, beats: newBeats });
  };

  const handleSave = () => {
    onSave(editedPattern);
    onClose();
  };

  const handleClear = () => {
    setEditedPattern(createEmptyPattern(1, "4/4"));
  };

  const beatWidth = 36;
  const beatHeight = 80;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Strumming Pattern Editor</DialogTitle>
          <DialogDescription className="sr-only">
            Create and edit strumming patterns with up and down strokes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>Time:</Label>
              <Select
                value={editedPattern.timeSignature}
                onValueChange={handleTimeSignatureChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Bars:</Label>
              <Select
                value={editedPattern.bars.toString()}
                onValueChange={handleBarsChange}
                disabled={editedPattern.timeSignature === "6/8"}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Presets:</Label>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {filteredPresets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          </div>

          {/* Pattern Editor Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2">
              {/* Single bar display - shows all beats continuously for 2-bar patterns */}
              <div className="flex items-center border-2 border-border rounded-lg bg-card p-2">
                {editedPattern.beats.map((beat, beatIndex) => {
                  const isOffBeat = beat.beatType === "off";
                  // For 2 bars, count 1-8 instead of repeating 1-4
                  const beatNumber = Math.floor(beatIndex / 2) + 1;
                  const beatLabel = isOffBeat ? "&" : String(beatNumber);

                  return (
                    <div
                      key={beatIndex}
                      className="flex flex-col items-center"
                      style={{ width: beatWidth }}
                    >
                      {/* Beat label */}
                      <span className={cn(
                        "text-sm font-medium mb-1",
                        isOffBeat ? "text-muted-foreground/60" : "text-muted-foreground"
                      )}>
                        {beatLabel}
                      </span>

                      {/* Interactive area */}
                      <div
                        className="relative cursor-pointer rounded-md hover:bg-muted/50 transition-colors"
                        style={{ width: beatWidth - 4, height: beatHeight }}
                      >
                        {/* Upper click zone (upstroke) */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1/2 flex items-center justify-center hover:bg-primary/10 rounded-t-md transition-colors"
                          onClick={() => handleBeatClick(beatIndex, "up")}
                        >
                          {beat.stroke === "up" && (
                            <ArrowUp 
                              className="text-primary" 
                              style={{ width: beatWidth - 8, height: beatHeight - 8 }} 
                            />
                          )}
                        </div>

                        {/* Lower click zone (downstroke) */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1/2 flex items-center justify-center hover:bg-primary/10 rounded-b-md transition-colors"
                          onClick={() => handleBeatClick(beatIndex, "down")}
                        >
                          {beat.stroke === "down" && (
                            <ArrowDown 
                              className="text-primary" 
                              style={{ width: beatWidth - 8, height: beatHeight - 8 }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            Click above the line for an upstroke (↑), below the line for a
            downstroke (↓). Click again to remove.
          </p>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={onDelete}
              className={cn(!pattern && "invisible")}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Pattern
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Pattern</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
