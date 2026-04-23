import { createContext, useState, useCallback, useEffect } from "react";
import * as authApi from "../api/authApi";
import { setToken, clearToken, getToken } from "../api/client";

export const AuthContext = createContext(null);

/** פענוח Payload של JWT (לצרכי UI בלבד) */
function parseToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // שלב קריטי למניעת ניתוק ב-Refresh

  // פונקציית שחזור המשתמש מה-LocalStorage בטעינה ראשונה
  const initAuth = useCallback(() => {
    try {
      const token = getToken();
      if (token) {
        const payload = parseToken(token);
        if (payload) {
          setUser({
            username: payload.sub,
            roles: payload.roles || [],
          });
        }
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
    } finally {
      setLoading(false); // חובה להעביר ל-false כדי שהמסך יופיע
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    // שמירת הטוקנים ב-client (וב-LocalStorage דרכו)
    setToken(data.accessToken, data.refreshToken);

    const payload = parseToken(data.accessToken);
    const newUser = {
      username: payload?.sub || username,
      roles: payload?.roles || [],
    };
    setUser(newUser);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  // החלק הכי חשוב: ה-return שמנגיש את הנתונים לכל האפליקציה
  return (
      <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
        {children}
      </AuthContext.Provider>
  );
}