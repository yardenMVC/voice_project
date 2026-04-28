/**
 * UploadPage.jsx — Core product page
 */

import { useState, useRef } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import ResultCard from "../components/ResultCard";
import styles from "./UploadPage.module.css";

const ACCEPT = ".wav,.mp3";

function FolderIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" x2="12" y1="9" y2="13"/>
      <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
  );
}

function FileAudioIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 22h.5a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v3"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M2 17v-3a4 4 0 0 1 8 0v3"/>
      <rect width="4" height="6" x="8" y="17" rx="1"/>
      <rect width="4" height="6" x="-2" y="17" rx="1"/>
    </svg>
  );
}

export default function UploadPage() {
  const { uploading, result, error, upload, clearError } = useAnalysis();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

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

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await upload(selectedFile);
    } catch {
      // error stored in useAnalysis
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
          className={`${styles.dropzone} ${dragOver ? styles.dragOver : ""} ${selectedFile ? styles.hasFile : ""}`}
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
              <span className={styles.fileIcon}><FileAudioIcon /></span>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>
                {(selectedFile.size / 1e6).toFixed(2)} MB
              </span>
              <button
                className={styles.clearBtn}
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); clearError(); }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className={styles.dropHint}>
              <span className={styles.dropIcon}><FolderIcon /></span>
              <p>Drag &amp; drop an audio file here</p>
              <p className={styles.dropSub}>
                or <span className={styles.browse}>browse</span> — WAV, MP3 (max 50 MB)
                · min 0.5 s · max 30 s
              </p>
            </div>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className={styles.errorBanner}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <WarningIcon /> {error}
            </span>
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
            <><span className={styles.spinner} /> Analyzing…</>
          ) : (
            "Analyze Voice"
          )}
        </button>

        {uploading && (
          <div className={styles.pipeline}>
            <PipelineStep
              label="Feature Extraction — 52 acoustic features computed"
              sub="MFCC × 13, Delta × 13, Delta² × 13, Jitter, Shimmer, SNR, Energy…"
              active
            />
            <PipelineStep
              label="Model Inference — Autoencoder + GaussianRBM · Soft Voting · Threshold: 0.30"
            />
          </div>
        )}

        {result && !uploading && <ResultCard result={result} />}
      </div>
    </main>
  );
}

function PipelineStep({ label, sub, active }) {
  return (
    <div className={`${styles.step} ${active ? styles.stepActive : ""}`}>
      <div>
        <div>{label}</div>
        {sub && <div className={styles.stepSub}>{sub}</div>}
      </div>
    </div>
  );
}
