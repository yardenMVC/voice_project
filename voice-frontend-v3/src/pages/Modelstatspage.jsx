import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./StatsPage.module.css";
import ErrorBanner from "../components/ErrorBanner";
import LoadingState from "../components/LoadingState";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function fetchModelInfo() {
  try {
    const [featRes, statsRes] = await Promise.all([
      fetch(`${BASE}/api/features`),
      fetch(`${BASE}/api/stats`),
    ]);
    const features = featRes.ok ? await featRes.json() : [];
    const stats    = statsRes.ok ? await statsRes.json() : {};
    return {
      total:        features.length || 52,
      threshold:    stats.threshold ?? "—",
      aeModelPath:  stats.aeModelPath ?? "—",
      rbmModelPath: stats.rbmModelPath ?? "—",
    };
  } catch {
    return { total: 52, threshold: "—", aeModelPath: "—", rbmModelPath: "—" };
  }
}

export default function ModelStatsPage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>System Statistics</h1>
            <p className={styles.lead}>Model configuration and live analysis activity.</p>
          </div>
          <Link to="/stats/live" className={styles.liveLink}>
            Live Stats →
          </Link>
        </div>

        <ErrorBanner message={error} />
        {loading && <LoadingState message="Loading model info…" />}

        {!loading && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Model Configuration</h2>
            <div className={styles.metricsGrid}>

              <div className={styles.metricCard}>
                <div className={styles.metricValue}>
                  {modelInfo?.total ?? 52}
                </div>
                <div className={styles.metricLabel}>Features Extracted</div>
                <div className={styles.metricSub}>Per audio file</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricValue}>30</div>
                <div className={styles.metricLabel}>AE Active Features</div>
                <div className={styles.metricSub}>Delta dynamics + Energy + MFCC 1/5/10</div>
              </div>

              <div className={styles.metricCard}>
                <div className={`${styles.metricValue} ${styles.metricValueAmber}`}>19</div>
                <div className={styles.metricLabel}>RBM Active Features</div>
                <div className={styles.metricSub}>MFCCs + physiological + Deltas</div>
              </div>

              <div className={styles.metricCard}>
                <div className={`${styles.metricValue} ${styles.metricValueGreen}`}>2</div>
                <div className={styles.metricLabel}>Models in Ensemble</div>
                <div className={styles.metricSub}>Autoencoder + GaussianRBM</div>
              </div>

              <div className={styles.metricCard}>
                <div className={`${styles.metricValue} ${styles.metricValueRed}`}>
                  {modelInfo?.threshold ?? "—"}
                </div>
                <div className={styles.metricLabel}>Decision Threshold</div>
                <div className={styles.metricSub}>Calibrated by Optuna per model version</div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricValue}>KS</div>
                <div className={styles.metricLabel}>Feature Selection</div>
                <div className={styles.metricSub}>Kolmogorov-Smirnov statistic</div>
              </div>

            </div>
          </section>
        )}
      </div>
    </main>
  );
}
