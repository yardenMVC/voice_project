/**
 * HowItWorksPage.jsx — Step-by-step pipeline explanation.
 *
 * Changes from previous version:
 * - Step 03: DBSCAN → KS statistic, 34 → 49 active features
 * - Step 04: 34-feature → 30-feature (AE subset)
 * - Step 07: ProcessBuilder/stdout → REST API to Flask on port 5001, MySQL → PostgreSQL
 * - FEATURES_ACTIVE: corrected to match config.py exactly
 * - Added feature search with definition lookup from backend
 */

import { useState } from "react";
import styles from "./HowItWorksPage.module.css";

const STEPS = [
  {
    num: "01",
    title: "Upload Audio",
    color: "#8b5cf6",
    icon: "📂",
    desc: "User uploads a voice file (WAV or MP3 — up to 50 MB). The frontend validates type and size before sending, saving a round-trip if the file is invalid.",
    detail: "Spring Boot receives the file as a Multipart POST, saves it to a timestamped temp directory to prevent filename collisions, then calls the Flask ML microservice via REST API.",
    tags: ["React", "Spring Boot", "Multipart"],
  },
  {
    num: "02",
    title: "Feature Extraction",
    color: "#06b6d4",
    icon: "🔊",
    desc: "The Python engine uses librosa and Parselmouth to extract 52 acoustic features from the audio signal. The audio is clipped to the center 10 seconds before extraction.",
    detail: "Features include MFCC × 13, Delta-MFCC × 13, Delta²-MFCC × 13, Mel statistics × 3, Pitch × 3, Jitter, Shimmer, Spectral Flatness, Spectral Contrast, Energy RMS, Reverberation, and SNR.",
    tags: ["Python", "librosa", "Parselmouth", "52 features"],
  },
  {
    num: "03",
    title: "KS Statistic Feature Selection",
    color: "#4ade80",
    icon: "🔬",
    desc: "Not all 52 features separate real from fake audio equally well. The Kolmogorov-Smirnov statistic measures how differently each feature is distributed between real and synthetic voices.",
    detail: "Features with high KS scores have nearly disjoint distributions between real and fake — they are highly discriminative. The AE uses 30 features (Delta dynamics), the RBM uses 19 features (MFCCs + physiological). Some features appear in both models.",
    tags: ["KS statistic", "30 AE features", "19 RBM features"],
  },
  {
    num: "04",
    title: "Autoencoder Inference",
    color: "#f59e0b",
    icon: "🤖",
    desc: "The Autoencoder was trained only on real voice features. It compresses the 30-feature AE vector to a bottleneck and reconstructs it. The reconstruction error measures how 'surprising' the input is.",
    detail: "High error = the input deviates from the real-voice manifold the AE learned. Synthetic voices from TTS systems produce telltale artefacts that the AE cannot reconstruct cleanly. The raw score is then percentile-normalized against a reference distribution of real voices.",
    tags: ["Autoencoder", "Reconstruction Error", "30 features"],
  },
  {
    num: "05",
    title: "GaussianRBM Inference",
    color: "#f87171",
    icon: "🧠",
    desc: "The Gaussian RBM learns the statistical distribution of real voice features across 19 selected features. It assigns a free-energy score — lower energy means the sample fits the real-voice distribution.",
    detail: "Fake voices produce anomalously high free energy because they fall outside the probability mass the RBM learned. The raw free-energy score is percentile-normalized before ensemble combination. The RBM and AE run in parallel.",
    tags: ["GaussianRBM", "Free Energy", "19 features", "scikit-learn"],
  },
  {
    num: "06",
    title: "Soft Voting — Final Verdict",
    color: "#a78bfa",
    icon: "⚖️",
    desc: "Both normalized scores are combined using performance-weighted Soft Voting. The ensemble score is compared against a calibrated threshold of 0.30. Above threshold → FAKE.",
    detail: "Weights are set by each model's performance on the calibration set. The system is tuned for high sensitivity — it prefers false positives over missing a fake, because the cost of a missed deepfake is higher.",
    tags: ["Soft Voting", "Threshold: 0.30", "Percentile Normalized"],
  },
  {
    num: "07",
    title: "Result Returned",
    color: "#06b6d4",
    icon: "📊",
    desc: "Flask returns a structured JSON response to Spring Boot. The backend saves the result to PostgreSQL and returns the full AnalysisResponse to the React frontend.",
    detail: "The result includes the verdict, ensemble score, individual model scores, all 52 feature values, and active feature metadata. The temp file is deleted immediately after analysis to protect user privacy.",
    tags: ["JSON", "Flask → Spring Boot", "PostgreSQL"],
  },
];

// Matches config.py ACTIVE_FEATURES_AE and ACTIVE_FEATURES_RBM exactly
const AE_FEATURES = [
  "Delta_1","Delta_2","Delta_3","Delta_4","Delta_5","Delta_6","Delta_7",
  "Delta_8","Delta_9","Delta_10","Delta_11","Delta_12","Delta_13",
  "Delta2_1","Delta2_2","Delta2_3","Delta2_4","Delta2_5","Delta2_6",
  "Delta2_7","Delta2_8","Delta2_9","Delta2_10","Delta2_11","Delta2_12","Delta2_13",
  "Energy_RMS","MFCC_1","MFCC_10","MFCC_5",
];

const RBM_FEATURES = [
  "Delta_1","MFCC_10","Shimmer","MFCC_5","MFCC_8","Spectral_Contrast",
  "Delta_5","SNR","Delta_3","MFCC_12","Delta2_1","Delta_10","MFCC_1",
  "Delta_8","Delta_12","MFCC_7","Jitter","Energy_RMS","Delta2_2",
];

const AE_SET  = new Set(AE_FEATURES);
const RBM_SET = new Set(RBM_FEATURES);

// All 52 feature names in extraction order
const ALL_52 = [
  "MFCC_1","MFCC_2","MFCC_3","MFCC_4","MFCC_5","MFCC_6","MFCC_7","MFCC_8",
  "MFCC_9","MFCC_10","MFCC_11","MFCC_12","MFCC_13",
  "Delta_1","Delta_2","Delta_3","Delta_4","Delta_5","Delta_6","Delta_7",
  "Delta_8","Delta_9","Delta_10","Delta_11","Delta_12","Delta_13",
  "Delta2_1","Delta2_2","Delta2_3","Delta2_4","Delta2_5","Delta2_6",
  "Delta2_7","Delta2_8","Delta2_9","Delta2_10","Delta2_11","Delta2_12","Delta2_13",
  "Mel_Mean","Mel_Std","Mel_Max",
  "Pitch_Mean_Norm","Pitch_Std_Norm","Pitch_Median_Norm",
  "Jitter","Shimmer","Spectral_Flatness","Spectral_Contrast",
  "Energy_RMS","Reverberation","SNR",
];

// ── Feature Search Section ─────────────────────────────────────────────────

function FeatureSearch() {
  const [query,      setQuery]      = useState("");
  const [definition, setDefinition] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const filtered = query.trim().length > 0
      ? ALL_52.filter(f => f.toLowerCase().includes(query.toLowerCase()))
      : [];

  const fetchDefinition = async (featureName) => {
    setLoading(true);
    setError(null);
    setDefinition(null);
    try {
      const res = await fetch(
          `http://localhost:8080/api/features/${encodeURIComponent(featureName)}`
      );
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setDefinition(data);
    } catch {
      setError("Could not load definition for " + featureName);
    } finally {
      setLoading(false);
    }
  };

  const modelTag = (name) => {
    const inAe  = AE_SET.has(name);
    const inRbm = RBM_SET.has(name);
    if (inAe && inRbm) return { label: "AE + RBM", color: "#8b5cf6" };
    if (inAe)           return { label: "AE",       color: "#06b6d4" };
    if (inRbm)          return { label: "RBM",      color: "#f59e0b" };
    return                     { label: "inactive",  color: "#475569" };
  };

  return (
      <section className={styles.featSection}>
        <h2 className={styles.sectionTitle}>Feature Dictionary</h2>
        <p className={styles.body}>
          Search any of the 52 extracted features to see which model uses it and what it measures.
        </p>

        {/* Search input */}
        <input
            type="text"
            placeholder="Search feature name, e.g. MFCC_1, Jitter, SNR..."
            value={query}
            onChange={e => { setQuery(e.target.value); setDefinition(null); setError(null); }}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "0.9rem",
              padding: "0.6rem 1rem",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "0.75rem",
            }}
        />

        {/* Search results */}
        {filtered.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
              {filtered.map(name => {
                const tag = modelTag(name);
                return (
                    <button
                        key={name}
                        onClick={() => fetchDefinition(name)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${tag.color}44`,
                          borderRadius: "6px",
                          color: tag.color,
                          cursor: "pointer",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "0.3rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                    >
                <span style={{
                  background: tag.color + "22",
                  borderRadius: "3px",
                  fontSize: "0.65rem",
                  padding: "0 4px",
                }}>
                  {tag.label}
                </span>
                      {name}
                    </button>
                );
              })}
            </div>
        )}

        {/* Definition card */}
        {loading && (
            <p style={{ color: "#475569", fontSize: "0.85rem" }}>Loading…</p>
        )}

        {error && (
            <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>
        )}

        {definition && (
            <div style={{
              background: "rgba(139,92,246,0.07)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: "10px",
              padding: "1rem 1.25rem",
              marginTop: "0.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1rem" }}>
              {definition.featureName}
            </span>
                <span style={{ color: "#a78bfa", fontSize: "0.8rem" }}>
              {definition.displayName}
            </span>
                <span style={{
                  marginLeft: "auto",
                  background: "rgba(139,92,246,0.2)",
                  borderRadius: "4px",
                  color: "#a78bfa",
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                }}>
              index #{definition.featureIndex}
            </span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.65, margin: 0 }}>
                {definition.description}
              </p>
            </div>
        )}

        {/* Full active feature chips */}
        <div style={{ marginTop: "1.5rem" }}>
          <p className={styles.body} style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "#e2e8f0" }}>AE subset (30):</strong> Delta-MFCC dynamics + Energy RMS + MFCC 1/5/10
            &nbsp;·&nbsp;
            <strong style={{ color: "#e2e8f0" }}>RBM subset (19):</strong> MFCCs + physiological features + selected Deltas
          </p>
          <div className={styles.featGrid}>
            {ALL_52.map(name => {
              const tag = modelTag(name);
              return (
                  <div
                      key={name}
                      className={styles.featChip}
                      style={{ borderColor: tag.color + "44", cursor: "pointer" }}
                      onClick={() => { setQuery(name); fetchDefinition(name); }}
                  >
                <span style={{ color: tag.color, marginRight: "4px", fontSize: "0.65rem" }}>
                  {tag.label === "inactive" ? "○" : "✓"}
                </span>
                    {name}
                  </div>
              );
            })}
          </div>
        </div>
      </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>How It Works</h1>
          <p className={styles.lead}>
            From a raw audio file to an auditable verdict — the complete pipeline explained step by step.
          </p>

          {/* Pipeline steps */}
          <div className={styles.pipeline}>
            {STEPS.map(({ num, title, color, icon, desc, detail, tags }, i) => (
                <div key={num} className={styles.step}>
                  {i < STEPS.length - 1 && <div className={styles.connector} />}

                  <div className={styles.stepLeft}>
                    <div className={styles.stepBadge} style={{ background: color, boxShadow: `0 0 20px ${color}44` }}>
                      <span className={styles.stepIcon}>{icon}</span>
                    </div>
                    <div className={styles.stepNum} style={{ color }}>{num}</div>
                  </div>

                  <div className={styles.stepBody}>
                    <h2 className={styles.stepTitle} style={{ color }}>{title}</h2>
                    <p className={styles.stepDesc}>{desc}</p>
                    <p className={styles.stepDetail}>{detail}</p>
                    <div className={styles.tags}>
                      {tags.map(t => (
                          <span key={t} className={styles.tag} style={{ borderColor: `${color}44`, color }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {/* Feature Dictionary with search */}
          <FeatureSearch />
        </div>
      </main>
  );
}