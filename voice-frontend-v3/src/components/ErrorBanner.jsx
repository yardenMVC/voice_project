/**
 * ErrorBanner.jsx — Shared error display component.
 * Used across all pages that show error messages.
 */

export default function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
        }}>
            ⚠️ {message}
        </div>
    );
}