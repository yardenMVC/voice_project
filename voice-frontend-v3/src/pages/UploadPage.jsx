/**
 * UploadPage.jsx — Core product page
 *
 * Data flow (end-to-end):
 *   1. User drags or selects an audio file (WAV / MP3 / FLAC / OGG, ≤ 50 MB)
 *   2. handleUpload() calls useAnalysis().upload(file)
 *      → analysisApi.validateAudioFile()  — client-side type+size guard
 *      → POST multipart/form-data to /api/analysis/upload
 *   3. Backend pipeline:
 *        a. librosa extracts 8 features: MFCC, Jitter, Shimmer, Mel-spectrogram,
 *           Pitch, Energy, Spectral Flatness, Reverberation
 *        b. Autoencoder reconstructs the feature vector → Reconstruction Error
 *        c. RBM scores the feature vector against learned real-voice distribution
 *        d. Soft Voting weights both scores → final verdict REAL | FAKE
 *   4. We render the verdict card + feature breakdown table
 *
 * Why useAnalysis and not a direct fetch here?
 *   The hook owns loading/error state for this feature.  UploadPage stays
 *   a pure "render + event dispatch" component — no async logic in JSX.
 */

import { useState, useRef } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import { FolderOpen, AlertTriangle } from "lucide-react";
import ResultCard from "../components/ResultCard";
import styles from "./UploadPage.module.css";

const ACCEPT = ".wav,.mp3";

export default function UploadPage() {
  const { uploading, result, error, upload, clearError } = useAnalysis();
  const [dropState, setDropState] = useState({ dragOver: false, file: null });
  const inputRef = useRef(null);

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setDropState((s) => ({ ...s, file })); clearError(); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setDropState({ dragOver: false, file }); clearError(); }
    else { setDropState((s) => ({ ...s, dragOver: false })); }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!dropState.file) return;
    try {
      await upload(dropState.file);
    } catch {
      // error is already stored in useAnalysis — nothing more to do here
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Analyze Audio</h1>
        <p className={styles.sub}>
          Upload a voice recording. Our pipeline extracts acoustic features and
          runs Autoencoder + RBM models to determine authenticity.
        </p>

        {/* ── Drop zone ──────────────────────────────────────────────────── */}
        <div
          className={`${styles.dropzone} ${dropState.dragOver ? styles.dragOver : ""} ${
            dropState.file ? styles.hasFile : ""
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDropState((s) => ({ ...s, dragOver: true })); }}
          onDragLeave={() => setDropState((s) => ({ ...s, dragOver: false }))}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Click or drag to upload audio"
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {dropState.file ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileIcon}>voice file</span>
                <span className={styles.fileName}>{dropState.file.name}</span>
                <span className={styles.fileSize}>
      {(dropState.file.size / 1e6).toFixed(2)} MB
    </span>
                <button
                    className={styles.clearBtn}
                    onClick={(e) => { e.stopPropagation(); setDropState({ dragOver: false, file: null }); clearError(); }}
                    title="Remove file"
                >
                  X
                </button>
              </div>
          ) : (
            <div className={styles.dropHint}>
              <span className={styles.dropIcon}><FolderOpen size={16} className="icon" /></span>
              <p>Drag & drop an audio file here</p>
              <p className={styles.dropSub}>
                or <span className={styles.browse}>browse</span> — WAV, MP3
                 (max 50 MB) Minimum duration: 0.5 seconds Maximum duration: 30 seconds
              </p>
            </div>

          )}
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className={styles.errorBanner}>
            <span><AlertTriangle size={16} className="icon" /> {error}</span>
            <button onClick={clearError} className={styles.errorDismiss}>✕</button>
          </div>
        )}

        {/* ── Upload button ──────────────────────────────────────────────── */}
        <button
          className={styles.uploadBtn}
          onClick={handleUpload}
          disabled={!dropState.file || uploading}
        >
          {uploading ? (
            <>
              <span className={styles.spinner} /> Analyzing…
            </>
          ) : (
            "Analyze Voice"
          )}
        </button>

        {uploading && (
          <div className={styles.pipeline} style={{ alignItems: "center" }}>
            <span className={styles.spinner} />
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        {result && !uploading && <ResultCard result={result} />}
      </div>
    </main>
  );
}
