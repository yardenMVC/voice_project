/**
 * useAuth.js — Convenience wrapper around AuthContext
 *
 * Separating the hook from the context file means consumers never need to
 * import AuthContext directly, which keeps the import graph clean.
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
