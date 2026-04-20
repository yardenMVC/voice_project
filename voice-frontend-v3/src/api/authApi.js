/**
 * authApi.js — Authentication endpoints
 *
 * All auth calls are routed through apiFetch(), which handles Authorization
 * headers and 401 redirects centrally.  The login response carries the JWT
 * access token; AuthContext stores it in memory via setToken().
 */

import { apiFetch } from "./client";
import { mockAuth } from "./mockApi";

const MOCK = import.meta.env.VITE_MOCK === "true";

/** POST /api/auth/login  → { accessToken, refreshToken } */
export const login = (username, password) =>
  MOCK ? mockAuth.login(username, password)
       : apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

/** POST /api/auth/register  → { message } */
export const register = (username, email, password) =>
  MOCK ? mockAuth.register(username, email, password)
       : apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });

/** POST /api/auth/logout  → 204 */
export const logout = () =>
  MOCK ? mockAuth.logout() : apiFetch("/api/auth/logout", { method: "POST" });

export const refresh = (refreshToken) =>
  MOCK ? mockAuth.refresh()
       : apiFetch("/api/auth/refresh-token", { method: "POST", body: JSON.stringify({ refreshToken }) });
