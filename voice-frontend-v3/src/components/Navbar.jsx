import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Mic } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}><Mic size={16} className="icon" /></span>
        <span className={styles.brandText}>VOICE</span>
        <span className={styles.brandSub}>Detection System</span>
      </div>

      <div className={styles.links}>
        <NavLink to="/home"        className={linkClass}>Home</NavLink>
          <NavLink to="/stats"      className={linkClass}>Stats</NavLink>
          <NavLink to="/stats/live" className={linkClass}>Live</NavLink>
          {user && <NavLink to="/upload"  className={linkClass}>Upload</NavLink>}
        {user && <NavLink to="/history" className={linkClass}>History</NavLink>}
        {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
      </div>

      <div className={styles.user}>
        {user ? (
          <>
            <span className={styles.username}>{user.username}</span>
            {isAdmin && <span className={styles.badge}>ADMIN</span>}
            <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <NavLink to="/login"    className={styles.signInBtn}>Sign In</NavLink>
            <NavLink to="/register" className={styles.registerBtn}>Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
