
// LiveStatsPage.jsx — /stats/live
// Analysis activity — refreshes every 5 seconds


import { useEffect, useState, useCallback } from "react";
import { useAsync } from "../../hooks/useAsync.js";
import { AlertTriangle, CheckCircle } from "lucide-react";
import styles from "./StatsPage.module.css";
import ErrorBanner from "../../components/ErrorBanner.jsx";
import LoadingState from "../../components/LoadingState.jsx";

const BASE = import.meta.env.VITE_API_URL ;
const POLL_INTERVAL = 5000;

async function fetchStats() {
    const res = await fetch(`${BASE}/api/stats`);
    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
}

export default function LiveStatsPage() {
    const [stats, setStats] = useState(null);
    const { loading, error, setError, run } = useAsync();

    const poll = useCallback(() => {
        fetchStats()
            .then(setStats)
            .catch((e) => setError(e?.message ?? "Failed to load"));
    }, [setError]);

    useEffect(() => {
        run(() => fetchStats()).then(setStats).catch(() => {});
        const interval = setInterval(poll, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [run, poll]);

    const fakeRate = stats && stats.totalAnalyses > 0
        ? ((stats.fakeCount / stats.totalAnalyses) * 100).toFixed(1)
        : "0.0";

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Live Statistics</h1>
                <p className={styles.lead}>
                    Analysis activity — refreshes automatically every {POLL_INTERVAL / 1000} seconds.
                </p>

                <ErrorBanner message={error} />
                {loading && <LoadingState message="Loading statistics…" />}

                {!loading && stats && (
                    <>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Analysis Activity</h2>
                            <div className={styles.metricsGrid}>

                                <div className={styles.metricCard}>
                                    <div className={styles.metricValue}>{stats.totalAnalyses.toLocaleString()}</div>
                                    <div className={styles.metricLabel}>Total Analyses</div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.fakeCard}`}>
                                    <div className={styles.metricValue} style={{ color: "#f87171" }}>
                                        {stats.fakeCount.toLocaleString()}
                                    </div>
                                    <div className={styles.metricLabel}>Flagged as FAKE</div>
                                    <div className={styles.metricSub}>{fakeRate}% of all analyses</div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.realCard}`}>
                                    <div className={styles.metricValue} style={{ color: "#4ade80" }}>
                                        {stats.realCount.toLocaleString()}
                                    </div>
                                    <div className={styles.metricLabel}>Confirmed REAL</div>
                                    <div className={styles.metricSub}>
                                        {(100 - parseFloat(fakeRate)).toFixed(1)}% of all analyses
                                    </div>
                                </div>

                                <div className={styles.metricCard}>
                                    <div className={styles.metricValue}>
                                        {(stats.avgConfidence * 100).toFixed(1)}%
                                    </div>
                                    <div className={styles.metricLabel}>Avg. Ensemble Score</div>
                                    <div className={styles.metricSub}>Across all completed analyses</div>
                                </div>

                                {stats.avgProcessingTimeMs != null && (
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            {Math.round(stats.avgProcessingTimeMs).toLocaleString()} ms
                                        </div>
                                        <div className={styles.metricLabel}>Avg. Processing Time</div>
                                        <div className={styles.metricSub}>Feature extraction + model inference</div>
                                    </div>
                                )}

                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Detection Breakdown</h2>
                            <div className={styles.ratioBar}>
                                <div className={styles.ratioFake}
                                     style={{ width: `${fakeRate}%` }}
                                     title={`FAKE: ${fakeRate}%`} />
                                <div className={styles.ratioReal}
                                     style={{ width: `${100 - parseFloat(fakeRate)}%` }}
                                     title={`REAL: ${(100 - parseFloat(fakeRate)).toFixed(1)}%`} />
                            </div>
                            <div className={styles.ratioLabels}>
                                <span style={{ color: "#f87171" }}><AlertTriangle size={16} className="icon" /> FAKE — {fakeRate}%</span>
                                <span style={{ color: "#4ade80" }}>
                  <CheckCircle size={16} className="icon" /> REAL — {(100 - parseFloat(fakeRate)).toFixed(1)}%
                </span>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
