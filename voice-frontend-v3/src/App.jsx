import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import HomePage             from "./pages/HomePage/HomePage.jsx";
import ModelStatsPage       from "./pages/ModelstatsPage/Modelstatspage.jsx";
import LiveStatsPage        from "./pages/LivestatsPage/Livestatspage.jsx";
import LoginPage            from "./pages/LoginPage";
import RegisterPage         from "./pages/RegisterPage";
import UploadPage           from "./pages/UploadPage";
import HistoryPage          from "./pages/HistoryPage/HistoryPage.jsx";
import AdminPage            from "./pages/AdminPage/AdminPage.jsx";
import AdminUserHistoryPage from "./pages/AdminhistoryPage/Adminuserhistorypage.jsx";

export default function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* ── Public ──────────────────────────────────────────────── */}
            <Route path="/home"         element={<HomePage />} />
            <Route path="/stats"        element={<ModelStatsPage />} />
            <Route path="/stats/live"   element={<LiveStatsPage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/register"     element={<RegisterPage />} />

            {/* ── Protected — any authenticated user ──────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/upload"  element={<UploadPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>

            {/* ── Protected — ROLE_ADMIN only ─────────────────────────── */}
            <Route element={<AdminRoute />}>
              <Route path="/admin"                   element={<AdminPage />} />
              <Route path="/admin/history/:username" element={<AdminUserHistoryPage />} />
            </Route>

            {/* ── Default redirect ────────────────────────────────────── */}
            <Route path="/"  element={<Navigate to="/home" replace />} />
            <Route path="*"  element={<Navigate to="/home" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
  );
}