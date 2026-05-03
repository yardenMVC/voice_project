/**
 * LoginPage.jsx
 *
 * Responsibilities:
 *   - Collect username + password
 *   - Delegate auth to useAuth().login (which calls authApi → apiFetch → backend)
 *   - Redirect to / on success
 *   - Show server-returned error message on failure (never expose stack traces)
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Mic } from "lucide-react";
import styles from "./Auth.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ username: "", password: "" });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}><Mic size={16} className="icon" /></span>
          <h1 className={styles.logoText}>VOICE</h1>
          <p className={styles.logoSub}>Voice Authenticity Detection System</p>
        </div>

        <h2 className={styles.title}>Sign In</h2>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.label}>
            Username
            <input
              className={styles.input}
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
              autoFocus
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
