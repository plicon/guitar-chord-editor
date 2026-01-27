import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Save, FolderOpen, FileDown, FileUp, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface AppHeaderProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
}

const ActionButton = ({ onClick, icon: Icon, label, disabled = false }: ActionButtonProps) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className="justify-start"
  >
    <Icon className="w-4 h-4 mr-2" />
    {label}
  </Button>
);

export const AppHeader = ({
  onNew,
  onOpen,
  onSave,
  onExport,
  onImport,
  isSaving,
}: AppHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleMobileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImport(e);
    setMobileMenuOpen(false);
  };

  const handleMobileAction = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between gap-2">
          {/* Logo and title */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <img
              src="/ms-icon-310x310.png"
              alt="Fretkit Logo"
              className="w-12 h-12 md:w-24 md:h-24 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-lg md:text-4xl font-bold text-foreground truncate">
                Fretkit
              </h1>
              <span className="hidden md:inline text-lg font-bold text-foreground">
                {" "}- Guitar Chord Creator
              </span>
            </div>
          </div>

          {/* Desktop actions */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <ActionButton onClick={onNew} icon={Plus} label="New" />
              <ActionButton onClick={onOpen} icon={FolderOpen} label="Open" />
              <ActionButton onClick={onSave} icon={Save} label={isSaving ? "Saving..." : "Save"} disabled={isSaving} />
              <ActionButton onClick={onExport} icon={FileDown} label="Export" />
              <ActionButton onClick={handleImportClick} icon={FileUp} label="Import" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
              <ThemeToggle />
            </div>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Create and print beautiful chord diagrams
        </p>
      </div>

      {/* Mobile drawer menu */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription className="sr-only">
              Application actions menu
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4">
            <ActionButton onClick={() => handleMobileAction(onNew)} icon={Plus} label="New" />
            <ActionButton onClick={() => handleMobileAction(onOpen)} icon={FolderOpen} label="Open" />
            <ActionButton onClick={() => handleMobileAction(onSave)} icon={Save} label={isSaving ? "Saving..." : "Save"} disabled={isSaving} />
            <ActionButton onClick={() => handleMobileAction(onExport)} icon={FileDown} label="Export" />
            <ActionButton onClick={handleImportClick} icon={FileUp} label="Import" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleMobileImport}
              className="hidden"
            />
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
};
