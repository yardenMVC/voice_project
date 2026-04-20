/**
 * analysisApi.js — Voice analysis endpoints
 */

import { apiFetch, getToken } from "./client";
import { mockAnalysis } from "./mockApi";

const MOCK = import.meta.env.VITE_MOCK === "true";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const ALLOWED_TYPES = ["audio/wav", "audio/mpeg", "audio/flac", "audio/ogg", "audio/x-wav"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function validateAudioFile(file) {
  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error(`Unsupported file type: ${file.type}. Accepted: WAV, MP3, FLAC, OGG`);
  if (file.size > MAX_SIZE_BYTES)
    throw new Error(`File too large (${(file.size / 1e6).toFixed(1)} MB). Maximum is 10 MB`);
}

/** POST /api/analysis/upload */
export async function uploadAudio(file) {
  validateAudioFile(file);
  if (MOCK) return mockAnalysis.uploadAudio(file);

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/api/analysis/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });

  if (res.status === 401) { window.location.href = "/login"; return; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Upload failed");
  }
  return res.json();
}

/** GET /api/analysis/history — own history */
export const getHistory = () =>
    MOCK ? mockAnalysis.getHistory() : apiFetch("/api/analysis/history");

/** GET /api/analysis/history/{username} — ADMIN: any user's history */
export const getHistoryByUsername = (username) =>
    MOCK ? mockAnalysis.getHistory() : apiFetch(`/api/analysis/history/${username}`);

/** DELETE /api/analysis/:id */
export const deleteAnalysis = (id) =>
    MOCK ? mockAnalysis.deleteAnalysis(id) : apiFetch(`/api/analysis/${id}`, { method: "DELETE" });