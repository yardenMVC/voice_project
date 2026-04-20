/**
 * ResultCard.jsx — Full analysis result with visualizations
 *
 * Changes from previous version:
 * - Removed "Score Over Time" / TimelineChart (windowScores not in backend)
 * - FeatureChart now driven by activeFeatures from backend (not static featureDefs)
 *   showing which model each feature belongs to: AE / RBM / both
 * - Feature selection note updated: "KS statistic" instead of "DBSCAN"
 * - Field names aligned with AnalysisResponse: finalPrediction, autoencoderScore,
 *   rbmScore, processingTimeMs, activeFeatures
 */

import { useState } from "react";
import styles from "./ResultCard.module.css";

const THRESHOLD = 0.30;

function confidenceLevel(score, verdict) {
    const dist = verdict === "FAKE" ? score - THRESHOLD : THRESHOLD - score;
    if (dist < 0.15) return { label: "Low confidence",    color: "#f59e0b" };
    if (dist < 0.35) return { label: "Medium confidence", color: "#06b6d4" };
    return              { label: "High confidence",    color: "#4ade80" };
}

function ModelScoreChart({ ae, rbm, ensemble, threshold }) {
    const models = [
        { label: "Autoencoder", score: ae,       desc: "Reconstruction Error — Delta features" },
        { label: "GaussianRBM", score: rbm,      desc: "Free Energy — MFCC + physiological features" },
        { label: "Ensemble",    score: ensemble, desc: "Soft Voting — weighted combination", bold: true },
    ];
    const thPct = threshold * 100;
    return (
        <div className={styles.chartWrap}>
            {models.map(({ label, score, desc, bold }) => {
                const pct = Math.min(score * 100, 100);
                const over = score >= threshold;
                return (
                    <div key={label} className={styles.modelRow}>
                        <div className={styles.modelMeta}>
                            <span className={`${styles.modelLabel} ${bold ? styles.boldLabel : ""}`}>{label}</span>
                            <span className={styles.modelDesc}>{desc}</span>
                        </div>
                        <div className={styles.barTrack}>
                            <div className={styles.thresholdLine} style={{ left: `${thPct}%` }} title={`Threshold: ${threshold}`} />
                            <div className={`${styles.barFill} ${over ? styles.barFake : styles.barReal}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`${styles.scoreNum} ${over ? styles.scoreOver : styles.scoreUnder}`}>
              {score.toFixed(4)}
            </span>
                    </div>
                );
            })}
            <div className={styles.thresholdLegend}>
                <span className={styles.thresholdDash} /> Threshold: {threshold}
            </div>
        </div>
    );
}

/**
 * FeatureChart — driven by activeFeatures from backend.
 * Each feature shows which model(s) use it: AE / RBM / AE+RBM.
 * "Expand" button reveals the full list.
 */
function FeatureChart({ featuresVector, activeFeatures }) {
    const [expanded, setExpanded] = useState(false);

    if (!activeFeatures || !activeFeatures.features || activeFeatures.features.length === 0) {
        return <p style={{ color: "#475569", fontSize: "0.8rem" }}>Feature data not available.</p>;
    }

    const { totalExtracted, aeCount, rbmCount, selectionMethod, features } = activeFeatures;
    const displayed = expanded ? features : features.slice(0, 8);

    const modelTag = (activeIn) => {
        if (activeIn.includes("AE") && activeIn.includes("RBM")) return { label: "AE + RBM", color: "#8b5cf6" };
        if (activeIn.includes("AE"))  return { label: "AE",  color: "#06b6d4" };
        if (activeIn.includes("RBM")) return { label: "RBM", color: "#f59e0b" };
        return { label: "—", color: "#475569" };
    };

    return (
        <div>
            <div className={styles.featToggle}>
        <span className={styles.featCount}>
          <span className={styles.activeCount}>{totalExtracted} extracted</span>
          <span style={{ color: "#475569", marginLeft: "8px" }}>
            · {aeCount} in AE · {rbmCount} in RBM · selected by {selectionMethod}
          </span>
        </span>
                <button className={styles.toggleBtn} onClick={() => setExpanded((v) => !v)}>
                    {expanded ? "Show less" : `Expand all ${features.length} features`}
                </button>
            </div>

            <div className={styles.featList}>
                {displayed.map(({ name, index, activeIn }) => {
                    const tag = modelTag(activeIn);
                    // Try to find a display value from featuresVector
                    const keyGuess = name.toLowerCase().replace(/_/g, "");
                    const val = featuresVector
                        ? (featuresVector[name] ?? featuresVector[keyGuess] ?? null)
                        : null;

                    return (
                        <div key={name} className={styles.featRow}>
                            <div className={styles.featLabel}>
                <span
                    className={styles.featStatus}
                    style={{ background: tag.color + "22", color: tag.color, padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600 }}
                >
                  {tag.label}
                </span>
                                <span className={styles.featName}>{name}</span>
                                <span style={{ color: "#475569", fontSize: "0.7rem" }}>#{index}</span>
                            </div>
                            {val !== null && (
                                <span className={styles.featVal}>{Number(val).toFixed(4)}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {!expanded && features.length > 8 && (
                <button className={styles.toggleBtn} style={{ marginTop: "8px" }} onClick={() => setExpanded(true)}>
                    + {features.length - 8} more features
                </button>
            )}
        </div>
    );
}

export default function ResultCard({ result }) {
    // Support both old field names (history items) and new backend field names
    const verdict    = result.finalPrediction ?? result.verdict;
    const isReal     = verdict === "REAL";
    const threshold  = result.threshold ?? THRESHOLD;
    const ensemble   = result.ensembleScore ?? result.confidence ?? 0;
    const ae         = result.autoencoderScore ?? result.autoencoderError ?? 0;
    const rbm        = result.rbmScore ?? result.rbmError ?? 0;
    const filename   = result.originalFilename ?? result.filename;
    const analyzedAt = result.analyzedAt ?? result.uploadedAt;
    const procTime   = result.processingTimeMs;
    const conf       = confidenceLevel(ensemble, verdict);

    return (
        <div className={`${styles.card} ${isReal ? styles.real : styles.fake}`}>
            {/* Verdict */}
            <div className={styles.verdict}>
                <span className={styles.verdictIcon}>{isReal ? "✅" : "🚨"}</span>
                <div className={styles.verdictBody}>
                    <div className={styles.verdictLabel}>{isReal ? "Authentic Voice" : "Spoofed / Synthetic Voice"}</div>
                    <div className={styles.scoreRow}>
                        <span className={styles.scoreDisplay}>Score: <strong>{ensemble.toFixed(4)}</strong></span>
                        <span className={styles.scoreSep}>|</span>
                        <span className={styles.thresholdDisplay}>Threshold: <strong>{threshold}</strong></span>
                        <span className={styles.scoreSep}>|</span>
                        <span className={styles.arrow}>→ <strong>{verdict}</strong></span>
                    </div>
                    <div className={styles.confLevel} style={{ color: conf.color }}>● {conf.label}</div>
                </div>
            </div>

            <div className={styles.calibNote}>
                ⚠ System is calibrated for high sensitivity — prefers to flag suspicious audio as FAKE
            </div>

            {/* Model Scores */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Model Scores</div>
                <ModelScoreChart ae={ae} rbm={rbm} ensemble={ensemble} threshold={threshold} />
            </div>

            {/* Active Features */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Feature Analysis</div>
                <p className={styles.sectionSub}>
                    Features selected via KS statistic · highest distributional separation between real and fake audio
                </p>
                <FeatureChart
                    featuresVector={result.featuresVector ?? result.features}
                    activeFeatures={result.activeFeatures}
                />
            </div>

            {/* Meta */}
            <div className={styles.meta}>
                <span>📁 {filename}</span>
                {analyzedAt && <span>🕐 {new Date(analyzedAt).toLocaleString()}</span>}
                {procTime && <span>⚡ {procTime}ms</span>}
            </div>
        </div>
    );
}