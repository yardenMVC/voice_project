/**
 * authApi.js — Authentication endpoints
 *
 * Tokens are managed as HttpOnly cookies by the backend.
 * Login/refresh return user info (username, roles) in the response body.
 */

import { apiFetch, rawFetch } from "./client";

export const login = (username, password) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

export const register = (username, email, password) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });

export const logout = () =>
    apiFetch("/api/auth/logout", { method: "POST" });

export const me = () =>
    rawFetch("/api/auth/me");
