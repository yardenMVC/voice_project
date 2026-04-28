real_13f4y_404/**
 * AdminPage.jsx — User management table (ROLE_ADMIN only)
 * History button navigates to /admin/history/:username
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import * as usersApi from "../api/usersApi";
import styles from "./AdminPage.module.css";
import ErrorBanner from "../components/ErrorBanner";
import LoadingState from "../components/LoadingState";

const INITIAL_FORM = { username: "", email: "", password: "", role: "ROLE_USER" };

export default function AdminPage() {
  const { user: me } = useAuth();
  const navigate     = useNavigate();

  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [creating,    setCreating]    = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [editUser,    setEditUser]    = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);

  // ── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Create user ────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const newUser = await usersApi.create({
        username: form.username,
        email:    form.email,
        password: form.password,
        roles:    [],
      });
      setUsers((prev) => [...prev, newUser]);
      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setDeletingIds((s) => new Set(s).add(id));
    try {
      await usersApi.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message);
      setDeletingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  // ── Edit user ──────────────────────────────────────────────────────────────
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ email: u.email, role: u.roles?.[0] ?? "ROLE_USER" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await usersApi.update(editUser.id, {
        ...editUser,
        email: editForm.email,
        roles: editUser.roles,
      });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (e) => setForm((prev)     => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
      <main className={styles.page}>
        <div className={styles.container}>

          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.heading}>Admin Panel</h1>
              <p className={styles.sub}>User management — server enforces ROLE_ADMIN on every request</p>
            </div>
            <button className={styles.newUserBtn} onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ New User"}
            </button>
          </div>

          <ErrorBanner message={error} />

          {/* ── Create user form ────────────────────────────────────────────── */}
          {showForm && (
              <form className={styles.createForm} onSubmit={handleCreate}>
                <h3 className={styles.formTitle}>Create New User</h3>
                <div className={styles.formGrid}>
                  <label className={styles.label}>Username
                    <input className={styles.input} name="username" value={form.username}
                           onChange={handleFormChange} required autoFocus />
                  </label>
                  <label className={styles.label}>Email
                    <input className={styles.input} type="email" name="email" value={form.email}
                           onChange={handleFormChange} required />
                  </label>
                  <label className={styles.label}>Password
                    <input className={styles.input} type="password" name="password" value={form.password}
                           onChange={handleFormChange} required minLength={8} />
                  </label>
                  <label className={styles.label}>Role
                    <select className={styles.input} name="role" value={form.role} onChange={handleFormChange}>
                      <option value="ROLE_USER">User</option>
                      <option value="ROLE_ADMIN">Admin</option>
                    </select>
                  </label>
                </div>
                <button className={styles.submitBtn} type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create User"}
                </button>
              </form>
          )}

          {/* ── Users table ─────────────────────────────────────────────────── */}
          {loading ? (
              <LoadingState message="Loading users…" />
          ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Analyses</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {users.map((u) => {
                    const isMe     = u.username === me?.username;
                    const deleting = deletingIds.has(u.id);
                    return (
                        <tr key={u.id}
                            className={`${deleting ? styles.deletingRow : ""} ${isMe ? styles.meRow : ""}`}
                        >
                          <td className={styles.usernameCell}>
                            {u.username}
                            {isMe && <span className={styles.youBadge}>you</span>}
                          </td>
                          <td className={styles.emailCell}>{u.email}</td>
                          <td>
                            {(u.roles || []).map((r) => (
                                <span key={r?.roleName ?? r}
                                      className={`${styles.roleBadge} ${r?.roleName === "ADMIN" ? styles.adminBadge : styles.userBadge}`}>
                            {r?.roleName === "ADMIN" ? "Admin" : "User"}
                          </span>
                            ))}
                          </td>
                          <td className={styles.countCell}>{u.analysisCount ?? "—"}</td>
                          <td className={styles.dateCell}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className={styles.actionsCell}>
                            <button className={styles.editBtn}
                                    onClick={() => openEdit(u)}
                                    title="Edit user">
                              Edit
                            </button>
                            <button className={styles.historyBtn}
                                    onClick={() => navigate(`/admin/history/${u.username}`)}
                                    title="View analyses">
                              History
                            </button>
                            <button className={styles.deleteBtn}
                                    onClick={() => handleDelete(u.id)}
                                    disabled={isMe || deleting}
                                    title={isMe ? "Cannot delete yourself" : "Delete user"}>
                              {deleting ? "…" : "Delete"}
                            </button>
                          </td>
                        </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
          )}

          {/* ── Edit user modal ──────────────────────────────────────────────── */}
          {editUser && (
              <div className={styles.modalOverlay} onClick={() => setEditUser(null)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <h3 className={styles.modalTitle}>Edit — {editUser.username}</h3>
                  <form onSubmit={handleSave}>
                    <label className={styles.label}>Email
                      <input className={styles.input} type="email" name="email"
                             value={editForm.email} onChange={handleEditChange} required />
                    </label>
                    <label className={styles.label}>Role
                      <select className={styles.input} name="role" value={editForm.role} onChange={handleEditChange}>
                        <option value="ROLE_USER">User</option>
                        <option value="ROLE_ADMIN">Admin</option>
                      </select>
                    </label>
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.cancelBtn} onClick={() => setEditUser(null)}>
                        Cancel
                      </button>
                      <button type="submit" className={styles.submitBtn} disabled={saving}>
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          )}

        </div>
      </main>
  );
}