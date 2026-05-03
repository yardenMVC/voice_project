/**
 * AdminUserHistoryPage.jsx — Analysis history for a specific user.
 * Route: /admin/history/:username (ROLE_ADMIN only)
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync.js";
import { CheckCircle, AlertTriangle } from "lucide-react";
import * as analysisApi from "../../api/analysisApi.js";
import ResultCard from "../../components/ResultCard.jsx";
import ErrorBanner from "../../components/ErrorBanner.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import styles from "../AdminPage/AdminPage.module.css";

export default function AdminUserHistoryPage() {
    const { username }             = useParams();
    const navigate                 = useNavigate();
    const [items,       setItems]  = useState([]);
    const { loading, error, run }  = useAsync();
    const [expandedId, setExpanded] = useState(null);

    useEffect(() => {
        run(() => analysisApi.getHistoryByUsername(username))
            .then(setItems)
            .catch(() => {});
    }, [username, run]);

    return (
        <main className={styles.page}>
            <div className={styles.container}>

                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.heading}>Analysis History</h1>
                        <p className={styles.sub}>User: <strong style={{ color: "#e2e8f0" }}>{username}</strong></p>
                    </div>
                    <button className={styles.cancelBtn} onClick={() => navigate("/admin")}>
                        ← Back to Admin
                    </button>
                </div>

                <ErrorBanner message={error} />

                {loading && <LoadingState message="Loading history…" />}

                {!loading && items.length === 0 && !error && (
                    <p style={{ color: "#475569", textAlign: "center", padding: "3rem" }}>
                        No analyses yet for this user.
                    </p>
                )}

                {!loading && items.length > 0 && (
                    <div className={styles.list}>
                        {items.map((item) => {
                            const verdict    = item.finalPrediction ?? item.verdict;
                            const filename   = item.originalFilename ?? item.filename;
                            const analyzedAt = item.analyzedAt ?? item.uploadedAt;
                            const id         = item.analysisId ?? item.id;

                            return (
                                <div key={id} className={styles.historyRow}>
                                    <div
                                        className={styles.historyRowHeader}
                                        onClick={() => setExpanded((prev) => prev === id ? null : id)}
                                    >
                    <span className={verdict === "REAL" ? styles.real : styles.fake}
                          style={{ fontWeight: 600 }}>
                      {verdict === "REAL" ? <><CheckCircle size={16} className="icon" /> REAL</> : <><AlertTriangle size={16} className="icon" /> FAKE</>}
                    </span>
                                        <span style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>{filename}</span>
                                        <span style={{ color: "#475569", fontSize: "0.8rem", marginLeft: "auto" }}>
                      {analyzedAt ? new Date(analyzedAt).toLocaleString() : "—"}
                    </span>
                                        <span style={{ color: "#64748b" }}>
                      {expandedId === id ? "▲" : "▼"}
                    </span>
                                    </div>
                                    {expandedId === id && <ResultCard result={item} />}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </main>
    );
}
