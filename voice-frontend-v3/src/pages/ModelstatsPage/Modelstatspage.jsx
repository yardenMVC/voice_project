// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { useAsync } from "../hooks/useAsync";
// import styles from "./StatsPage.module.css";
// import ErrorBanner from "../components/ErrorBanner";
// import LoadingState from "../components/LoadingState";
//
// const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
//
// async function fetchModelInfo() {
//     try {
//         const [featRes, statsRes] = await Promise.all([
//             fetch(`${BASE}/api/features`),
//             fetch(`${BASE}/api/stats`),
//         ]);
//         const features = featRes.ok ? await featRes.json() : [];
//         const stats    = statsRes.ok ? await statsRes.json() : {};
//         return {
//             total:       features.length || 52,
//             threshold:   stats.threshold ?? "—",
//             aeModelPath: stats.aeModelPath ?? "—",
//             rbmModelPath: stats.rbmModelPath ?? "—",
//         };
//     } catch {
//         return { total: 52, threshold: "—", aeModelPath: "—", rbmModelPath: "—" };
//     }
// }
//
// export default function ModelStatsPage() {
//     const [modelInfo, setModelInfo] = useState(null);
//     const { loading, error, run }   = useAsync();
//
//     useEffect(() => {
//         run(() => fetchModelInfo())
//             .then(setModelInfo)
//             .catch(() => {});
//     }, [run]);
//
//     return (
//         <main className={styles.page}>
//             <div className={styles.container}>
//
//                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "1rem" }}>
//                     <div>
//                         <h1 className={styles.pageTitle}>System Statistics</h1>
//                         <p className={styles.lead}>Model configuration and live analysis activity.</p>
//                     </div>
//                     <Link to="/stats/live" style={{
//                         background: "linear-gradient(135deg, #7c3aed, #0891b2)",
//                         borderRadius: "8px",
//                         color: "#fff",
//                         fontSize: "0.85rem",
//                         fontWeight: 600,
//                         padding: "0.55rem 1.1rem",
//                         textDecoration: "none",
//                         whiteSpace: "nowrap",
//                     }}>
//                         Live Stats →
//                     </Link>
//                 </div>
//
//                 <ErrorBanner message={error} />
//                 {loading && <LoadingState message="Loading model info…" />}
//
//                 {!loading && (
//                     <section className={styles.section}>
//                         <h2 className={styles.sectionTitle}>Model Configuration</h2>
//                         <div className={styles.metricsGrid}>
//
//                             <div className={styles.metricCard}>
//                                 <div className={styles.metricValue} style={{ color: "#a78bfa" }}>
//                                     {modelInfo?.total ?? 52}
//                                 </div>
//                                 <div className={styles.metricLabel}>Features Extracted</div>
//                                 <div className={styles.metricSub}>Per audio file</div>
//                             </div>
//
//                             <div className={styles.metricCard}>
//                                 <div className={styles.metricValue} style={{ color: "#06b6d4" }}>30</div>
//                                 <div className={styles.metricLabel}>AE Active Features</div>
//                                 <div className={styles.metricSub}>Delta dynamics + Energy + MFCC 1/5/10</div>
//                             </div>
//
//                             <div className={styles.metricCard}>
//                                 <div className={styles.metricValue} style={{ color: "#f59e0b" }}>19</div>
//                                 <div className={styles.metricLabel}>RBM Active Features</div>
//                                 <div className={styles.metricSub}>MFCCs + physiological + Deltas</div>
//                             </div>
//
//                             <div className={styles.metricCard}>
//                                 <div className={styles.metricValue} style={{ color: "#4ade80" }}>2</div>
//                                 <div className={styles.metricLabel}>Models in Ensemble</div>
//                                 <div className={styles.metricSub}>Autoencoder + GaussianRBM</div>
//                             </div>
//
//                             <div className={styles.metricCard}>
//                                 <div className={styles.metricValue} style={{ color: "#f87171" }}>
//                                     {modelInfo?.threshold ?? "—"}
//                                 </div>
//                                 <div className={styles.metricLabel}>Decision Threshold</div>
//                                 <div className={styles.metricSub}>Calibrated by Optuna per model version</div>
//                             </div>
//
//                             <div className={styles.metricCard}>
//                                 <div className={styles.metricValue} style={{ color: "#a78bfa" }}>KS</div>
//                                 <div className={styles.metricLabel}>Feature Selection</div>
//                                 <div className={styles.metricSub}>Kolmogorov-Smirnov statistic</div>
//                             </div>
//
//
//
//                         </div>
//                     </section>
//                 )}
//             </div>
//         </main>
//     );
// }
//
//



// 1. External Libraries
import { useEffect, useState, useMemo } from "react";
import { Search, Cpu, Activity, BarChart3, Database, Info, XCircle } from "lucide-react";

// 2. Internal Hooks & API
import { useAsync } from "../../hooks/useAsync";
import * as analysisApi from "../../api/analysisApi";

// 3. Styles & Components
import styles from "./Modelstatspage.module.css";
import LoadingState from "../../components/Loadingstate";
import ErrorBanner from "../../components/ErrorBanner";

/**
 * FeatureDetail Component
 * Isolated component to display selected feature documentation.
 */
const FeatureDetail = ({ feature }) => {
    if (!feature) {
        return (
            <div className={styles.emptyState}>
                Select a feature from the grid or search to see its definition
            </div>
        );
    }

    return (
        <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
                <Info size={24} color="#06b6d4" />
                <h2>{feature.featureName}</h2>
            </div>
            <p className={styles.resultText}>
                {feature.description || "Technical documentation for this feature is currently being processed."}
            </p>
        </div>
    );
};

export default function Modelstatspage() {
    // Initializing hook with loading = true
    const { loading, error, run } = useAsync(true);

    const [stats, setStats] = useState(null);
    const [definitions, setDefinitions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);

    // Initial Data Load using 'run' from your hook
    useEffect(() => {
        run(async () => {
            const [defsData, statsData] = await Promise.all([
                analysisApi.getFeatureDefinitions(),
                analysisApi.getSystemStats()
            ]);
            setDefinitions(defsData || []);
            setStats(statsData);
        });
    }, [run]);

    // Memoized Search Suggestions
    const suggestions = useMemo(() => {
        if (!searchTerm) return [];
        return definitions
            .filter(d => d.featureName.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 6);
    }, [searchTerm, definitions]);

    const handleSelect = (feature) => {
        setSelectedFeature(feature);
        setSearchTerm(feature.featureName);
        setShowSuggestions(false);
    };

    if (loading) return <LoadingState message="Connecting to Analytics Engine..." />;
    if (error) return <ErrorBanner message={error} />;

    return (
        <main className={styles.page}>
            <div className={styles.container}>

                {/* --- 1. System Performance Metrics --- */}
                <section className={styles.metricsHeader}>
                    <div className={styles.metricBox}>
                        <div className={styles.metricIcon}><Cpu size={20} /></div>
                        <div className={styles.metricContent}>
                            <span className={styles.mValue}>{stats?.activeModelsCount || 0}</span>
                            <span className={styles.mLabel}>Active Models</span>
                        </div>
                    </div>

                    <div className={styles.metricBox}>
                        <div className={styles.metricIcon}><Activity size={20} /></div>
                        <div className={styles.metricContent}>
                            <span className={styles.mValue}>{stats?.activeFeaturesCount || 0}</span>
                            <span className={styles.mLabel}>Active Features</span>
                        </div>
                    </div>

                    <div className={styles.metricBox}>
                        <div className={styles.metricIcon}><Database size={20} /></div>
                        <div className={styles.metricContent}>
                            <span className={styles.mValue}>{definitions.length}</span>
                            <span className={styles.mLabel}>Total Definitions</span>
                        </div>
                    </div>

                    <div className={styles.metricBox}>
                        <div className={styles.metricIcon}><BarChart3 size={20} /></div>
                        <div className={styles.metricContent}>
                            <span className={styles.mValue}>{stats?.threshold?.toFixed(2) || "0.00"}</span>
                            <span className={styles.mLabel}>System Threshold</span>
                        </div>
                    </div>
                </section>

                {/* --- 2. Feature Search & Detail Section --- */}
                <section className={styles.engineSection}>
                    <div className={styles.searchContainer}>
                        <div className={styles.inputWrapper}>
                            <Search className={styles.searchIcon} size={20} />
                            <input
                                type="text"
                                className={styles.mainInput}
                                placeholder="Search technical definitions (e.g., MFCC, Jitter)..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowSuggestions(true);
                                }}
                            />
                            {searchTerm && (
                                <XCircle
                                    className={styles.clearIcon}
                                    size={18}
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedFeature(null);
                                    }}
                                />
                            )}
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className={styles.dropdown}>
                                {suggestions.map(s => (
                                    <div
                                        key={s.featureName}
                                        className={styles.suggestionItem}
                                        onClick={() => handleSelect(s)}
                                    >
                                        {s.featureName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.displayArea}>
                        <FeatureDetail feature={selectedFeature} />
                    </div>
                </section>

                {/* --- 3. Component Library Grid --- */}
                <section className={styles.listSection}>
                    <h3 className={styles.listTitle}>Audio Analysis Components</h3>
                    <div className={styles.chipGrid}>
                        {definitions.map(d => (
                            <button
                                key={d.featureName}
                                className={`${styles.featureChip} ${
                                    selectedFeature?.featureName === d.featureName ? styles.activeChip : ""
                                }`}
                                onClick={() => handleSelect(d)}
                            >
                                {d.featureName}
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}