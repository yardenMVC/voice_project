/**
 * client.js — Central HTTP layer
 *
 * Changes:
 * - Added automatic token refresh on 401 using /api/auth/refresh-token
 * - If refresh fails → clear token and redirect to /login
 */

import { refresh as refreshApi } from "./authApi";

const BASE_URL =  "http://localhost:8080";

let accessToken  = null;
let refreshToken = null;
let isRefreshing = false;
let refreshQueue = []; // pending requests waiting for new token

export const setToken        = (access, refresh) => { accessToken = access; refreshToken = refresh; };
export const getToken        = () => accessToken;
export const clearToken      = () => { accessToken = null; refreshToken = null; };
export const setRefreshToken = (t) => { refreshToken = t; };

// ── Core fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const res = await _fetch(path, options);

  // Token expired → try refresh once
  if (res.status === 401 && refreshToken && !options._isRetry) {
    const newToken = await _tryRefresh();
    if (newToken) {
      return _fetch(path, { ...options, _isRetry: true });
    }
    // Refresh failed — force login
    clearToken();
    window.location.href = "/login";
    return;
  }

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "An unexpected error occurred");
  }

  return res.status === 204 ? null : res.json();
}

async function _fetch(path, options = {}) {
  const { _isRetry, ...fetchOptions } = options;
  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  return fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
}

async function _tryRefresh() {
  if (isRefreshing) {
    // Queue this request until refresh completes
    return new Promise((resolve) => refreshQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const data = await refreshApi(refreshToken);
    accessToken  = data.accessToken;
    if (data.refreshToken) refreshToken = data.refreshToken;
    // Resolve all queued requests
    refreshQueue.forEach((resolve) => resolve(accessToken));
    refreshQueue = [];
    return accessToken;
  } catch {
    refreshQueue.forEach((resolve) => resolve(null));
    refreshQueue = [];
    return null;
  } finally {
    isRefreshing = false;
  }
}