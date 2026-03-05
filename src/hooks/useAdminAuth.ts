import { useState, useCallback } from "react";
import { APP_CONFIG } from "@/config/appConfig";
import { getAdminToken, setAdminToken, clearAdminToken } from "@/services/adminAuth";

const apiUrl = APP_CONFIG.presets.cloudflareD1.apiUrl;

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getAdminToken();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
      setIsLoading(false);
      return true;
    } catch (err) {
      setError("Could not connect to server");
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, error, login, logout };
}
