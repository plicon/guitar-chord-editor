import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StrummingPatternDisplay } from "@/components/StrummingPatternDisplay";
import { StrummingPattern, hasStrummingContent } from "@/types/strumming";
import { ListMusic, Pencil } from "lucide-react";

interface ChartMetadataSectionProps {
  title: string;
  description: string;
  strummingPattern: StrummingPattern | null;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onStrummingEditorOpen: () => void;
}

export const ChartMetadataSection = ({
  title,
  description,
  strummingPattern,
  onTitleChange,
  onDescriptionChange,
  onStrummingEditorOpen,
}: ChartMetadataSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">
            Chart Title
          </label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter chart title..."
            className="text-xl font-semibold"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Description / Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add notes, tuning info, or instructions..."
          rows={3}
          className="resize-none"
        />
        <Button
          variant="outline"
          onClick={onStrummingEditorOpen}
        >
          <ListMusic className="w-4 h-4 mr-2" />
          {strummingPattern ? "Edit Pattern" : "Add Strumming Pattern"}
        </Button>
      </div>

      {hasStrummingContent(strummingPattern) && strummingPattern && (
        <div className="p-3 bg-card border border-border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Strumming Pattern
              </span>
              <span className="text-xl font-bold text-foreground">
                {strummingPattern.timeSignature}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onStrummingEditorOpen}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <StrummingPatternDisplay pattern={strummingPattern} />
          </div>
        </div>
      )}
    </div>
  );
};
