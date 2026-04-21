/**
 * AboutPage.jsx — Project background, datasets, models.
 */

import styles from "./AboutPage.module.css";

const DATASETS = [
  {
    name: "Fake or Real (FoR)",
    pill: "Real & Synthetic",
    desc: "A balanced dataset of real and AI-generated speech samples used for both training and evaluation. Contains authentic human recordings alongside synthesized voices from multiple TTS systems.",
    url:  "https://www.kaggle.com/datasets/mohammedabdeldayem/the-fake-or-real-dataset",
  },
  {
    name: "Mozilla Common Voice",
    pill: "Real voices",
    desc: "An open-source dataset of real human voice recordings contributed by volunteers worldwide. Used to train and validate the system's understanding of authentic human speech patterns across diverse speakers and accents.",
    url:  "https://commonvoice.mozilla.org/en/datasets",
  },
  {
    name: "WaveFake",
    pill: "Synthetic voices",
    desc: "A dataset of AI-generated audio samples produced by multiple modern TTS systems including MelGAN, HiFi-GAN, and WaveGlow. Used to expose the system to a wide variety of synthesis artifacts and deepfake techniques.",
    url:  "https://github.com/RUB-SysSec/WaveFake",
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

          {/* ── Datasets ──────────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Training Datasets</h2>
            <div className={styles.datasetGrid}>
              {DATASETS.map(({ name, pill, desc, url }) => (
                  <div key={name} className={`${styles.datasetCard} ${styles.realCard}`}>
                    <div className={styles.datasetHeader}>
                  <span className={`${styles.typePill} ${styles.pillReal}`}>
                    🎙️ {pill}
                  </span>
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

          {/* ── Models ────────────────────────────────────────────────────── */}
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
                Both models run in parallel. Their raw scores are percentile-normalized against
                a calibration set of real voices, then combined using performance-weighted Soft Voting.
                The final ensemble score is compared against a calibrated threshold of{" "}
                <strong>0.30</strong>. The system is tuned for high sensitivity: when in doubt,
                it flags audio as suspicious.
              </p>
            </div>
          </section>

        </div>
      </main>
  );
}