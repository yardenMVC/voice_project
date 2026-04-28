/**
 * ErrorBanner.jsx — Shared error display component.
 */

import styles from "./ErrorBanner.module.css";

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" x2="12" y1="9" y2="13"/>
      <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
  );
}

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className={styles.banner}>
      <span className={styles.icon}><WarningIcon /></span>
      {message}
    </div>
  );
}
