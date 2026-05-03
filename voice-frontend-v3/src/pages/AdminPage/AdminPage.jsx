/**
 * AdminPage.jsx — User management table (ROLE_ADMIN only)
 * History button navigates to /admin/history/:username
 */

import { useEffect, useCallback, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useNavigate } from "react-router-dom";
import * as usersApi from "../../api/usersApi.js";
import styles from "./AdminPage.module.css";
import ErrorBanner from "../../components/ErrorBanner.jsx";
import LoadingState from "../../components/LoadingState.jsx";
const INITIAL_FORM = { username: "", email: "", password: "", role: "ROLE_USER" };

export default function AdminPage() {
  const { user: me } = useAuth();
  const navigate     = useNavigate();
  const { loading, error, setError, run } = useAsync();

  const [users,       setUsers]       = useState([]);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [createState, setCreateState] = useState({ visible: false, form: INITIAL_FORM, saving: false });
  const [editState,   setEditState]   = useState({ user: null, form: {}, saving: false });

  // ── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      const data = await run(() => usersApi.getAll());
      setUsers(data);
    } catch {
      // error handled by run
    }
  }, [run]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Create user ────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateState((s) => ({ ...s, saving: true }));
    setError(null);
    try {
      const newUser = await usersApi.create({
        username: createState.form.username,
        email:    createState.form.email,
        password: createState.form.password,
        roles:    [],
      });
      setUsers((prev) => [...prev, newUser]);
      setCreateState({ visible: false, form: INITIAL_FORM, saving: false });
    } catch (err) {
      setError(err.message);
      setCreateState((s) => ({ ...s, saving: false }));
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
    setEditState({ user: u, form: { email: u.email, role: u.roles?.[0] ?? "ROLE_USER" }, saving: false });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setEditState((s) => ({ ...s, saving: true }));
    setError(null);
    try {
      const updated = await usersApi.update(editState.user.id, {
        ...editState.user,
        email: editState.form.email,
        roles: editState.user.roles,
      });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditState({ user: null, form: {}, saving: false });
    } catch (err) {
      setError(err.message);
      setEditState((s) => ({ ...s, saving: false }));
    }
  };

  const handleFormChange = (e) =>
    setCreateState((s) => ({ ...s, form: { ...s.form, [e.target.name]: e.target.value } }));
  const handleEditChange = (e) =>
    setEditState((s) => ({ ...s, form: { ...s.form, [e.target.name]: e.target.value } }));

  return (
      <main className={styles.page}>
        <div className={styles.container}>

          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.heading}>Admin Panel</h1>
            </div>
            <button className={styles.newUserBtn} onClick={() => setCreateState((s) => ({ ...s, visible: !s.visible }))}>
              {createState.visible ? "Cancel" : "+ New User"}
            </button>
          </div>

          <ErrorBanner message={error} />

          {/* ── Create user form ────────────────────────────────────────────── */}
          {createState.visible && (
              <form className={styles.createForm} onSubmit={handleCreate}>
                <h3 className={styles.formTitle}>Create New User</h3>
                <div className={styles.formGrid}>
                  <label className={styles.label}>Username
                    <input className={styles.input} name="username" value={createState.form.username}
                           onChange={handleFormChange} required autoFocus />
                  </label>
                  <label className={styles.label}>Email
                    <input className={styles.input} type="email" name="email" value={createState.form.email}
                           onChange={handleFormChange} required />
                  </label>
                  <label className={styles.label}>Password
                    <input className={styles.input} type="password" name="password" value={createState.form.password}
                           onChange={handleFormChange} required minLength={8} />
                  </label>
                  <label className={styles.label}>Role
                    <select className={styles.input} name="role" value={createState.form.role} onChange={handleFormChange}>
                      <option value="ROLE_USER">User</option>
                      <option value="ROLE_ADMIN">Admin</option>
                    </select>
                  </label>
                </div>
                <button className={styles.submitBtn} type="submit" disabled={createState.saving}>
                  {createState.saving ? "Creating…" : "Create User"}
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
          {editState.user && (
              <div className={styles.modalOverlay} onClick={() => setEditState({ user: null, form: {}, saving: false })}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <h3 className={styles.modalTitle}>Edit — {editState.user.username}</h3>
                  <form onSubmit={handleSave}>
                    <label className={styles.label}>Email
                      <input className={styles.input} type="email" name="email"
                             value={editState.form.email} onChange={handleEditChange} required />
                    </label>
                    <label className={styles.label}>Role
                      <select className={styles.input} name="role" value={editState.form.role} onChange={handleEditChange}>
                        <option value="ROLE_USER">User</option>
                        <option value="ROLE_ADMIN">Admin</option>
                      </select>
                    </label>
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.cancelBtn} onClick={() => setEditState({ user: null, form: {}, saving: false })}>
                        Cancel
                      </button>
                      <button type="submit" className={styles.submitBtn} disabled={editState.saving}>
                        {editState.saving ? "Saving…" : "Save Changes"}
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
