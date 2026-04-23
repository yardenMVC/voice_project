/**
 * UserGuidePage.jsx — How to use VOICE.
 * Covers: uploading a file, understanding the results.
 */

import styles from "./HowItWorksPage.module.css"; // reuse existing styles

export default function UserGuidePage() {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>User Guide</h1>
                <p className={styles.lead}>
                    A quick guide to uploading audio and understanding your results.
                </p>

                {/* ── Step 1 — Register & Login ────────────────────────────────── */}
                <section style={{ marginBottom: "2.5rem" }}>
                    <h2 className={styles.sectionTitle}>Step 1 Create an Account</h2>
                    <p className={styles.body}>
                        Click <strong>Register</strong> in the top navigation bar. Enter a username
                        (3–30 characters), a valid email address, and a password of at least 8 characters.
                        After registering, you will be redirected to the login page. Sign in with your
                        credentials to access the analysis features.
                    </p>
                    <p className={styles.body}>
                        Your session is managed with a secure JWT token stored in memory — it is never
                        written to disk or browser storage. Closing the tab signs you out automatically.
                    </p>
                </section>

                {/* ── Step 2 — Upload ─────────────────────────────────────────── */}
                <section style={{ marginBottom: "2.5rem" }}>
                    <h2 className={styles.sectionTitle}>Step 2 Upload an Audio File</h2>
                    <p className={styles.body}>
                        Navigate to the <strong>Upload</strong> page. You can either click the drop zone
                        to open a file browser, or drag and drop a file directly onto it.
                    </p>
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        padding: "1rem 1.25rem",
                        marginBottom: "1rem",
                    }}>
                        <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 0.5rem", fontWeight: 600 }}>
                            Accepted formats
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            {["WAV", "MP3"].map(f => (
                                <span key={f} style={{
                                    background: "rgba(139,92,246,0.15)",
                                    border: "1px solid rgba(139,92,246,0.3)",
                                    borderRadius: "5px",
                                    color: "#a78bfa",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    padding: "0.2rem 0.6rem",
                                }}>
                  {f}
                </span>
                            ))}
                            <span style={{ color: "#475569", fontSize: "0.8rem", alignSelf: "center" }}>
                · Maximum size: 50 MB · Minimum duration: 0.5 seconds Maximum duration: 30 seconds
              </span>
                        </div>
                    </div>
                    <p className={styles.body}>
                        Once a file is selected, click <strong>Analyze Voice</strong>. The system will
                        extract 52 acoustic features and run both the Autoencoder and GaussianRBM models.
                        Analysis typically completes in under 3 seconds.
                    </p>
                </section>

                {/* ── Step 3 — Results ─────────────────────────────────────────── */}
                <section style={{ marginBottom: "2.5rem" }}>
                    <h2 className={styles.sectionTitle}>Step 3 Understanding Your Results</h2>

                    {/* Verdict */}
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem", marginTop: "1.25rem" }}>
                        Verdict
                    </h3>
                    <p className={styles.body}>
                        The system returns one of two verdicts:
                    </p>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                        <div style={{
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: "8px",
                            padding: "0.75rem 1rem",
                            flex: 1,
                            minWidth: "180px",
                        }}>
                            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: "0.25rem" }}>
                                ✅ REAL
                            </div>
                            <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0 }}>
                                The ensemble score is below the 0.30 threshold. The audio shows no significant
                                anomalies and is consistent with authentic human speech.
                            </p>
                        </div>
                        <div style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "8px",
                            padding: "0.75rem 1rem",
                            flex: 1,
                            minWidth: "180px",
                        }}>
                            <div style={{ color: "#f87171", fontWeight: 700, marginBottom: "0.25rem" }}>
                                🚨 FAKE
                            </div>
                            <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0 }}>
                                The ensemble score exceeds 0.30. The audio contains statistical anomalies
                                consistent with AI-generated or synthesized speech.
                            </p>
                        </div>
                    </div>

                    {/* Scores */}
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem", marginTop: "1.25rem" }}>
                        Model Scores
                    </h3>
                    <p className={styles.body}>
                        Three scores are shown for each analysis:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                        {[
                            {
                                label: "Autoencoder Score",
                                color: "#8b5cf6",
                                desc: "The raw reconstruction error from the Autoencoder. This number has no fixed scale — what matters is whether it is high relative to the calibration set. A higher value indicates the audio deviates more from the real-voice pattern the model learned.",
                            },
                            {
                                label: "GaussianRBM Score",
                                color: "#06b6d4",
                                desc: "The raw free-energy score from the RBM. Like the AE score, this is not on a 0–1 scale. A higher (less negative) value indicates the sample is statistically unusual compared to the real-voice distribution the model learned.",
                            },
                            {
                                label: "Ensemble Score",
                                color: "#4ade80",
                                desc: "The final combined score on a 0–1 scale. Both raw scores are percentile-normalized and then combined using weighted Soft Voting. This is the only score compared against the 0.30 threshold to produce the final verdict.",
                            },
                        ].map(({ label, color, desc }) => (
                            <div key={label} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${color}33`,
                                borderRadius: "8px",
                                padding: "0.875rem 1rem",
                            }}>
                                <div style={{ color, fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.35rem" }}>
                                    {label}
                                </div>
                                <p style={{ color: "#64748b", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Features */}
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem", marginTop: "1.25rem" }}>
                        Feature Analysis
                    </h3>
                    <p className={styles.body}>
                        Below the scores, you will see the full list of 52 acoustic features extracted
                        from your file. Each feature shows its exact value. Features tagged{" "}
                        <span style={{ color: "#06b6d4", fontWeight: 600 }}>AE</span>,{" "}
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>RBM</span>, or{" "}
                        <span style={{ color: "#8b5cf6", fontWeight: 600 }}>AE + RBM</span>{" "}
                        are the ones that influenced the verdict. Features marked{" "}
                        <span style={{ color: "#475569", fontWeight: 600 }}>—</span>{" "}
                        were extracted but not used as input to either model.
                    </p>
                    <p className={styles.body}>
                        Click <strong>Expand all 52 features</strong> to see the complete list.
                        This breakdown is provided for full auditability — you can see exactly which
                        signals drove the system's decision.
                    </p>
                </section>

                {/* ── Step 4 — History ─────────────────────────────────────────── */}
                <section style={{ marginBottom: "2.5rem" }}>
                    <h2 className={styles.sectionTitle}>Step 4 Viewing Your History</h2>
                    <p className={styles.body}>
                        Every analysis you perform is automatically saved. Navigate to the{" "}
                        <strong>History</strong> page to see all your past analyses, sorted from newest
                        to oldest. Click the arrow on any row to expand the full result card.
                        Use the bin icon to delete an entry.
                    </p>
                </section>

                {/* ── Important note ───────────────────────────────────────────── */}
                <section style={{
                    background: "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                }}>
                    <p style={{ color: "#fbbf24", fontWeight: 600, margin: "0 0 0.4rem", fontSize: "0.9rem" }}>
                         Important
                    </p>
                    <p style={{ color: "#94a3b8", fontSize: "0.83rem", margin: 0, lineHeight: 1.65 }}>
                        The system is calibrated for high sensitivity — it prefers to flag suspicious
                        audio as FAKE rather than miss a deepfake. This means some authentic recordings
                        may occasionally receive a FAKE verdict, particularly if the recording quality
                        is poor, the file is very short, or there is significant background noise.
                        Always use the feature breakdown to assess the confidence of the result.
                    </p>
                </section>

            </div>
        </main>
    );
}