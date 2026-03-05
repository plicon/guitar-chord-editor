import { ReactNode } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLogin } from "./AdminLogin";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, error, login, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} isLoading={isLoading} error={error} />;
  }

  return (
    <div className="relative">
      <div className="fixed top-4 right-16 z-50">
        <Button variant="ghost" size="sm" onClick={logout} title="Logout">
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>
      {children}
    </div>
  );
}
