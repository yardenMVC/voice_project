/**
 * AuthContext.jsx — Global authentication state
 *
 * Why memory-only JWT storage?
 *   Storing JWT in localStorage makes it readable by any JavaScript on the page,
 *   including injected XSS payloads.  Keeping it in React state (heap memory) means
 *   it is wiped automatically when the tab closes, and is inaccessible to scripts
 *   outside this module's scope.
 *
 * Token parsing:
 *   We decode the JWT payload (base64url → JSON) to extract `username` and `roles`
 *   without a library.  We do NOT verify the signature on the client — only the
 *   server can verify the signature.  We extract roles purely for UI routing decisions.
 */

import { createContext, useState, useCallback } from "react";
import * as authApi from "../api/authApi";
import { setToken, clearToken } from "../api/client";

export const AuthContext = createContext(null);

/** Decode JWT payload without verifying signature (UI purposes only) */
function parseToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // user shape: { username: string, roles: string[], sub: string }

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setToken(data.accessToken);
    const payload = parseToken(data.accessToken);
    setUser({
      username: payload?.sub || username,
      roles: payload?.roles || [],
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Always clear local state even if server call fails
      clearToken();
      setUser(null);
    }
  }, []);

  /**
   * isAdmin is derived from the roles array.
   * This is used only to show/hide UI elements.
   * The server independently enforces ROLE_ADMIN on every admin endpoint.
   */
  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
