/**
 * useAnalysis.js — Audio upload and history management
 *
 * This hook owns all the async logic for:
 *   1. Uploading an audio file to the backend for ML analysis
 *   2. Fetching the user's analysis history
 *
 * UploadPage calls this hook instead of touching the API layer directly,
 * which keeps JSX clean and makes the logic easy to test in isolation.
 *
 * State model:
 *   uploading   — file is in transit / ML pipeline is running
 *   result      — the latest analysis result from the server
 *   history     — list of all past analyses for this user
 *   error       — human-readable error string (null when no error)
 */

import { useState, useCallback } from "react";
import * as analysisApi from "../api/analysisApi";

export function useAnalysis() {
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null);
  const [history,   setHistory]   = useState([]);
  const [error,     setError]     = useState(null);

  /**
   * upload() — validates then POSTs the file.
   *
   * Flow:
   *   1. Client-side validation (type + size) — fast feedback, no network round-trip
   *   2. POST multipart/form-data to /api/analysis/upload
   *   3. Backend extracts 8 features → runs Autoencoder + RBM → Soft Voting → verdict
   *   4. We store the result and prepend it to history for instant UI update
   */
  const upload = useCallback(async (file) => {
    setError(null);
    setResult(null);
    setUploading(true);

    try {
      const data = await analysisApi.uploadAudio(file);
      setResult(data);
      // Optimistically prepend to history so UI updates without a refetch
      setHistory((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * loadHistory() — fetches analysis history from the server.
   * Called on HistoryPage mount.
   */
  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const data = await analysisApi.getHistory();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  /**
   * deleteEntry() — removes a single analysis record.
   * Filters it out locally for instant feedback before server confirms.
   */
  const deleteEntry = useCallback(async (id) => {
    if (!id) return;

    // 1. עדכון מהיר של התצוגה (UI) - "מחיקה אופטימית"
    // אנחנו מסננים את הרשימה כך שכל מה שלא שווה ל-ID שנמחק יישאר
    setHistory((prev) => prev.filter((item) => (item.analysisId ?? item.id) !== id));

    try {
      // 2. קריאה לשרת ה-Java למחיקה בבסיס הנתונים
      await analysisApi.deleteAnalysis(id);
      console.log(`Analysis ${id} deleted successfully`);
    } catch (err) {
      // 3. אם השרת החזיר שגיאה (למשל אין הרשאה), נחזיר את המצב לקדמותו
      console.error("Failed to delete:", err);
      setError("Could not delete analysis. It might be already gone or no permission.");
      loadHistory(); // טעינה מחדש של הנתונים האמיתיים מהשרת
    }
  }, [loadHistory]);

  const clearError = useCallback(() => setError(null), []);

  return { uploading, result, history, error, upload, loadHistory, deleteEntry, clearError };



}
