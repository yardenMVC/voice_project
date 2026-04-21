import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import HomePage        from "./pages/HomePage";
import AboutPage       from "./pages/AboutPage";
import HowItWorksPage  from "./pages/HowItWorksPage";
import StatsPage       from "./pages/StatsPage";
import UserGuidePage   from "./pages/UserGuidePage";
import LoginPage       from "./pages/LoginPage";
import RegisterPage    from "./pages/RegisterPage";
import UploadPage      from "./pages/UploadPage";
import HistoryPage     from "./pages/HistoryPage";
import AdminPage       from "./pages/AdminPage";

export default function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* ── Public ──────────────────────────────────────────────── */}
            <Route path="/home"         element={<HomePage />} />
            <Route path="/about"        element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/stats"        element={<StatsPage />} />
            <Route path="/user-guide"   element={<UserGuidePage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/register"     element={<RegisterPage />} />

            {/* ── Protected — any authenticated user ──────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/upload"  element={<UploadPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>

            {/* ── Protected — ROLE_ADMIN only ─────────────────────────── */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            {/* ── Default redirect ────────────────────────────────────── */}
            <Route path="/"  element={<Navigate to="/home" replace />} />
            <Route path="*"  element={<Navigate to="/home" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
  );
}