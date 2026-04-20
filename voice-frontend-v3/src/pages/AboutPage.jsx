/**
 * AboutPage.jsx — Project background, datasets, models, engineering rationale.
 */

import styles from "./AboutPage.module.css";

const DATASETS = [
  {
    name: "Fake or Real (FoR)",
    type: "Both",
    size: "~198,000 samples",
    desc: "A balanced dataset of real and AI-generated speech samples used for both training and evaluation. Contains authentic human recordings alongside synthesized voices from multiple TTS systems.",
    url:  "https://www.kaggle.com/datasets/mohammedabdeldayem/the-fake-or-real-dataset",
  },
];

const MODELS = [
  {
    name: "Autoencoder (AE)",
    role: "Reconstruction Error",
    how: "Trained exclusively on real voices. Compresses the 30-feature vector to a bottleneck, then reconstructs it. A high reconstruction error means the input deviates from the real-voice manifold — a strong indicator of synthesis.",
    color: "#8b5cf6",
  },
  {
    name: "Gaussian RBM",
    role: "Statistical Anomaly Score",
    how: "Learns the joint probability distribution of real voice features using 19 selected features. Given a new sample, it computes a free-energy score — how surprising the sample is under the real-voice model. Fake voices produce anomalously high free energy.",
    color: "#06b6d4",
  },
];

export default function AboutPage() {
  return (
      <main className={styles.page}>
        <div className={styles.container}>

          {/* ── Project overview ──────────────────────────────────────────── */}
          <section className={styles.section}>
            <h1 className={styles.pageTitle}>About VOICE</h1>
            <p className={styles.lead}>
              VOICE is a machine-learning system for detecting AI-generated and deepfake audio.
              It was developed as a final-year software engineering project to address the growing
              risk of voice spoofing in authentication systems, financial services, and social media.
            </p>
            <p className={styles.body}>
              Modern text-to-speech models (WaveNet, Tacotron, VITS) can produce voice audio that is
              indistinguishable to the human ear. VOICE approaches this as an anomaly detection problem:
              instead of trying to enumerate every synthesis method, it learns what real human voices
              look like at the acoustic level and flags anything that deviates.
            </p>
          </section>

          {/* ── Datasets ─────────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Training Dataset</h2>
            <div className={styles.datasetGrid}>
              {DATASETS.map(({ name, type, size, desc, url }) => (
                  <div key={name} className={`${styles.datasetCard} ${styles.realCard}`}>
                    <div className={styles.datasetHeader}>
                  <span className={`${styles.typePill} ${styles.pillReal}`}>
                    🎙️ Real & Synthetic voices
                  </span>
                      <span className={styles.datasetSize}>{size}</span>
                    </div>
                    <h3 className={styles.datasetName}>{name}</h3>
                    <p className={styles.datasetDesc}>{desc}</p>
                    <a href={url} target="_blank" rel="noreferrer" className={styles.datasetLink}>
                      View dataset →
                    </a>
                  </div>
              ))}
            </div>
          </section>

          {/* ── Models ───────────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Detection Models</h2>
            <div className={styles.modelGrid}>
              {MODELS.map(({ name, role, how, color }) => (
                  <div key={name} className={styles.modelCard} style={{ borderTopColor: color }}>
                    <div className={styles.modelName} style={{ color }}>{name}</div>
                    <div className={styles.modelRole}>{role}</div>
                    <p className={styles.modelHow}>{how}</p>
                  </div>
              ))}
            </div>
            <div className={styles.votingBox}>
              <h3 className={styles.votingTitle}>Soft Voting Ensemble</h3>
              <p className={styles.votingDesc}>
                Both models run in parallel. Their scores are combined using performance-weighted
                Soft Voting — models that performed better during calibration receive a higher weight.
                The final ensemble score is compared against a calibrated threshold of{" "}
                <strong>0.30</strong>. The system is tuned for high sensitivity: when in doubt, it
                flags audio as suspicious.
              </p>
            </div>
          </section>

          {/* ── Feature selection ─────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Feature Selection — KS Statistic</h2>
            <p className={styles.body}>
              From the 52 extracted acoustic features, each model uses a dedicated subset selected
              by the Kolmogorov-Smirnov (KS) statistic — a non-parametric test that measures how
              differently a feature is distributed between real and synthetic voice samples.
              Features with low KS scores were excluded as they provide weak separation power.
            </p>
            <div className={styles.featureSplit}>
              <div className={styles.splitBox}>
                <div className={styles.splitNum} style={{ color: "#8b5cf6" }}>30</div>
                <div className={styles.splitLabel}>AE features</div>
                <div className={styles.splitSub}>Deltas, Energy RMS, MFCC 1/5/10</div>
              </div>
              <div className={styles.splitArrow}>|</div>
              <div className={styles.splitBox}>
                <div className={styles.splitNum} style={{ color: "#06b6d4" }}>19</div>
                <div className={styles.splitLabel}>RBM features</div>
                <div className={styles.splitSub}>MFCCs, physiological, Deltas</div>
              </div>
              <div className={styles.splitArrow}>of</div>
              <div className={styles.splitBox}>
                <div className={styles.splitNum} style={{ color: "#a78bfa" }}>52</div>
                <div className={styles.splitLabel}>Total extracted</div>
                <div className={styles.splitSub}>All shown in the result card for auditability</div>
              </div>
            </div>
          </section>

          {/* ── Tech stack ───────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Technology Stack</h2>
            <div className={styles.stackGrid}>
              {[
                { layer: "Frontend",   tech: "React 18 · Vite · CSS Modules" },
                { layer: "Backend",    tech: "Java 17 · Spring Boot 3 · JWT" },
                { layer: "AI Engine",  tech: "Python 3 · librosa · scikit-learn" },
                { layer: "Database",   tech: "PostgreSQL · JPA / Hibernate" },
                { layer: "IPC",        tech: "REST API · JSON · Flask" },
                { layer: "Dataset",    tech: "Fake or Real (FoR) Dataset" },
              ].map(({ layer, tech }) => (
                  <div key={layer} className={styles.stackRow}>
                    <span className={styles.stackLayer}>{layer}</span>
                    <span className={styles.stackTech}>{tech}</span>
                  </div>
              ))}
            </div>
          </section>

        </div>
      </main>
  );
}