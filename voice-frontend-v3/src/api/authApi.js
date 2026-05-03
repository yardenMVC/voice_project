/**
 * authApi.js — Authentication endpoints
 *
 * All auth calls are routed through apiFetch(), which handles Authorization
 * headers and 401 redirects centrally.  The login response carries the JWT
 * access token; AuthContext stores it in memory via setToken().
 */

import { apiFetch } from "./client";

export const login = (username, password) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

export const register = (username, email, password) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });

export const logout = () =>
    apiFetch("/api/auth/logout", { method: "POST" });

export const refresh = (refreshToken) =>
    apiFetch("/api/auth/refresh-token", { method: "POST", body: JSON.stringify({ refreshToken }) });
