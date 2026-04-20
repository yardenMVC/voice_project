/**
 * RegisterPage.jsx
 *
 * Client-side rules enforced before the POST is sent:
 *   - username: 3–30 alphanumeric chars
 *   - email: basic format check
 *   - password: minimum 8 chars
 *   - confirmPassword: must match
 * Server re-validates all of these; client checks save the user a round-trip.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as authApi from "../api/authApi";
import styles from "./Auth.module.css";

const INITIAL = { username: "", email: "", password: "", confirmPassword: "" };

function validate(form) {
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username))
    return "Username must be 3–30 alphanumeric characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return "Please enter a valid email address";
  if (form.password.length < 8)
    return "Password must be at least 8 characters";
  if (form.password !== form.confirmPassword)
    return "Passwords do not match";
  return null;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form,    setForm]    = useState(INITIAL);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }

    setError(null);
    setLoading(true);
    try {
      await authApi.register(form.username, form.email, form.password);
      // After registration redirect to login — user must sign in explicitly
      navigate("/login", { state: { registered: true }, replace: true });
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
          <span className={styles.logoIcon}>🎙️</span>
          <h1 className={styles.logoText}>VOICE</h1>
          <p className={styles.logoSub}>Voice Authenticity Detection System</p>
        </div>

        <h2 className={styles.title}>Create Account</h2>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.label}>
            Username
            <input className={styles.input} type="text" name="username"
              value={form.username} onChange={handleChange}
              autoComplete="username" required autoFocus />
          </label>

          <label className={styles.label}>
            Email
            <input className={styles.input} type="email" name="email"
              value={form.email} onChange={handleChange}
              autoComplete="email" required />
          </label>

          <label className={styles.label}>
            Password
            <input className={styles.input} type="password" name="password"
              value={form.password} onChange={handleChange}
              autoComplete="new-password" required />
          </label>

          <label className={styles.label}>
            Confirm Password
            <input className={styles.input} type="password" name="confirmPassword"
              value={form.confirmPassword} onChange={handleChange}
              autoComplete="new-password" required />
          </label>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
