/**
 * StatsPage.jsx — System-wide statistics.
 * Fetches live data from /api/stats and /api/features.
 */

import { useEffect, useState } from "react";
import styles from "./StatsPage.module.css";
import ErrorBanner from "../components/ErrorBanner";
import LoadingState from "../components/LoadingState";

const MOCK = import.meta.env.VITE_MOCK === "true";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const MOCK_STATS = {
  totalAnalyses:       1847,
  fakeCount:           1103,
  realCount:           744,
  avgConfidence:       0.812,
  avgProcessingTimeMs: 1240,
};

const MOCK_FEATURES = { aeCount: 30, rbmCount: 19, total: 52, threshold: 0.30 };

async function fetchStats() {
  if (MOCK) return MOCK_STATS;
  const res = await fetch(`${BASE}/api/stats`);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function fetchModelInfo() {
  if (MOCK) return MOCK_FEATURES;
  try {
    // Get active feature counts from feature_definitions
    const res = await fetch(`${BASE}/api/features`);
    if (!res.ok) throw null;
    const features = await res.json();
    return {
      total:    features.length,
    };
  } catch {
    return null;
  }
}

export default function StatsPage() {
  const [stats,      setStats]      = useState(null);
  const [modelInfo,  setModelInfo]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    Promise.all([fetchStats(), fetchModelInfo()])
        .then(([s, m]) => { setStats(s); setModelInfo(m); })
        .catch((e) => setError(e?.message ?? "Failed to load"))
        .finally(() => setLoading(false));
  }, []);

  const fakeRate = stats && stats.totalAnalyses > 0
      ? ((stats.fakeCount / stats.totalAnalyses) * 100).toFixed(1)
      : "0.0";

  return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>System Statistics</h1>
          <p className={styles.lead}>Aggregate data across all analyses. Updated in real time.</p>

          <ErrorBanner message={error} />
          {loading && <LoadingState message="Loading statistics…" />}

          {!loading && stats && (
              <>
                {/* ── Analysis metrics ─────────────────────────────────────────── */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Analysis Activity</h2>
                  <div className={styles.metricsGrid}>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>
                        {stats.totalAnalyses.toLocaleString()}
                      </div>
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
                          <div className={styles.metricSub}>
                            Feature extraction + model inference
                          </div>
                        </div>
                    )}

                  </div>
                </section>

                {/* ── FAKE / REAL ratio ─────────────────────────────────────────── */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Detection Breakdown</h2>
                  <div className={styles.ratioBar}>
                    <div
                        className={styles.ratioFake}
                        style={{ width: `${fakeRate}%` }}
                        title={`FAKE: ${fakeRate}%`}
                    />
                    <div
                        className={styles.ratioReal}
                        style={{ width: `${100 - parseFloat(fakeRate)}%` }}
                        title={`REAL: ${(100 - parseFloat(fakeRate)).toFixed(1)}%`}
                    />
                  </div>
                  <div className={styles.ratioLabels}>
                    <span style={{ color: "#f87171" }}>🚨 FAKE — {fakeRate}%</span>
                    <span style={{ color: "#4ade80" }}>
                  ✅ REAL — {(100 - parseFloat(fakeRate)).toFixed(1)}%
                </span>
                  </div>
                </section>

                {/* ── Model configuration ───────────────────────────────────────── */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Model Configuration</h2>
                  <div className={styles.metricsGrid}>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue} style={{ color: "#a78bfa" }}>
                        {modelInfo?.total ?? 52}
                      </div>
                      <div className={styles.metricLabel}>Features Extracted</div>
                      <div className={styles.metricSub}>Per audio file</div>
                    </div>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue} style={{ color: "#06b6d4" }}>
                        30
                      </div>
                      <div className={styles.metricLabel}>AE Active Features</div>
                      <div className={styles.metricSub}>Delta dynamics + Energy + MFCC 1/5/10</div>
                    </div>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue} style={{ color: "#f59e0b" }}>
                        19
                      </div>
                      <div className={styles.metricLabel}>RBM Active Features</div>
                      <div className={styles.metricSub}>MFCCs + physiological + Deltas</div>
                    </div>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue} style={{ color: "#4ade80" }}>
                        2
                      </div>
                      <div className={styles.metricLabel}>Models in Ensemble</div>
                      <div className={styles.metricSub}>Autoencoder + GaussianRBM</div>
                    </div>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue} style={{ color: "#f87171" }}>
                        0.30
                      </div>
                      <div className={styles.metricLabel}>Decision Threshold</div>
                      <div className={styles.metricSub}>Calibrated for high sensitivity</div>
                    </div>

                    <div className={styles.metricCard}>
                      <div className={styles.metricValue} style={{ color: "#a78bfa" }}>
                        KS
                      </div>
                      <div className={styles.metricLabel}>Feature Selection</div>
                      <div className={styles.metricSub}>Kolmogorov-Smirnov statistic</div>
                    </div>

                  </div>
                </section>
              </>
          )}
        </div>
      </main>
  );
}