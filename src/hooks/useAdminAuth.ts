import { useState, useCallback, useEffect } from "react";

const SESSION_KEY = "fretkit_admin_auth";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const login = useCallback((username: string, password: string): boolean => {
    const envUser = import.meta.env.VITE_ADMIN_USERNAME;
    const envPass = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!envUser || !envPass) {
      console.warn("Admin credentials not configured (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD)");
      return false;
    }

    if (username === envUser && password === envPass) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
