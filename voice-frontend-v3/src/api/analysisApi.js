import { apiFetch, getToken } from "./client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const ALLOWED_TYPES = ["audio/wav", "audio/mpeg", "audio/x-wav"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export function validateAudioFile(file) {
  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error(`Unsupported file type: ${file.type}. Accepted: WAV, MP3`);
  if (file.size > MAX_SIZE_BYTES)
    throw new Error(`File too large. Maximum is 50 MB`);
}

export async function uploadAudio(file) {
  validateAudioFile(file);
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

export const getHistory = () => apiFetch("/api/analysis/history");
export const getHistoryByUsername = (username) => apiFetch(`/api/analysis/history/${username}`);
export const deleteAnalysis = (id) => apiFetch(`/api/analysis/${id}`, { method: "DELETE" });