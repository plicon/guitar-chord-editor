import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Save, FolderOpen, FileDown, FileUp } from "lucide-react";

interface AppHeaderProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}

export const AppHeader = ({
  onNew,
  onOpen,
  onSave,
  onExport,
  onImport,
  isSaving,
}: AppHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ms-icon-310x310.png" alt="Fretkit Logo" className="w-24 h-24" />
            <h1 className="text-4xl font-bold text-foreground">
              Fretkit - Guitar Chord Creator
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onNew}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button variant="outline" size="sm" onClick={onOpen}>
              <FolderOpen className="w-4 h-4 mr-1" />
              Open
            </Button>
            <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <FileDown className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="w-4 h-4 mr-1" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
            <ThemeToggle />
          </div>
        </div>
        <p className="text-muted-foreground mt-1">
          Create and print beautiful chord diagrams
        </p>
      </div>
    </header>
  );
};
