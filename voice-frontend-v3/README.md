# VOICE Frontend — Engineering Documentation

> Voice Authenticity Detection System  
> Stack: React 18 · React Router v6 · Vite · CSS Modules  
> Backend: Spring Boot on `http://localhost:8080`

---

## 1. Architecture Overview

```
Browser
  └── React SPA (port 3000)
        ├── AuthContext   ← JWT lives HERE only (in-memory)
        ├── API Layer     ← all HTTP goes through one function: apiFetch()
        └── Route Guards  ← ProtectedRoute, AdminRoute
              └── Pages   ← Upload, History, Admin
                    └── Hooks  ← useAuth, useAnalysis
```

The fundamental rule: **no component ever calls `fetch` directly**.  
Every HTTP request travels through `src/api/client.js → apiFetch()`.

---

## 2. Security Model

### 2.1 JWT Storage Strategy

| Storage location | Accessible to XSS? | Survives tab close? | Used here? |
|------------------|--------------------|---------------------|------------|
| `localStorage`   | ✅ YES (dangerous) | ✅ yes              | ❌ NO      |
| `sessionStorage` | ✅ YES (dangerous) | ❌ no               | ❌ NO      |
| `httpOnly cookie`| ❌ no              | configurable        | optional   |
| **JS module var**| **❌ no**          | **❌ no**           | **✅ YES** |

The token is stored as a module-level variable in `src/api/client.js`:

```js
let accessToken = null;          // closure: not on window, not in DOM storage
export const setToken  = (t) => { accessToken = t; };
export const clearToken = () => { accessToken = null; };
```

An XSS payload that runs `window.localStorage.getItem("token")` gets nothing.  
The token is wiped automatically when the tab closes (no persistent state).

### 2.2 Token Parsing (Client Side)

We decode the JWT payload on the client to extract `username` and `roles`:

```js
function parseToken(token) {
  const payload = token.split(".")[1];              // middle segment
  const json    = atob(payload.replace(/-/g,"+").replace(/_/g,"/")); // base64url → base64
  return JSON.parse(json);
}
```

**We do NOT verify the signature here.**  
Signature verification requires the secret key and belongs exclusively on the server.  
The client reads roles only to make UI routing decisions (show/hide links).  
The server re-verifies the full JWT on every protected endpoint — that is the authoritative check.

### 2.3 Route Guard Layers

```
AdminPage
  └── AdminRoute              ← checks: user exists AND roles.includes("ROLE_ADMIN")
        └── ProtectedRoute    ← checks: user exists in AuthContext

UploadPage / HistoryPage
  └── ProtectedRoute          ← checks: user exists
```

If a user manually types `/admin` in the browser URL bar:
- `AdminRoute` sees `isAdmin === false` → redirect to `/`
- Even if they bypassed the JS guard, the server returns 403 on every `/api/users/*` call because the JWT payload lacks `ROLE_ADMIN`

**Defence in depth: two independent guards (JS + server).**

### 2.4 401 Handling

Every `apiFetch()` call checks the HTTP response status:

```js
if (res.status === 401) {
  clearToken();                       // wipe in-memory JWT immediately
  window.location.href = "/login";    // hard redirect — clears React state too
  return;
}
```

A 401 means the token has expired or been revoked on the server.  
We force a hard redirect (not `navigate()`) to guarantee React state is fully reset.

---

## 3. Data Flow: Audio Upload → Verdict

This is the core feature. The full path from user action to result display:

```
1. User drops/selects file (UploadPage.jsx)
         ↓
2. validateAudioFile(file)             ← client-side: type + size check
   - Accepted: WAV, MP3, FLAC, OGG
   - Max size: 10 MB
   - Throws immediately if invalid → no network round-trip wasted
         ↓
3. POST /api/analysis/upload           ← FormData, Authorization: Bearer <token>
   Headers: DO NOT set Content-Type manually for FormData.
            Browser sets it automatically with the correct multipart boundary.
         ↓
4. Backend pipeline (Spring Boot):
   a. librosa extracts 8 features from the audio signal
   b. Autoencoder: compress → reconstruct → measure Reconstruction Error
   c. RBM: score against learned real-voice statistical distribution
   d. Soft Voting: weight both scores by historical model performance
   e. Return verdict: { "REAL" | "FAKE", confidence, autoencoderError, rbmError, features }
         ↓
5. useAnalysis.upload() receives the result:
   - setResult(data)                   ← triggers ResultCard re-render
   - setHistory(prev => [data, ...prev]) ← optimistic prepend (no second fetch needed)
         ↓
6. ResultCard renders:
   - Verdict banner (green REAL / red FAKE)
   - Confidence bar (soft-voting weighted score 0–100%)
   - Autoencoder Error  (raw reconstruction error value)
   - RBM Error          (free-energy score)
   - Feature table      (all 8 extracted values for auditability)
```

### Why show raw feature values?

Engineers and security auditors need to understand *why* the system reached its verdict.  
If Spectral Flatness is anomalously high, it might indicate background noise rather than synthesis artifacts — a human reviewer can flag the case for manual inspection.  
Showing the full feature breakdown makes every decision **auditable**.

---

## 4. State Management

We use React's built-in tools only — no Redux, no Zustand.

| What | Where | Why |
|------|-------|-----|
| Auth (user, JWT) | `AuthContext` + `useState` | Global, used by Navbar + guards + every API call |
| Upload state (loading, result, error) | `useAnalysis` hook | Feature-scoped, owned by UploadPage |
| History list | `useAnalysis` hook | Shared between UploadPage (optimistic append) and HistoryPage |
| Admin users list | `AdminPage` local `useState` | Admin-only, no need to share globally |

**Rule:** state lives at the lowest level that satisfies all consumers.  
`user` is global because Navbar, guards, and API all need it.  
`uploading` is local because only UploadPage renders the spinner.

---

## 5. API Layer Structure

```
src/api/
├── client.js       ← token store + apiFetch() + 401 redirect
├── authApi.js      ← /api/auth/*
├── analysisApi.js  ← /api/analysis/*  (+ client-side file validation)
└── usersApi.js     ← /api/users/*     (admin only)
```

**Why a dedicated API layer instead of inline fetch?**

1. **Single responsibility**: components describe *what to show*, hooks describe *what to do*, api files describe *how to reach the server*
2. **Token injection**: `apiFetch()` adds `Authorization: Bearer` to every request automatically — no component ever touches the token
3. **Error normalisation**: all errors are converted to `Error(message)` with a human-readable string from the server's JSON `{ message }` field — components never see raw HTTP errors or stack traces
4. **Testability**: you can mock `analysisApi.uploadAudio` in unit tests without mocking `fetch`

---

## 6. Component Responsibility Map

| Component | Single responsibility |
|-----------|-----------------------|
| `LoginPage` | Collect credentials, delegate to `useAuth().login`, redirect on success |
| `RegisterPage` | Client-side validation, call `authApi.register`, redirect to login |
| `UploadPage` | File selection UI + drag-drop, call `useAnalysis().upload`, render `ResultCard` |
| `HistoryPage` | Fetch history on mount, render rows with expand/collapse, call `deleteEntry` |
| `AdminPage` | Fetch + render users table, create user form, delete with confirmation |
| `ResultCard` | Pure display: verdict, confidence, model scores, feature table |
| `Navbar` | Auth-aware navigation links + logout button |
| `ProtectedRoute` | Redirect to `/login` if no user |
| `AdminRoute` | Redirect to `/` if not admin |

---

## 7. Form Validation Strategy

Client-side validation is **a UX optimisation, not a security control**.

```
RegisterPage client checks:
  username: /^[a-zA-Z0-9_]{3,30}$/
  email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  password: length >= 8
  confirm:  must match password

analysisApi client checks:
  file.type: must be in ALLOWED_TYPES array
  file.size: must be <= 10 MB (10 * 1024 * 1024 bytes)
```

If a check fails, the user gets instant feedback without waiting for a network round-trip.  
The server runs the same checks independently — so even if the JS validation is bypassed, the backend rejects invalid input.

---

## 8. File/Folder Conventions

- **CSS Modules**: every component/page has a co-located `.module.css` file. Class names are locally scoped — no global CSS collisions.
- **No default exports from hooks**: `useAuth.js` uses named export `export function useAuth()` so imports are explicit.
- **Env vars**: all environment-specific values (backend URL) live in `.env.local`, prefixed with `VITE_` so Vite inlines them at build time. Never commit `.env.local`.

---

## 9. Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Configure backend URL (optional — defaults to localhost:8080)
cp .env.example .env.local

# 3. Start dev server (hot-reload, proxy /api/* to :8080)
npm run dev          # → http://localhost:3000

# 4. Production build
npm run build        # → dist/
npm run preview      # preview production build locally
```

### Dev proxy

`vite.config.js` proxies all `/api/*` requests to `http://localhost:8080` during development.  
This avoids CORS issues without changing backend config.  
In production, configure your nginx/caddy reverse proxy to do the same.

---

## 10. Dependency Rationale

| Package | Version | Why |
|---------|---------|-----|
| `react` | 18 | Concurrent features, automatic batching |
| `react-dom` | 18 | DOM renderer |
| `react-router-dom` | 6 | Declarative client-side routing, `<Outlet>` for nested guards |
| `vite` | 5 | Fast HMR, native ESM, ~3s production build |
| `@vitejs/plugin-react` | 4 | JSX transform + React Fast Refresh |

**No state management library** (Redux / Zustand / Jotai) — Context + useState is sufficient for this scope.  
**No HTTP library** (axios) — the native `fetch` API is enough; `apiFetch()` provides the same conveniences (base URL, headers, error parsing).  
**No component library** (MUI / Ant Design) — custom CSS Modules give full control over the visual design and keep the bundle small (~62 KB gzipped).
