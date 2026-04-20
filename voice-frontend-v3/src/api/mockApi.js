/**
 * mockApi.js — Fake backend for frontend-only testing
 *
 * Simulates real server responses with realistic delays.
 * Activated when VITE_MOCK=true in .env.local
 *
 * Test credentials:
 *   user  / password123  → ROLE_USER
 *   admin / password123  → ROLE_ADMIN
 */

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const makeToken = (username, roles) => {
  const payload = btoa(JSON.stringify({ sub: username, roles, exp: 9999999999 }));
  return `fake.${payload}.signature`;
};

const USERS = [
  { id: 1, username: "admin",   email: "admin@voice.dev",   roles: ["ROLE_ADMIN"], analysisCount: 12, createdAt: "2026-01-01T00:00:00Z" },
  { id: 2, username: "user",    email: "user@example.com",  roles: ["ROLE_USER"],  analysisCount: 7,  createdAt: "2026-02-15T00:00:00Z" },
  { id: 3, username: "sarah_m", email: "sarah@example.com", roles: ["ROLE_USER"],  analysisCount: 23, createdAt: "2026-02-20T00:00:00Z" },
];

let nextId = 10;

// ── Active features metadata — matches AnalysisResponse.ActiveFeatures ────────
// AE features (30): all Deltas + Energy_RMS + MFCC_1, MFCC_5, MFCC_10
// RBM features (19): selected MFCCs + physiological + some Deltas
// Selected via KS statistic

const AE_SET = new Set([
  "Delta_1","Delta_2","Delta_3","Delta_4","Delta_5","Delta_6","Delta_7",
  "Delta_8","Delta_9","Delta_10","Delta_11","Delta_12","Delta_13",
  "Delta2_1","Delta2_2","Delta2_3","Delta2_4","Delta2_5","Delta2_6",
  "Delta2_7","Delta2_8","Delta2_9","Delta2_10","Delta2_11","Delta2_12","Delta2_13",
  "Energy_RMS","MFCC_1","MFCC_10","MFCC_5",
]);

const RBM_SET = new Set([
  "Delta_1","MFCC_10","Shimmer","MFCC_5","MFCC_8","Spectral_Contrast",
  "Delta_5","SNR","Delta_3","MFCC_12","Delta2_1","Delta_10","MFCC_1",
  "Delta_8","Delta_12","MFCC_7","Jitter","Energy_RMS","Delta2_2",
]);

const ALL_52 = [
  "MFCC_1","MFCC_2","MFCC_3","MFCC_4","MFCC_5","MFCC_6","MFCC_7","MFCC_8",
  "MFCC_9","MFCC_10","MFCC_11","MFCC_12","MFCC_13",
  "Delta_1","Delta_2","Delta_3","Delta_4","Delta_5","Delta_6","Delta_7",
  "Delta_8","Delta_9","Delta_10","Delta_11","Delta_12","Delta_13",
  "Delta2_1","Delta2_2","Delta2_3","Delta2_4","Delta2_5","Delta2_6",
  "Delta2_7","Delta2_8","Delta2_9","Delta2_10","Delta2_11","Delta2_12","Delta2_13",
  "Mel_Mean","Mel_Std","Mel_Max",
  "Pitch_Mean_Norm","Pitch_Std_Norm","Pitch_Median_Norm",
  "Jitter","Shimmer",
  "Spectral_Flatness","Spectral_Contrast",
  "Energy_RMS","Reverberation","SNR",
];

const ACTIVE_FEATURES_META = (() => {
  const result = [];
  ALL_52.forEach((name, index) => {
    const inAe  = AE_SET.has(name);
    const inRbm = RBM_SET.has(name);
    if (!inAe && !inRbm) return;
    const activeIn = [];
    if (inAe)  activeIn.push("AE");
    if (inRbm) activeIn.push("RBM");
    result.push({ name, index, activeIn });
  });
  return result;
})();

const MOCK_ACTIVE_FEATURES = {
  totalExtracted:  52,
  aeCount:         30,
  rbmCount:        19,
  selectionMethod: "KS statistic",
  features:        ACTIVE_FEATURES_META,
};

// ── Feature vector (52 raw values) ────────────────────────────────────────────
function makeFeaturesVector(isFake) {
  const out = {};
  ALL_52.forEach((name) => {
    const isActive = AE_SET.has(name) || RBM_SET.has(name);
    out[name] = parseFloat((
        isActive
            ? (isFake ? 0.45 + Math.random() * 0.5 : 0.05 + Math.random() * 0.35)
            : Math.random() * 0.15
    ).toFixed(4));
  });
  return out;
}

const THRESHOLD = 0.30;

const HISTORY = [
  {
    analysisId: 1,
    originalFilename: "sample_voice_clip.wav",
    analyzedAt: "2026-04-02T18:45:00Z",
    finalPrediction: "FAKE",
    threshold: 0.30,
    autoencoderScore: 0.8427,
    rbmScore: 0.7103,
    ensembleScore: 0.7837,
    processingTimeMs: 1320,
    featuresVector: makeFeaturesVector(true),
    activeFeatures: MOCK_ACTIVE_FEATURES,
  },
  {
    analysisId: 2,
    originalFilename: "interview_recording.mp3",
    analyzedAt: "2026-04-01T11:22:00Z",
    finalPrediction: "REAL",
    threshold: 0.30,
    autoencoderScore: 0.0394,
    rbmScore: 0.0412,
    ensembleScore: 0.0402,
    processingTimeMs: 1105,
    featuresVector: makeFeaturesVector(false),
    activeFeatures: MOCK_ACTIVE_FEATURES,
  },
];

// ── Auth ──────────────────────────────────────────────────────────────────────
export const mockAuth = {
  login: async (username, password) => {
    await delay(600);
    const u = USERS.find((u) => u.username === username);
    if (!u || password !== "password123")
      throw new Error("Invalid username or password");
    return { accessToken: makeToken(u.username, u.roles) };
  },
  register: async (username, email, password) => {
    await delay(700);
    if (USERS.find((u) => u.username === username))
      throw new Error("Username already taken");
    USERS.push({
      id: nextId++, username, email,
      roles: ["ROLE_USER"], analysisCount: 0,
      createdAt: new Date().toISOString(),
    });
    return { message: "User created successfully" };
  },
  logout:  async () => { await delay(200); return null; },
  refresh: async () => { throw new Error("Mock: use login"); },
};

// ── Analysis ──────────────────────────────────────────────────────────────────
export const mockAnalysis = {
  uploadAudio: async (file) => {
    await delay(2200);
    const isFake   = Math.random() > 0.45;
    const aeScore  = isFake
        ? parseFloat((0.55 + Math.random() * 0.4).toFixed(4))
        : parseFloat((0.02 + Math.random() * 0.12).toFixed(4));
    const rbmScore = isFake
        ? parseFloat((0.5  + Math.random() * 0.45).toFixed(4))
        : parseFloat((0.03 + Math.random() * 0.1).toFixed(4));
    const ensemble = parseFloat((aeScore * 0.8 + rbmScore * 0.2).toFixed(4));

    const result = {
      analysisId:       nextId++,
      originalFilename: file.name,
      analyzedAt:       new Date().toISOString(),
      finalPrediction:  ensemble > THRESHOLD ? "FAKE" : "REAL",
      threshold:        THRESHOLD,
      autoencoderScore: aeScore,
      rbmScore,
      ensembleScore:    ensemble,
      processingTimeMs: Math.floor(900 + Math.random() * 800),
      featuresVector:   makeFeaturesVector(isFake),
      activeFeatures:   MOCK_ACTIVE_FEATURES,
    };
    HISTORY.unshift(result);
    return result;
  },

  getHistory:     async ()  => { await delay(400); return [...HISTORY]; },
  getById:        async (id) => { await delay(300); return HISTORY.find((h) => h.analysisId === Number(id)); },
  deleteAnalysis: async (id) => {
    await delay(300);
    const i = HISTORY.findIndex((h) => h.analysisId === Number(id));
    if (i !== -1) HISTORY.splice(i, 1);
    return null;
  },
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const mockUsers = {
  getAll:  async ()        => { await delay(400); return [...USERS]; },
  getById: async (id)      => { await delay(200); return USERS.find((u) => u.id === Number(id)); },
  create:  async (dto)     => {
    await delay(500);
    if (USERS.find((u) => u.username === dto.username))
      throw new Error("Username already taken");
    const u = { id: nextId++, ...dto, roles: dto.roles || ["ROLE_USER"], analysisCount: 0, createdAt: new Date().toISOString() };
    USERS.push(u);
    return u;
  },
  update:  async (id, dto) => { await delay(400); return { id, ...dto }; },
  remove:  async (id)      => {
    await delay(300);
    const i = USERS.findIndex((u) => u.id === Number(id));
    if (i !== -1) USERS.splice(i, 1);
    return null;
  },
};