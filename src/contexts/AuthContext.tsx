import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { APP_CONFIG } from "@/config/appConfig";
import { getAdminToken, setAdminToken, clearAdminToken, getAdminAuthHeaders } from "@/services/adminAuth";

const apiUrl = APP_CONFIG.presets.cloudflareD1.apiUrl;

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  error: string;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeaders: (extraHeaders?: Record<string, string>) => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAdminToken());
  const [username, setUsername] = useState<string | null>(() => {
    const token = getAdminToken();
    if (!token) return null;
    try {
      const [payloadB64] = token.split(".");
      const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return payload.sub || null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (user: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Login failed" }));
        setError(data.error || "Invalid credentials");
        setIsLoading(false);
        return false;
      }

      const { token } = await res.json();
      setAdminToken(token);
      setIsAuthenticated(true);
      setUsername(user);
      setIsLoading(false);
      return true;
    } catch {
      setError("Could not connect to server");
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setIsAuthenticated(false);
    setUsername(null);
  }, []);

  const getAuthHeaders = useCallback((extraHeaders: Record<string, string> = {}) => {
    return getAdminAuthHeaders(extraHeaders);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, isLoading, error, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
