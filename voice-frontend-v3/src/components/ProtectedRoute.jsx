import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
// חשוב: הייבוא הזה חייב להיות מדויק כדי שהשגיאה האדומה תיעלם
import LoadingState from "./LoadingState";

/**
 * ProtectedRoute — מגן על דפים למשתמשים מחוברים בלבד
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  // אם המערכת עדיין בודקת את הטוקן ב-LocalStorage
  if (loading) {
    return <LoadingState message="Restoring session..." />;
  }

  // רק אם הבדיקה הסתיימה ואין משתמש - מעבירים ל-Login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * AdminRoute — מגן על דפי ניהול (Admin) בלבד
 */
export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Checking permissions..." />;
  }

  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/"      replace />;

  return <Outlet />;
}