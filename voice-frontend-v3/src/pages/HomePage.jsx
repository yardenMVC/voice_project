/**
 * HomePage.jsx — Public landing page
 * Accessible without login. Shows what the system does + CTA to sign in.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./HomePage.module.css";

const FEATURES = [
  {
    icon: "🔊",
    title: "52 Acoustic Features",
    desc: "MFCC, Delta, Jitter, Shimmer, SNR and more — extracted by librosa from every uploaded file.",
  },
  {
    icon: "🤖",
    title: "Dual-Model Detection",
    desc: "Autoencoder measures reconstruction error. GaussianRBM detects statistical anomalies. Both run in parallel.",
  },
  {
    icon: "⚖️",
    title: "Soft Voting Ensemble",
    desc: "Performance-weighted combination of both models produces a final confidence score against a calibrated threshold.",
  },
  {
    icon: "📊",
    title: "Full Transparency",
    desc: "Every decision is auditable — see every feature value, model score, and where in the file the anomaly appears.",
  },
  {
    icon: "🛡️",
    title: "KS Feature Selection",
    desc: "Features are selected per model using the KS statistic — measuring separation power between real and synthetic voice distributions.",
  },
  {
    icon: "⚡",
    title: "Real-Time Results",
    desc: "Upload a file, get a verdict in seconds. Supports WAV, MP3, FLAC, and OGG up to 10 MB.",
  },
];

const STATS = [
  { value: "52",   label: "Acoustic features extracted" },
  { value: "34",   label: "Active features (KS selected)" },
  { value: "2",    label: "ML models in ensemble" },
  { value: "0.30", label: "Calibrated detection threshold" },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
      <main className={styles.page}>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroBadge}>Voice Authenticity Detection</div>
            <h1 className={styles.heroTitle}>
              Can You Tell the Difference?
              <span className={styles.heroAccent}> We Can.</span>
            </h1>
            <p className={styles.heroSub}>
              VOICE uses machine learning to detect AI-generated and deepfake audio.
              Upload any voice recording — get an instant, auditable verdict.
            </p>
            <div className={styles.heroCta}>
              {user ? (
                  <Link to="/upload" className={styles.btnPrimary}>
                    Analyze a File →
                  </Link>
              ) : (
                  <>
                    <Link to="/register" className={styles.btnPrimary}>
                      Get Started — It's Free
                    </Link>
                    <Link to="/login" className={styles.btnSecondary}>
                      Sign In
                    </Link>
                  </>
              )}
            </div>
          </div>

          {/* decorative waveform */}
          <div className={styles.waveWrap} aria-hidden>
            <svg viewBox="0 0 600 120" className={styles.wave}>
              {Array.from({ length: 60 }, (_, i) => {
                const x = i * 10 + 5;
                const h = 10 + Math.abs(Math.sin(i * 0.7) * 45 + Math.sin(i * 1.3) * 20);
                return (
                    <rect key={i} x={x} y={60 - h / 2} width="5" height={h}
                          rx="2.5" fill={i % 3 === 0 ? "#8b5cf6" : i % 3 === 1 ? "#06b6d4" : "rgba(139,92,246,0.4)"} />
                );
              })}
            </svg>
          </div>
        </section>

        {/* ── Quick stats ───────────────────────────────────────────────────── */}
        <section className={styles.statsRow}>
          {STATS.map(({ value, label }) => (
              <div key={label} className={styles.statBox}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
          ))}
        </section>

        {/* ── Feature grid ──────────────────────────────────────────────────── */}
        <section className={styles.featSection}>
          <h2 className={styles.sectionTitle}>How VOICE Protects You</h2>
          <p className={styles.sectionSub}>
            A multi-layer pipeline built on signal processing and unsupervised anomaly detection.
          </p>
          <div className={styles.featGrid}>
            {FEATURES.map(({ icon, title, desc }) => (
                <div key={title} className={styles.featCard}>
                  <span className={styles.featIcon}>{icon}</span>
                  <h3 className={styles.featTitle}>{title}</h3>
                  <p className={styles.featDesc}>{desc}</p>
                </div>
            ))}
          </div>
        </section>

        {/* ── CTA strip ─────────────────────────────────────────────────────── */}
        <section className={styles.ctaStrip}>
          <h2 className={styles.ctaTitle}>Ready to analyze a voice?</h2>
          <p className={styles.ctaSub}>Free to use. No credit card required.</p>
          {user ? (
              <Link to="/upload" className={styles.btnPrimary}>Upload Audio →</Link>
          ) : (
              <Link to="/register" className={styles.btnPrimary}>Create Account →</Link>
          )}
        </section>
      </main>
  );
}