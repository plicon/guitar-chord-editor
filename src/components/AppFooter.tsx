import { APP_VERSION } from "@/config/version";

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className = "" }: AppFooterProps) {
  return (
    <footer className={`py-4 text-center text-sm text-muted-foreground ${className}`}>
      <span>FretKit v{APP_VERSION}</span>
    </footer>
  );
}
