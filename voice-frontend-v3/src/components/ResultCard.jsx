/**
 * ResultCard.jsx
 */

import { useState } from "react";
import styles from "./ResultCard.module.css";

const THRESHOLD = 0.30;

function confidenceLevel(score, verdict) {
  const dist = verdict === "FAKE" ? score - THRESHOLD : THRESHOLD - score;
  if (dist < 0.15) return { label: "Low confidence",    cls: "confLow" };
  if (dist < 0.35) return { label: "Medium confidence", cls: "confMed" };
  return              { label: "High confidence",    cls: "confHigh" };
}

// ── SVG Icons ─────────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="8" y2="12"/>
      <line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  );
}

function WarningSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" x2="12" y1="9" y2="13"/>
      <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

// ── Model Scores ───────────────────────────────────────────────────────────

function ModelScoreSection({ ae, rbm, ensemble, threshold }) {
  const thPct = threshold * 100;
  const ensembleOver = ensemble >= threshold;

  return (
    <div className={styles.chartWrap}>

      {/* AE — number only */}
      <div className={styles.modelRow}>
        <div className={styles.modelMeta}>
          <span className={styles.modelLabel}>Autoencoder</span>
          <span className={styles.modelDesc}>Reconstruction Error — Delta features</span>
        </div>
        <span className={styles.modelDescNote}>Raw score (unbounded scale)</span>
        <span className={styles.scoreNum}>{ae.toFixed(6)}</span>
      </div>

      {/* RBM — number only */}
      <div className={styles.modelRow}>
        <div className={styles.modelMeta}>
          <span className={styles.modelLabel}>GaussianRBM</span>
          <span className={styles.modelDesc}>Free Energy — MFCC + physiological features</span>
        </div>
        <span className={styles.modelDescNote}>Raw score (unbounded scale)</span>
        <span className={styles.scoreNum}>{rbm.toFixed(6)}</span>
      </div>

      {/* Ensemble — bar (0–1 scale) */}
      <div className={styles.modelRow}>
        <div className={styles.modelMeta}>
          <span className={`${styles.modelLabel} ${styles.boldLabel}`}>Ensemble</span>
          <span className={styles.modelDesc}>Soft Voting — percentile-normalized combination</span>
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

function modelTag(activeIn) {
  if (activeIn.includes("AE") && activeIn.includes("RBM")) return { label: "AE+RBM", cls: "Both" };
  if (activeIn.includes("AE"))  return { label: "AE",  cls: "Ae" };
  if (activeIn.includes("RBM")) return { label: "RBM", cls: "Rbm" };
  return null;
}

function FeatureChart({ featuresVector, activeFeatures }) {
  const [expanded, setExpanded] = useState(false);

  if (!featuresVector || Object.keys(featuresVector).length === 0) {
    return <p className={styles.modelDescNote}>Feature data not available.</p>;
  }

  const activeMap = {};
  if (activeFeatures?.features?.length > 0) {
    for (const f of activeFeatures.features) {
      activeMap[f.name] = f.activeIn ?? [];
    }
  }

  const allFeatures = Object.entries(featuresVector)
    .map(([name, val]) => ({ name, val, activeIn: activeMap[name] ?? [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const PREVIEW = 10;
  const displayed = expanded ? allFeatures : allFeatures.slice(0, PREVIEW);

  const aeCount  = activeFeatures?.aeCount  ?? Object.values(activeMap).filter(a => a.includes("AE")).length;
  const rbmCount = activeFeatures?.rbmCount ?? Object.values(activeMap).filter(a => a.includes("RBM")).length;
  const total    = Object.keys(featuresVector).length;

  return (
    <div>
      <div className={styles.featToggle}>
        <span className={styles.featCount}>
          <span className={styles.activeCount}>{total} extracted</span>
          {aeCount > 0 && (
            <span className={styles.inactiveCount} style={{ marginLeft: "8px" }}>
              · {aeCount} in AE · {rbmCount} in RBM
            </span>
          )}
        </span>
        <button className={styles.toggleBtn} onClick={() => setExpanded(v => !v)}>
          {expanded ? "Show less" : `Expand all ${total} features`}
        </button>
      </div>

      <div className={styles.featList}>
        {displayed.map(({ name, val, activeIn }) => {
          const tag = modelTag(activeIn);
          const numVal = typeof val === "number" ? val : Number(val);
          const tagCls = tag ? styles[`featTag${tag.cls}`] : null;

          return (
            <div key={name} className={styles.featRow}>
              <div className={styles.featLabel}>
                {tag ? (
                  <span className={`${styles.featStatus} ${tagCls}`}>
                    {tag.label}
                  </span>
                ) : (
                  <span className={styles.inactiveTag}>—</span>
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
        <span className={styles.verdictIcon}>
          {isReal ? <CheckCircleIcon /> : <AlertCircleIcon />}
        </span>
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
          <div className={`${styles.confLevel} ${styles[conf.cls]}`}>
            ● {conf.label}
          </div>
        </div>
      </div>

      <div className={styles.calibNote}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", verticalAlign: "middle" }}>
          <WarningSmallIcon />
          System is calibrated for high sensitivity — prefers to flag suspicious audio as FAKE
        </span>
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <FileIcon /> {filename}
        </span>
        {analyzedAt && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <ClockIcon /> {new Date(analyzedAt).toLocaleString()}
          </span>
        )}
        {procTime && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <ZapIcon /> {procTime}ms
          </span>
        )}
      </div>
    </div>
  );
}
