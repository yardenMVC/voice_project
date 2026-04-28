/**
 * HistoryPage.jsx — Past analysis results
 */

import { useEffect, useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import ResultCard from "../components/ResultCard";
import styles from "./HistoryPage.module.css";

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

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function HistoryPage() {
  const { history, error, loadHistory, deleteEntry } = useAnalysis();
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadHistory().finally(() => setLoading(false));
  }, [loadHistory]);

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  if (loading) return <LoadingState />;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Analysis History</h1>

        {error && (
          <div className={styles.errorBanner}>
            <WarningIcon /> {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><MicIcon /></span>
            <p>No analyses yet. Upload an audio file to get started.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {history.map((item) => {
              const verdict    = item.finalPrediction ?? item.verdict;
              const filename   = item.originalFilename ?? item.filename;
              const analyzedAt = item.analyzedAt ?? item.uploadedAt;
              const ensemble   = item.ensembleScore ?? item.confidence ?? 0;
              const ae         = item.autoencoderScore ?? item.autoencoderError ?? 0;
              const rbm        = item.rbmScore ?? item.rbmError ?? 0;
              const procTime   = item.processingTimeMs;

              return (
                <div key={item.analysisId ?? item.id} className={styles.row}>
                  <div
                    className={styles.summary}
                    onClick={() => toggleExpand(item.analysisId ?? item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggleExpand(item.analysisId ?? item.id)}
                  >
                    <div className={styles.rowLeft}>
                      <span className={`${styles.verdict} ${verdict === "REAL" ? styles.real : styles.fake}`}>
                        {verdict === "REAL" ? <><CheckIcon /> REAL</> : <><XIcon /> FAKE</>}
                      </span>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{filename}</span>
                        <span className={styles.timestamp}>
                          {analyzedAt ? new Date(analyzedAt).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.rowRight}>
                      <div className={styles.scores}>
                        <Metric label="Score" value={ensemble.toFixed(4)} mono />
                        <Metric label="AE"    value={ae.toFixed(5)} mono />
                        <Metric label="RBM"   value={rbm.toFixed(5)} mono />
                        {procTime && <Metric label="Time" value={`${procTime}ms`} />}
                      </div>

                      <div className={styles.actions}>
                        <button
                          className={styles.expandBtn}
                          onClick={(e) => { e.stopPropagation(); toggleExpand(item.analysisId ?? item.id); }}
                          title={expandedId === (item.analysisId ?? item.id) ? "Collapse" : "Expand details"}
                        >
                          {expandedId === (item.analysisId ?? item.id) ? "close" : "view"}
                        </button>

                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this analysis?")) {
                              deleteEntry(item.analysisId ?? item.id);
                            }
                          }}
                          title="Delete this analysis"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedId === (item.analysisId ?? item.id) && (
                    <div className={styles.expanded}>
                      <ResultCard result={item} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, mono }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue} ${mono ? styles.mono : ""}`}>{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loading}>Loading history…</div>
      </div>
    </main>
  );
}
