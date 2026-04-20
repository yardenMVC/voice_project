/**
 * usersApi.js — User management (ADMIN role only)
 *
 * All routes under /api/users are protected on the server by ROLE_ADMIN.
 * The frontend also guards them via AdminRoute, but that is UX — the server
 * is the authoritative gatekeeper.
 */

import { apiFetch } from "./client";
import { mockUsers } from "./mockApi";

const MOCK = import.meta.env.VITE_MOCK === "true";
export const getAll  = ()        => MOCK ? mockUsers.getAll()        : apiFetch("/api/users");
export const getById = (id)      => MOCK ? mockUsers.getById(id)     : apiFetch(`/api/users/${id}`);
export const create  = (dto)     => MOCK ? mockUsers.create(dto)     : apiFetch("/api/users", { method: "POST", body: JSON.stringify(dto) });
export const update  = (id, dto) => MOCK ? mockUsers.update(id, dto) : apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(dto) });
export const remove  = (id)      => MOCK ? mockUsers.remove(id)      : apiFetch(`/api/users/${id}`, { method: "DELETE" });
