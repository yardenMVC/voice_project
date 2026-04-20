/**
 * HistoryPage.jsx — Past analysis results
 *
 * Changes from previous version:
 * - Field names aligned with AnalysisResponse: finalPrediction, autoencoderScore,
 *   rbmScore, processingTimeMs, analyzedAt, originalFilename
 * - Delete button connected (was missing)
 * - Shows processingTimeMs per entry
 */

import { useEffect, useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import ResultCard from "../components/ResultCard";
import styles from "./HistoryPage.module.css";

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

                {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

                {history.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🎙️</span>
                        <p>No analyses yet. Upload an audio file to get started.</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {history.map((item) => {
                            // Support both old and new field names
                            const verdict    = item.finalPrediction ?? item.verdict;
                            const filename   = item.originalFilename ?? item.filename;
                            const analyzedAt = item.analyzedAt ?? item.uploadedAt;
                            const ensemble   = item.ensembleScore ?? item.confidence ?? 0;
                            const ae         = item.autoencoderScore ?? item.autoencoderError ?? 0;
                            const rbm        = item.rbmScore ?? item.rbmError ?? 0;
                            const procTime   = item.processingTimeMs;

                            return (
                                <div key={item.analysisId ?? item.id} className={styles.row}>
                                    {/* ── Summary row ──────────────────────────────────────── */}
                                    <div
                                        className={styles.summary}
                                        onClick={() => toggleExpand(item.analysisId ?? item.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && toggleExpand(item.analysisId ?? item.id)}
                                    >
                                        <div className={styles.rowLeft}>
                      <span className={`${styles.verdict} ${verdict === "REAL" ? styles.real : styles.fake}`}>
                        {verdict === "REAL" ? "✅ REAL" : "🚨 FAKE"}
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
                                                <Metric label="Score"    value={ensemble.toFixed(4)} mono />
                                                <Metric label="AE"       value={ae.toFixed(5)} mono />
                                                <Metric label="RBM"      value={rbm.toFixed(5)} mono />
                                                {procTime && <Metric label="Time" value={`${procTime}ms`} />}
                                            </div>

                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.expandBtn}
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(item.analysisId ?? item.id); }}
                                                    title={expandedId === (item.analysisId ?? item.id) ? "Collapse" : "Expand details"}
                                                >
                                                    {expandedId === (item.analysisId ?? item.id) ? "▲" : "▼"}
                                                </button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={(e) => { e.stopPropagation(); deleteEntry(item.analysisId ?? item.id); }}
                                                    title="Delete this analysis"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Expanded full result ──────────────────────────── */}
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