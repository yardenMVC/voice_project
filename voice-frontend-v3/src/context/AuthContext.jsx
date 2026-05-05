import { createContext, useState, useCallback, useEffect } from "react";
import * as authApi from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      if (data) {
        setUser({ username: data.username, roles: data.roles || [] });
      }
    } catch {
      // No valid session — stay logged out
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setUser({ username: data.username, roles: data.roles || [] });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  return (
      <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
        {children}
      </AuthContext.Provider>
  );
}
