/**
 * LoadingState.jsx — Shared loading indicator.
 * Used in HistoryPage, StatsPage, and AdminPage.
 */

export default function LoadingState({ message = "Loading…" }) {
    return (
        <div style={{
            color: "#475569",
            fontSize: "0.95rem",
            padding: "3rem",
            textAlign: "center",
        }}>
            {message}
        </div>
    );
}