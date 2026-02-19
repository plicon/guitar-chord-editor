import { useState } from "react";
import { SongSection, SectionRow, SectionTypeLabels } from "@/types/song";
import { ChordDiagram } from "@/types/chord";
import { TabMeasure } from "@/types/tab";
import { StrummingPattern } from "@/types/strumming";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChordRow } from "@/components/ChordRow";
import { TabRowEditor } from "@/components/TabRowEditor";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit2,
  GripVertical,
  Music 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SongSectionViewProps {
  section: SongSection;
  sectionIndex: number;
  onToggleCollapsed: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<SongSection>) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddRow: (sectionId: string, rowType: 'chord-row' | 'tab-row') => void;
  onRemoveRow: (sectionId: string, rowId: string) => void;
  onChordClick: (sectionId: string, rowId: string, chordIndex: number) => void;
  onUpdateRowSubtitle: (sectionId: string, rowId: string, subtitle: string) => void;
  onUpdateRow: (sectionId: string, rowId: string, updates: Partial<SectionRow>) => void;
  onAddChordToRow: (sectionId: string, rowId: string) => void;
  onRemoveChordFromRow: (sectionId: string, rowId: string) => void;
  strummingPattern?: StrummingPattern | null;
  dragHandleProps?: Record<string, unknown>;
}

export function SongSectionView({
  section,
  sectionIndex,
  onToggleCollapsed,
  onUpdateSection,
  onRemoveSection,
  onAddRow,
  onRemoveRow,
  onChordClick,
  onUpdateRowSubtitle,
  onUpdateRow,
  onAddChordToRow,
  onRemoveChordFromRow,
  strummingPattern,
  dragHandleProps,
}: SongSectionViewProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(section.name);

  const handleNameSave = () => {
    if (editedName.trim()) {
      onUpdateSection(section.id, { name: editedName.trim() });
    } else {
      setEditedName(section.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditedName(section.name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="border rounded-lg bg-card">
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Collapse/Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleCollapsed(section.id)}
          className="p-0 h-6 w-6"
        >
          {section.collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {/* Section Name/Type */}
        <div className="flex-1 flex items-center gap-2">
          {isEditingName ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="h-7 text-sm font-semibold max-w-xs"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1 group"
            >
              {section.name}
              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </button>
          )}
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            {SectionTypeLabels[section.type]}
          </span>
          <span className="text-xs text-muted-foreground">
            {section.rows.length} {section.rows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Row
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAddRow(section.id, 'chord-row')}>
                <Music className="w-4 h-4 mr-2" />
                Chord Row
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddRow(section.id, 'tab-row')}>
                <GripVertical className="w-4 h-4 mr-2" />
                Tab Row
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveSection(section.id)}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Section Content */}
      {!section.collapsed && (
        <div className="p-4 space-y-4">
          {section.rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No rows in this section yet</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Row
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onAddRow(section.id, 'chord-row')}>
                    <Music className="w-4 h-4 mr-2" />
                    Chord Row
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddRow(section.id, 'tab-row')}>
                    <GripVertical className="w-4 h-4 mr-2" />
                    Tab Row
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            section.rows.map((row, rowIndex) => (
              <div key={row.id} className="space-y-2">
                {row.kind === 'chord-row' && (
                  <>
                    {/* Row Subtitle */}
                    <Input
                      value={row.subtitle || ''}
                      onChange={(e) => onUpdateRowSubtitle(section.id, row.id, e.target.value)}
                      placeholder="Row subtitle (optional)..."
                      className="text-sm italic h-8"
                    />
                    
                    {/* Chord Row */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <ChordRow
                          chords={row.chords}
                          rowIndex={rowIndex}
                          onChordClick={(chordIndex) => 
                            onChordClick(section.id, row.id, chordIndex)
                          }
                          onRemove={() => onRemoveRow(section.id, row.id)}
                          onAddChord={() => onAddChordToRow(section.id, row.id)}
                          onRemoveChord={() => onRemoveChordFromRow(section.id, row.id)}
                          showRemove={false}
                        />
                      </div>
                      
                      {/* Remove Row Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRow(section.id, row.id)}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
                
                {row.kind === 'tab-row' && (
                  <>
                    {/* Row Subtitle */}
                    <Input
                      value={row.subtitle || ''}
                      onChange={(e) => onUpdateRowSubtitle(section.id, row.id, e.target.value)}
                      placeholder="Row subtitle (optional)..."
                      className="text-sm italic h-8"
                    />
                    
                    {/* Tab Row */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <TabRowEditor
                          measures={row.measures}
                          onChange={(measures: TabMeasure[]) =>
                            onUpdateRow(section.id, row.id, { kind: 'tab-row', measures })
                          }
                          strummingPattern={strummingPattern}
                        />
                      </div>
                      
                      {/* Remove Row Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRow(section.id, row.id)}
                        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
