/**
 * LoadingState.jsx — Shared loading indicator.
 */

import styles from "./LoadingState.module.css";

export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className={styles.wrap}>{message}</div>
  );
}
