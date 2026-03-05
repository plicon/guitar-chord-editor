import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Save, FolderOpen, FileDown, FileUp, Menu, Sparkles, LogIn, LogOut, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AppHeaderProps {
  onNew: () => void;
  onNewAI: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
  isAuthenticated: boolean;
  username: string | null;
  onLogin: (username: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  loginError: string;
  loginLoading: boolean;
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
  onNewAI,
  onOpen,
  onSave,
  onExport,
  onImport,
  isSaving,
  isAuthenticated,
  username,
  onLogin,
  onLogout,
  loginError,
  loginLoading,
}: AppHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onLogin(loginUsername, loginPassword);
    if (success) {
      setLoginDialogOpen(false);
      setLoginUsername("");
      setLoginPassword("");
    }
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
              <ActionButton onClick={onNewAI} icon={Sparkles} label="New AI" />
              {isAuthenticated && (
                <>
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
                </>
              )}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={onLogout}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setLoginDialogOpen(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
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
            <ActionButton onClick={() => handleMobileAction(onNewAI)} icon={Sparkles} label="New AI" />
            {isAuthenticated && (
              <>
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
              </>
            )}
            <div className="border-t border-border pt-2 mt-2">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleMobileAction(onLogout)}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginDialogOpen(true);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>
              Sign in to save, import, and export songs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}
            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};
