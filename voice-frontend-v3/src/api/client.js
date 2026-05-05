/**
 * client.js — Central HTTP layer
 *
 * Tokens live in HttpOnly cookies set by the backend.
 * The browser attaches them automatically via credentials: "include".
 * This file has no token storage or Authorization header injection.
 */

const BASE_URL = "http://localhost:8080";
let isRefreshing = false;
let refreshQueue = [];

// ── Core fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const res = await _fetch(path, options);

  if (res.status === 401 && !options._isRetry) {
    const refreshed = await _tryRefresh();
    if (refreshed) {
      return _fetch(path, { ...options, _isRetry: true });
    }
    window.location.href = "/login";
    return;
  }

  if (res.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "An unexpected error occurred");
  }

  return res.status === 204 ? null : res.json();
}

/** Raw fetch — no 401 interception. Used for session probing (e.g. /me). */
export async function rawFetch(path) {
  const res = await _fetch(path, {});
  if (!res.ok) return null;
  return res.json();
}

async function _fetch(path, options = {}) {
  const { _isRetry, ...fetchOptions } = options;

  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (fetchOptions.headers && fetchOptions.headers["Content-Type"] === null) {
    delete headers["Content-Type"];
  }

  return fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });
}

async function _tryRefresh() {
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await _fetch("/api/auth/refresh-token", { method: "POST" });

    if (!res.ok) throw new Error(res.status);

    refreshQueue.forEach((resolve) => resolve(true));
    refreshQueue = [];
    return true;
  } catch {
    refreshQueue.forEach((resolve) => resolve(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}
