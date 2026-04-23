// analysisApi.js המעודכן
import { apiFetch } from "./client";

export const validateAudioFile = (file) => {
  const ALLOWED_TYPES = ["audio/wav", "audio/mpeg", "audio/x-wav"];
  const MAX_SIZE_BYTES = 50 * 1024 * 1024;

  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error(`Unsupported type: ${file.type}. Accepted: WAV, MP3`);
  if (file.size > MAX_SIZE_BYTES)
    throw new Error(`File too large. Maximum is 50 MB`);
};

export async function uploadAudio(file) {
  validateAudioFile(file);
  const form = new FormData();
  form.append("file", file);

  // אנחנו משתמשים ב-apiFetch, אבל חייבים לבטל את ה-Content-Type ברירת המחדל
  return apiFetch("/api/analysis/upload", {
    method: "POST",
    body: form,
    // ה-null כאן קריטי: הוא אומר ל-apiFetch למחוק את ה-Content-Type
    // ולאפשר לדפדפן להגדיר multipart/form-data בעצמו
    headers: {
      "Content-Type": null,
    },
  });
}

export const getHistory = () => apiFetch("/api/analysis/history");
export const getHistoryByUsername = (username) => apiFetch(`/api/analysis/history/${username}`);
export const deleteAnalysis = (id) => apiFetch(`/api/analysis/${id}`, { method: "DELETE" });