/**
 * UploadPage.jsx — Core product page
 *
 * Data flow (end-to-end):
 *   1. User drags or selects an audio file (WAV / MP3 / FLAC / OGG, ≤ 10 MB)
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
import ResultCard from "../components/ResultCard";
import styles from "./UploadPage.module.css";

const ACCEPT = ".wav,.mp3";

export default function UploadPage() {
  const { uploading, result, error, upload, clearError } = useAnalysis();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); clearError(); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); clearError(); }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await upload(selectedFile);
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
          className={`${styles.dropzone} ${dragOver ? styles.dragOver : ""} ${
            selectedFile ? styles.hasFile : ""
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
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

          {selectedFile ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileIcon}>voice file</span>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>
      {(selectedFile.size / 1e6).toFixed(2)} MB
    </span>
                <button
                    className={styles.clearBtn}
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); clearError(); }}
                    title="Remove file"
                >
                  X
                </button>
              </div>
          ) : (
            <div className={styles.dropHint}>
              <span className={styles.dropIcon}>📂</span>
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
            <span>⚠️ {error}</span>
            <button onClick={clearError} className={styles.errorDismiss}>✕</button>
          </div>
        )}

        {/* ── Upload button ──────────────────────────────────────────────── */}
        <button
          className={styles.uploadBtn}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
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
          <div className={styles.pipeline}>
            <PipelineStep label="Feature Extraction  — 52 acoustic features computed" sub="MFCC × 13, Delta × 13, Delta² × 13, Jitter, Shimmer, SNR, Energy…" active />
            
            <PipelineStep  label="Model Inference — Autoencoder + GaussianRBM · Soft Voting · Threshold: 0.30" />
            
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────────────── */}
        {result && !uploading && <ResultCard result={result} />}
      </div>
    </main>
  );
}

function PipelineStep({ icon, label, sub, active }) {
  return (
    <div className={`${styles.step} ${active ? styles.stepActive : ""}`}>
      <span>{icon}</span>
      <div>
        <div>{label}</div>
        {sub && <div style={{fontSize:"0.75rem",opacity:.7,marginTop:"2px"}}>{sub}</div>}
      </div>
    </div>
  );
}
