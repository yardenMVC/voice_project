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
            total:       features.length || 52,
            threshold:   stats.threshold ?? "—",
            aeModelPath: stats.aeModelPath ?? "—",
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

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className={styles.pageTitle}>System Statistics</h1>
                        <p className={styles.lead}>Model configuration and live analysis activity.</p>
                    </div>
                    <Link to="/stats/live" style={{
                        background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        padding: "0.55rem 1.1rem",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                    }}>
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
                                <div className={styles.metricValue} style={{ color: "#a78bfa" }}>
                                    {modelInfo?.total ?? 52}
                                </div>
                                <div className={styles.metricLabel}>Features Extracted</div>
                                <div className={styles.metricSub}>Per audio file</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricValue} style={{ color: "#06b6d4" }}>30</div>
                                <div className={styles.metricLabel}>AE Active Features</div>
                                <div className={styles.metricSub}>Delta dynamics + Energy + MFCC 1/5/10</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricValue} style={{ color: "#f59e0b" }}>19</div>
                                <div className={styles.metricLabel}>RBM Active Features</div>
                                <div className={styles.metricSub}>MFCCs + physiological + Deltas</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricValue} style={{ color: "#4ade80" }}>2</div>
                                <div className={styles.metricLabel}>Models in Ensemble</div>
                                <div className={styles.metricSub}>Autoencoder + GaussianRBM</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricValue} style={{ color: "#f87171" }}>
                                    {modelInfo?.threshold ?? "—"}
                                </div>
                                <div className={styles.metricLabel}>Decision Threshold</div>
                                <div className={styles.metricSub}>Calibrated by Optuna per model version</div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.metricValue} style={{ color: "#a78bfa" }}>KS</div>
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