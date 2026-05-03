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
import { useAnalysis } from "../../hooks/useAnalysis.js";
import { useAsync } from "../../hooks/useAsync.js";
import { Mic, CheckCircle, AlertTriangle } from "lucide-react";
import ResultCard from "../../components/ResultCard.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";
import styles from "./HistoryPage.module.css";

export default function HistoryPage() {
    const { history, error, loadHistory, deleteEntry } = useAnalysis();
    const { loading, run } = useAsync();
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        run(() => loadHistory()).catch(() => {});
    }, [loadHistory, run]);

    const toggleExpand = (id) =>
        setExpandedId((prev) => (prev === id ? null : id));

    if (loading) return (
        <main className={styles.page}>
            <div className={styles.container}>
                <LoadingState message="Loading history…" />
            </div>
        </main>
    );

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.heading}>Analysis History</h1>

                <ErrorBanner message={error} />

                {history.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}><Mic size={16} className="icon" /></span>
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
                        {verdict === "REAL" ? <><CheckCircle size={16} className="icon" /> REAL</> : <><AlertTriangle size={16} className="icon" /> FAKE</>}
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
                                                    {expandedId === (item.analysisId ?? item.id) ? "Close" : "view"}
                                                </button>

                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const confirmed = window.confirm("Are you sure you want to delete this analysis?");
                                                        if (confirmed) {
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
