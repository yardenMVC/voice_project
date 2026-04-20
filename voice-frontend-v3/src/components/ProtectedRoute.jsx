/**
 * ProtectedRoute.jsx — Blocks unauthenticated access
 *
 * If there is no user in AuthContext (i.e., no valid JWT in memory),
 * we redirect to /login.  React Router's `replace` means the login page
 * does not appear in the browser history, so pressing Back does not
 * return the user to a broken protected page.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * AdminRoute.jsx — Blocks non-admin access
 *
 * Two-stage check:
 *   1. Not logged in → redirect to /login
 *   2. Logged in but not ADMIN → redirect to / (home)
 * This prevents a regular user from accidentally reaching /admin
 * even if they type the URL manually.
 */
export function AdminRoute() {
  const { user, isAdmin } = useAuth();
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/"      replace />;
  return <Outlet />;
}
