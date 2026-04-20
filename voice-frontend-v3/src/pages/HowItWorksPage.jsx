/**
 * HowItWorksPage.jsx — Step-by-step visual pipeline explanation.
 * Shows the full flow: upload → feature extraction → models → verdict.
 */

import styles from "./HowItWorksPage.module.css";

const STEPS = [
  {
    num: "01",
    title: "Upload Audio",
    color: "#8b5cf6",
    icon: "📂",
    desc: "User uploads a voice file (WAV, MP3, FLAC, OGG — up to 10 MB). The frontend validates type and size before sending, saving a round-trip if the file is invalid.",
    detail: "Spring Boot receives the file as a Multipart POST, stores it temporarily with a UUID prefix to prevent collisions, and invokes the Python engine via ProcessBuilder.",
    tags: ["React", "Spring Boot", "Multipart"],
  },
  {
    num: "02",
    title: "Feature Extraction",
    color: "#06b6d4",
    icon: "🔊",
    desc: "The Python engine uses librosa to extract 52 acoustic features from the audio signal. This transforms raw audio — thousands of samples — into a compact numerical vector.",
    detail: "Features include MFCC × 13, Delta-MFCC × 13, Delta²-MFCC × 13, Jitter, Shimmer, SNR, HNR, Spectral Centroid, Bandwidth, Rolloff, Flatness, Zero Crossing Rate, Energy, RMS, and Mel-Spectrogram bands.",
    tags: ["Python", "librosa", "52 features"],
  },
  {
    num: "03",
    title: "DBSCAN Feature Selection",
    color: "#4ade80",
    icon: "🔬",
    desc: "Not all 52 features separate real from fake audio equally well. DBSCAN cluster analysis identified 34 features with high separation power. The remaining 18 are computed but excluded from model input.",
    detail: "Features like Pitch and Reverberation were excluded — modern TTS models replicate them too convincingly. Excluding low-power features reduces noise and improves model precision.",
    tags: ["DBSCAN", "34 active", "18 excluded"],
  },
  {
    num: "04",
    title: "Autoencoder Inference",
    color: "#f59e0b",
    icon: "🤖",
    desc: "The Autoencoder was trained only on real voice features. It compresses the 34-feature vector to a bottleneck representation and reconstructs it. The reconstruction error measures how 'surprising' the input is.",
    detail: "High error = the input deviates from the real-voice manifold the AE learned. Synthetic voices from TTS systems produce telltale artefacts that the AE cannot reconstruct cleanly.",
    tags: ["Autoencoder", "Reconstruction Error", "PyTorch"],
  },
  {
    num: "05",
    title: "GaussianRBM Inference",
    color: "#f87171",
    icon: "🧠",
    desc: "The Gaussian RBM learns the statistical distribution of real voice features. It assigns a free-energy score to any input — lower energy means the sample fits the learned real-voice distribution.",
    detail: "Fake voices produce anomalously high free energy because they fall outside the probability mass the RBM learned from real data. The RBM and AE run in parallel for speed.",
    tags: ["GaussianRBM", "Free Energy", "scikit-learn"],
  },
  {
    num: "06",
    title: "Soft Voting — Final Verdict",
    color: "#a78bfa",
    icon: "⚖️",
    desc: "Both model scores are combined using performance-weighted Soft Voting. The ensemble score is compared against a calibrated threshold of 0.30. Above threshold → FAKE.",
    detail: "Weights are set by each model's performance on the calibration set. The system is tuned for high sensitivity — it prefers false positives over missing a fake, because the cost of a missed deepfake is higher.",
    tags: ["Soft Voting", "Threshold: 0.30", "Calibrated"],
  },
  {
    num: "07",
    title: "Result Returned",
    color: "#06b6d4",
    icon: "📊",
    desc: "The Python engine prints a JSON result to stdout. Spring Boot reads it, saves to the database, and returns it to the React frontend.",
    detail: "The result includes the verdict, ensemble score, individual model scores, all 52 feature values (active + inactive), and per-window scores for the timeline chart.",
    tags: ["JSON", "Spring Boot", "MySQL"],
  },
];

const FEATURES_ACTIVE = [
  "MFCC 1–13", "Delta-MFCC 1–13", "Delta²-MFCC 1–7",
  "Jitter", "Shimmer", "SNR", "HNR", "RMS",
  "Spectral Centroid", "Spectral Bandwidth", "Spectral Rolloff",
  "Spectral Flatness", "Zero Crossing Rate", "Energy",
  "Mel-Spectrogram 1–3",
];

export default function HowItWorksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>How It Works</h1>
        <p className={styles.lead}>
          From a raw audio file to an auditable verdict — the complete pipeline explained step by step.
        </p>

        {/* ── Pipeline steps ─────────────────────────────────────────────── */}
        <div className={styles.pipeline}>
          {STEPS.map(({ num, title, color, icon, desc, detail, tags }, i) => (
            <div key={num} className={styles.step}>
              {/* connector */}
              {i < STEPS.length - 1 && (
                <div className={styles.connector}>
                  <div className={styles.connectorLine} />
                </div>
              )}

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
                  {tags.map((t) => (
                    <span key={t} className={styles.tag} style={{ borderColor: `${color}44`, color }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active features list ───────────────────────────────────────── */}
        <section className={styles.featSection}>
          <h2 className={styles.sectionTitle}>Active Feature Set (34 of 52)</h2>
          <p className={styles.body}>
            These features were selected by DBSCAN analysis as having strong separation power
            between real and synthetic voice clusters.
          </p>
          <div className={styles.featGrid}>
            {FEATURES_ACTIVE.map((f) => (
              <div key={f} className={styles.featChip}>
                <span className={styles.featCheck}>✓</span> {f}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
