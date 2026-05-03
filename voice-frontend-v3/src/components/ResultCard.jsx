

import { useState } from "react";
import { File, Clock, Zap } from "lucide-react";
import styles from "./ResultCard.module.css";

const DEFAULT_THRESHOLD = 0.30;

function confidenceLevel(score, verdict, threshold) {
    const dist = verdict === "FAKE" ? score - threshold : threshold - score;
    if (dist < 0.15) return { label: "Low confidence",  color: "#f59e0b" };
    if (dist < 0.35) return { label: "Medium confidence", color: "#06b6d4" };
    return              { label: "High confidence",    color: "#4ade80" };
}

// Model Scores

function ModelScoreSection({ ae, rbm, ensemble, threshold }) {
    const thPct = threshold * 100;
    const ensembleOver = ensemble >= threshold;

    return (
        <div className={styles.chartWrap}>

            {/* AE  */}
            <div className={styles.modelRow}>
                <div className={styles.modelMeta}>
                    <span className={styles.modelLabel}>Autoencoder</span>
                </div>
                <span className={styles.scoreNum} style={{ color: "#94a3b8" }}>
                    {ae.toFixed(6)}
                </span>
            </div>

            {/* RBM */}
            <div className={styles.modelRow}>
                <div className={styles.modelMeta}>
                    <span className={styles.modelLabel}>GaussianRBM</span>
                </div>
                <span className={styles.scoreNum} style={{ color: "#94a3b8" }}>
                    {rbm.toFixed(6)}
                </span>
            </div>

            {/* Ensemble — bar (0-1 scale) */}
            <div className={styles.modelRow}>
                <div className={styles.modelMeta}>
                    <span className={`${styles.modelLabel} ${styles.boldLabel}`}>Ensemble</span>
                </div>
                <div className={styles.barTrack}>
                    <div className={styles.thresholdLine} style={{ left: `${thPct}%` }} title={`Threshold: ${threshold}`} />
                    <div
                        className={`${styles.barFill} ${ensembleOver ? styles.barFake : styles.barReal}`}
                        style={{ width: `${Math.min(ensemble * 100, 100)}%` }}
                    />
                </div>
                <span className={`${styles.scoreNum} ${ensembleOver ? styles.scoreOver : styles.scoreUnder}`}>
                    {ensemble.toFixed(4)}
                </span>
            </div>

            <div className={styles.thresholdLegend}>
                <span className={styles.thresholdDash} /> Threshold: {threshold}
            </div>
        </div>
    );
}

// ── Feature Chart ──────────────────────────────────────────────────────────

function FeatureChart({ featuresVector, activeFeatures }) {
    const [expanded, setExpanded] = useState(false);

    if (!featuresVector || Object.keys(featuresVector).length === 0) {
        return <p style={{ color: "#475569", fontSize: "0.8rem" }}>Feature data not available.</p>;
    }

    // Build a lookup: featureName → { activeIn: ["AE", "RBM"] }
    const activeMap = {};
    if (activeFeatures?.features?.length > 0) {
        for (const f of activeFeatures.features) {
            activeMap[f.name] = f.activeIn ?? [];
        }
    }

    // Build full list from featuresVector keys, sorted by name
    const allFeatures = Object.entries(featuresVector)
        .map(([name, val]) => ({
            name,
            val,
            activeIn: activeMap[name] ?? [],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const PREVIEW = 10;
    const displayed = expanded ? allFeatures : allFeatures.slice(0, PREVIEW);

    const modelTag = (activeIn) => {
        if (activeIn.includes("AE") && activeIn.includes("RBM")) return { label: "AE + RBM", color: "#8b5cf6" };
        if (activeIn.includes("AE"))  return { label: "AE",  color: "#06b6d4" };
        if (activeIn.includes("RBM")) return { label: "RBM", color: "#f59e0b" };
        return null; // not active in any model
    };

    const aeCount  = activeFeatures?.aeCount  ?? Object.values(activeMap).filter(a => a.includes("AE")).length;
    const rbmCount = activeFeatures?.rbmCount ?? Object.values(activeMap).filter(a => a.includes("RBM")).length;
    const total    = Object.keys(featuresVector).length;

    return (
        <div>
            {/* Header */}
            <div className={styles.featToggle}>
                <span className={styles.featCount}>
                    <span className={styles.activeCount}>{total} extracted</span>
                    {aeCount > 0 && (
                        <span style={{ color: "#475569", marginLeft: "8px" }}>
                            · {aeCount} in AE · {rbmCount} in RBM
                        </span>
                    )}
                </span>
                <button className={styles.toggleBtn} onClick={() => setExpanded(v => !v)}>
                    {expanded ? "Show less" : `Expand all ${total} features`}
                </button>
            </div>

            {/* Feature rows */}
            <div className={styles.featList}>
                {displayed.map(({ name, val, activeIn }) => {
                    const tag = modelTag(activeIn);
                    const numVal = typeof val === "number" ? val : Number(val);

                    return (
                        <div key={name} className={styles.featRow}>
                            <div className={styles.featLabel}>
                                {tag ? (
                                    <span
                                        className={styles.featStatus}
                                        style={{
                                            background: tag.color + "22",
                                            color: tag.color,
                                            padding: "1px 6px",
                                            borderRadius: "4px",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {tag.label}
                                    </span>
                                ) : (
                                    <span style={{
                                        padding: "1px 6px",
                                        fontSize: "0.7rem",
                                        color: "#334155",
                                        whiteSpace: "nowrap",
                                    }}>
                                        —
                                    </span>
                                )}
                                <span className={styles.featName}>{name}</span>
                            </div>
                            <span className={styles.featVal}>
                                {isNaN(numVal) ? "—" : numVal.toFixed(6)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {!expanded && allFeatures.length > PREVIEW && (
                <button
                    className={styles.toggleBtn}
                    style={{ marginTop: "8px" }}
                    onClick={() => setExpanded(true)}
                >
                    + {allFeatures.length - PREVIEW} more features
                </button>
            )}
        </div>
    );
}

// ── ResultCard ─────────────────────────────────────────────────────────────

export default function ResultCard({ result }) {
    const verdict    = result.finalPrediction ?? result.verdict;
    const isReal     = verdict === "REAL";

    // לוקח את ה-threshold מהתוצאה (מהשרת או מההיסטוריה), אם משום מה אין, ישתמש ב-0.30
    const threshold  = result.threshold ?? DEFAULT_THRESHOLD;

    const ensemble   = result.ensembleScore ?? result.confidence ?? 0;
    const ae         = result.autoencoderScore ?? result.autoencoderError ?? 0;
    const rbm        = result.rbmScore ?? result.rbmError ?? 0;
    const filename   = result.originalFilename ?? result.filename;
    const analyzedAt = result.analyzedAt ?? result.uploadedAt;
    const procTime   = result.processingTimeMs;

    // מעביר את ה-threshold הדינמי לפונקציה כדי שהיא תחשב את רמת הביטחון באופן מדויק
    const conf       = confidenceLevel(ensemble, verdict, threshold);

    return (
        <div className={`${styles.card} ${isReal ? styles.real : styles.fake}`}>

            {/* Verdict */}
            <div className={styles.verdict}>
                <div className={styles.verdictBody}>
                    <div className={styles.verdictLabel}>
                        {isReal ? "Authentic Voice" : "Spoofed / Synthetic Voice"}
                    </div>
                    <div className={styles.scoreRow}>
                        <span className={styles.scoreDisplay}>
                            Score: <strong>{ensemble.toFixed(4)}</strong>
                        </span>
                        <span className={styles.scoreSep}>|</span>
                        <span className={styles.thresholdDisplay}>
                            Threshold: <strong>{threshold}</strong>
                        </span>
                        <span className={styles.scoreSep}>|</span>
                        <span className={styles.arrow}>→ <strong>{verdict}</strong></span>
                    </div>
                    <div className={styles.confLevel} style={{ color: conf.color }}>
                        ● {conf.label}
                    </div>
                </div>
            </div>

            {/* Model Scores */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Model Scores</div>
                <ModelScoreSection ae={ae} rbm={rbm} ensemble={ensemble} threshold={threshold} />
            </div>

            {/* Feature Analysis */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Feature Analysis</div>
                <p className={styles.sectionSub}>
                    52 acoustic features extracted · active subset selected via KS statistic
                </p>
                <FeatureChart
                    featuresVector={result.featuresVector ?? result.features}
                    activeFeatures={result.activeFeatures}
                />
            </div>

            {/* Meta */}
            <div className={styles.meta}>
                <span><File size={16} className="icon" /> {filename}</span>
                {analyzedAt && <span><Clock size={16} className="icon" /> {new Date(analyzedAt).toLocaleString()}</span>}
                {procTime   && <span><Zap size={16} className="icon" /> {procTime}ms</span>}
            </div>
        </div>
    );
}