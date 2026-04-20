/**
 * StatsPage.jsx — System-wide statistics.
 *
 * Changes from previous version:
 * - Removed "Daily Activity" chart (recentActivity not in backend)
 * - Removed "Uploads by File Type" (topFileTypes not in backend)
 * - Added avgProcessingTimeMs card (from processingTimeMs field in Analysis)
 * - Remaining stats: totalAnalyses, fakeCount, realCount, avgConfidence, avgProcessingTimeMs
 * - Mock data updated to match real backend fields
 * - Fetches from GET /api/stats (needs to be added to backend)
 */

import { useEffect, useState } from "react";
import styles from "./StatsPage.module.css";

const MOCK = import.meta.env.VITE_MOCK === "true";

const MOCK_STATS = {
  totalAnalyses:       1847,
  fakeCount:           1103,
  realCount:           744,
  avgConfidence:       0.812,
  avgProcessingTimeMs: 1240,
};

async function fetchStats() {
  if (MOCK) return MOCK_STATS;
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

export default function StatsPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchStats()
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, []);

  const fakeRate = stats
      ? ((stats.fakeCount / stats.totalAnalyses) * 100).toFixed(1)
      : "—";

  return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>System Statistics</h1>
          <p className={styles.lead}>Aggregate data across all analyses. Updated in real time.</p>

          {error && <div className={styles.error}>⚠️ {error}</div>}

          {loading ? (
              <div className={styles.loading}>Loading statistics…</div>
          ) : stats && (
              <>
                {/* ── Top metrics ──────────────────────────────────────────── */}
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
                    <div className={styles.metricLabel}>Avg. Confidence</div>
                    <div className={styles.metricSub}>Ensemble score distance from threshold</div>
                  </div>

                  {stats.avgProcessingTimeMs != null && (
                      <div className={styles.metricCard}>
                        <div className={styles.metricValue}>
                          {stats.avgProcessingTimeMs.toLocaleString()} ms
                        </div>
                        <div className={styles.metricLabel}>Avg. Processing Time</div>
                        <div className={styles.metricSub}>
                          Feature extraction + model inference
                        </div>
                      </div>
                  )}
                </div>

                {/* ── FAKE / REAL ratio bar ─────────────────────────────────── */}
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
              </>
          )}
        </div>
      </main>
  );
}