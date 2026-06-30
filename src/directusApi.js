const DIRECTUS_URL = (import.meta.env.VITE_DIRECTUS_URL ?? "").replace(/\/$/, "");
const USE_DIRECTUS = import.meta.env.VITE_USE_DIRECTUS === "true";
const REMOTE_DIRECTUS_ENABLED = Boolean(DIRECTUS_URL && USE_DIRECTUS);
const RUNTIME_SUPABASE_CONFIG = globalThis.window?.__SUPABASE_CONFIG__ ?? {};
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? RUNTIME_SUPABASE_CONFIG.url ?? "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? RUNTIME_SUPABASE_CONFIG.anonKey ?? "";
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const REMOTE_BACKEND_ENABLED = REMOTE_DIRECTUS_ENABLED || SUPABASE_ENABLED;
const PROJECT_ID = import.meta.env.VITE_PAGE_ID || "shared";
const STORAGE_PREFIX = `ai_service_${PROJECT_ID}`;
const LEGACY_SESSION_KEY = "ai_service_directus_session";
const SESSION_KEY = `${STORAGE_PREFIX}_session`;
const LOCAL_ACCOUNTS_KEY = `${STORAGE_PREFIX}_local_accounts`;
const LOCAL_ITEMS_KEY = `${STORAGE_PREFIX}_local_items`;
const LOCAL_FILES_KEY = `${STORAGE_PREFIX}_local_files`;
const LOCAL_DISPLAY_NAMES_KEY = `${STORAGE_PREFIX}_display_names`;

if (typeof window !== "undefined") {
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
}

export const isLocalMode = !REMOTE_BACKEND_ENABLED;

export const directusConfig = {
  url: REMOTE_DIRECTUS_ENABLED ? DIRECTUS_URL : SUPABASE_ENABLED ? SUPABASE_URL : "local-browser-mode",
  isConfigured: true,
  isLocalMode,
  provider: SUPABASE_ENABLED ? "supabase" : REMOTE_DIRECTUS_ENABLED ? "directus" : "local",
};

const leadCollections = {
  legal: {
    lawyer: "legal_consultations",
    booking: "legal_bookings",
    detail: "legal_cases",
  },
  beauty: {
    report: "beauty_reports",
    advisor: "beauty_advisor_requests",
    scan: "beauty_scan_results",
  },
  divination: {
    consult: "divination_consults",
    share: "divination_shares",
    spin: "divination_reports",
  },
};

const defaultListLimit = 20;

function requireDirectusUrl() {
  if (!REMOTE_DIRECTUS_ENABLED) {
    throw new Error("Backend is not configured for Directus mode.");
  }
}

function readError(payload, fallback) {
  return payload?.errors?.[0]?.message ?? payload?.error?.message ?? fallback;
}

async function directusRequest(path, { method = "GET", body, token } = {}) {
  requireDirectusUrl();
  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readError(payload, "Directus request failed."));
  }
  return payload?.data ?? payload;
}

async function supabaseRequest(path, { method = "GET", body, token, prefer } = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || "Supabase request failed.";
    throw new Error(message);
  }
  return payload;
}

function supabaseSessionFor(payload) {
  if (!payload?.access_token) return null;
  const firstName = resolveDisplayName(payload.user);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires: payload.expires_at ? payload.expires_at * 1000 : Date.now() + Number(payload.expires_in || 3600) * 1000,
    provider: "supabase",
    user: payload.user
      ? {
          id: payload.user.id,
          email: payload.user.email,
          first_name: firstName,
        }
      : undefined,
  };
}

function shapeSupabaseUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    first_name: resolveDisplayName(user),
    date_created: user.created_at,
  };
}

function readDisplayNames() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DISPLAY_NAMES_KEY) || "{}");
  } catch {
    return {};
  }
}

function rememberDisplayName(email, firstName) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const displayName = String(firstName || "").trim();
  if (!normalizedEmail || !displayName) return;
  localStorage.setItem(
    LOCAL_DISPLAY_NAMES_KEY,
    JSON.stringify({ ...readDisplayNames(), [normalizedEmail]: displayName })
  );
}

function resolveDisplayName(user) {
  const metadata = user?.user_metadata || {};
  const normalizedEmail = String(user?.email || "").trim().toLowerCase();
  return (
    metadata.first_name ||
    metadata.full_name ||
    metadata.name ||
    readDisplayNames()[normalizedEmail] ||
    ""
  );
}

async function getSupabaseUser(session = getStoredSession()) {
  if (!SUPABASE_ENABLED) return null;
  if (session?.user?.id) return session.user;
  if (!session?.access_token) return null;
  const user = await supabaseRequest("/auth/v1/user", { token: session.access_token });
  return shapeSupabaseUser(user);
}

function shapeSupabaseRecord(row) {
  const payload = row.payload || {};
  return {
    id: row.id,
    collection: row.collection,
    ...payload,
    status: row.status || payload.status,
    source_page: row.source_page,
    action_id: row.action_id,
    context: row.context,
    user_created: row.user_id,
    date_created: row.created_at,
    date_updated: row.updated_at,
    submitted_at: row.created_at,
  };
}

async function supabaseRegisterUser({ email, password, firstName }) {
  rememberDisplayName(email, firstName);
  await supabaseRequest("/auth/v1/signup", {
    method: "POST",
    body: {
      email,
      password,
      data: {
        first_name: String(firstName || "").trim(),
        full_name: String(firstName || "").trim(),
        name: String(firstName || "").trim(),
      },
    },
  });
}

async function supabaseLoginUser({ email, password }) {
  const payload = await supabaseRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });
  return storeSession(supabaseSessionFor(payload));
}

async function supabaseRefreshStoredSession(session = getStoredSession()) {
  if (!session?.refresh_token) return null;
  const payload = await supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: session.refresh_token },
  });
  return storeSession(supabaseSessionFor(payload));
}

async function supabaseLogout(session = getStoredSession()) {
  if (session?.access_token) {
    await supabaseRequest("/auth/v1/logout", {
      method: "POST",
      token: session.access_token,
    }).catch(() => null);
  }
  storeSession(null);
}

async function supabaseCreateRecord({ collection, values, pageId, actionId, context, session }) {
  const user = await getSupabaseUser(session);
  if (!user?.id) throw new Error("请先登录后再提交。");
  const [row] = await supabaseRequest("/rest/v1/service_records?select=*", {
    method: "POST",
    token: session.access_token,
    prefer: "return=representation",
    body: {
      user_id: user.id,
      collection,
      source_page: pageId,
      action_id: actionId,
      status: values.status || "new",
      payload: values,
      context,
    },
  });
  return shapeSupabaseRecord(row);
}

async function supabaseListRecords({ pageId, session, limit }) {
  const user = await getSupabaseUser(session);
  if (!user?.id) throw new Error("请先登录后再读取服务记录。");
  const collections = getPageCollections(pageId).join(",");
  const query = new URLSearchParams({
    select: "*",
    user_id: `eq.${user.id}`,
    source_page: `eq.${pageId}`,
    collection: `in.(${collections})`,
    order: "updated_at.desc",
    limit: String(limit),
  });
  const rows = await supabaseRequest(`/rest/v1/service_records?${query.toString()}`, {
    token: session.access_token,
  });
  return (rows ?? []).map(shapeSupabaseRecord);
}

async function supabaseReadRecord({ collection, id, session }) {
  const user = await getSupabaseUser(session);
  const query = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    collection: `eq.${collection}`,
    user_id: `eq.${user.id}`,
    limit: "1",
  });
  const rows = await supabaseRequest(`/rest/v1/service_records?${query.toString()}`, {
    token: session.access_token,
  });
  if (!rows?.[0]) throw new Error("没有找到这条记录。");
  return shapeSupabaseRecord(rows[0]);
}

async function supabaseUpdateRecord({ collection, id, values, session }) {
  const current = await supabaseReadRecord({ collection, id, session });
  const nextPayload = { ...current, ...values };
  const query = new URLSearchParams({
    id: `eq.${id}`,
    collection: `eq.${collection}`,
    select: "*",
  });
  const [row] = await supabaseRequest(`/rest/v1/service_records?${query.toString()}`, {
    method: "PATCH",
    token: session.access_token,
    prefer: "return=representation",
    body: {
      payload: nextPayload,
      status: values.status || current.status,
      updated_at: new Date().toISOString(),
    },
  });
  return shapeSupabaseRecord(row);
}

async function supabaseUploadFile({ file, metadata, session }) {
  const user = await getSupabaseUser(session);
  if (!user?.id) throw new Error("请先登录后再上传文件。");
  if (!file) throw new Error("请先选择要上传的文件。");
  const [row] = await supabaseRequest("/rest/v1/service_files?select=*", {
    method: "POST",
    token: session.access_token,
    prefer: "return=representation",
    body: {
      user_id: user.id,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      metadata,
    },
  });
  return {
    id: row.id,
    title: file.name,
    filename_download: file.name,
    type: file.type,
    filesize: file.size,
    metadata,
    date_created: row.created_at,
  };
}

function readLocalJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function makeId(prefix) {
  const random = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function encodeCredential(password) {
  return Array.from(new TextEncoder().encode(String(password || "")))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function localProfile(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    date_created: user.date_created,
  };
}

function localSessionFor(user) {
  return {
    access_token: `local-access-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
    local: true,
    local_user_id: user.id,
  };
}

function getLocalUserBySession(session = getStoredSession()) {
  if (!session?.local_user_id) return null;
  return readLocalJson(LOCAL_ACCOUNTS_KEY, []).find((user) => user.id === session.local_user_id) ?? null;
}

function requireLocalUser(session = getStoredSession()) {
  const user = getLocalUserBySession(session);
  if (!user) throw new Error("请先登录。");
  return user;
}

function localCreateItem({ collection, values, pageId, actionId, context, session }) {
  const user = requireLocalUser(session);
  const now = new Date().toISOString();
  const item = {
    id: makeId("item"),
    collection,
    ...values,
    source_page: pageId,
    action_id: actionId,
    context,
    consent_accepted: true,
    user_created: user.id,
    date_created: now,
    date_updated: now,
    submitted_at: now,
  };
  const items = readLocalJson(LOCAL_ITEMS_KEY, []);
  writeLocalJson(LOCAL_ITEMS_KEY, [item, ...items]);
  return item;
}

function localListItems({ pageId, session, userId, limit }) {
  const user = requireLocalUser(session);
  const collections = getPageCollections(pageId);
  return readLocalJson(LOCAL_ITEMS_KEY, [])
    .filter((item) => collections.includes(item.collection))
    .filter((item) => item.user_created === (userId || user.id))
    .sort((left, right) =>
      String(right.date_updated || right.date_created || "").localeCompare(String(left.date_updated || left.date_created || "")),
    )
    .slice(0, limit);
}

function localReadItem({ collection, id, session }) {
  const user = requireLocalUser(session);
  const item = readLocalJson(LOCAL_ITEMS_KEY, []).find((record) => record.collection === collection && record.id === id);
  if (!item || item.user_created !== user.id) throw new Error("记录不存在或无权访问。");
  return item;
}

function localUpdateItem({ collection, id, values, session }) {
  const user = requireLocalUser(session);
  const items = readLocalJson(LOCAL_ITEMS_KEY, []);
  const index = items.findIndex((record) => record.collection === collection && record.id === id && record.user_created === user.id);
  if (index === -1) throw new Error("记录不存在或无权修改。");
  const next = { ...items[index], ...values, date_updated: new Date().toISOString() };
  items[index] = next;
  writeLocalJson(LOCAL_ITEMS_KEY, items);
  return next;
}

function localUploadFile({ file, metadata, session }) {
  const user = requireLocalUser(session);
  const now = new Date().toISOString();
  const stored = {
    id: makeId("file"),
    title: file.name,
    filename_download: file.name,
    type: file.type,
    filesize: file.size,
    metadata,
    uploaded_by: user.id,
    date_created: now,
  };
  const files = readLocalJson(LOCAL_FILES_KEY, []);
  writeLocalJson(LOCAL_FILES_KEY, [stored, ...files]);
  return stored;
}

function buildLocalBeautyAnalysis(scan = {}) {
  const profile = scan.image_profile ?? {};
  const metricLabels = scan.metric_labels ?? {};
  const valueOf = (key, fallback = 0) => Number(profile[key] ?? fallback) || 0;
  const redness = valueOf("redness");
  const spotDensity = valueOf("spot_density");
  const texture = valueOf("texture");
  const oiliness = valueOf("oiliness");
  const hydration = valueOf("hydration_signal", scan.metrics?.hydration);
  const brightness = valueOf("brightness");

  const issues = [
    { key: "redness", label: "泛红敏感", value: redness, advice: "先减少刷酸、清洁面膜和高浓度功效叠加，优先做屏障修护。" },
    { key: "spot_density", label: "痘印斑点", value: spotDensity, advice: "痘印和色沉区域建议以防晒、抗氧化和温和淡印为主，避免反复刺激。" },
    { key: "texture", label: metricLabels.texture || "肤质纹理", value: texture, advice: "纹理起伏较明显时，先稳定清洁和保湿，再循序渐进改善角质代谢。" },
    { key: "oiliness", label: "油光毛孔", value: oiliness, advice: "油光和毛孔问题适合做控油、补水和规律清洁，不建议一次叠加过多功效产品。" },
    { key: "hydration", label: metricLabels.hydration || "含水稳定度", value: 100 - hydration, advice: "补水和锁水需要同时做，洁面后尽快叠加保湿修护类产品。" },
  ].sort((left, right) => right.value - left.value);

  const mainIssues = issues.filter((item) => item.value >= 38).slice(0, 3);
  const primary = mainIssues[0] ?? issues[0];
  const secondary = mainIssues[1] ?? issues[1];
  const brightnessNote =
    brightness > 68
      ? "整体亮度较高，但仍需注意防晒和屏障稳定。"
      : brightness < 42
        ? "面部整体亮度偏低，建议同步关注暗沉、色沉和作息影响。"
        : "整体亮度处于中等区间，重点看局部问题分布。";
  const summary = scan.face_photo_uploaded || profile.file_signature
    ? `本次照片研判显示，优先关注${primary.label}${secondary ? `和${secondary.label}` : ""}。${brightnessNote}建议先做基础修护，再按主要问题分层加入针对性护理。`
    : "当前为基础面诊结果；上传清晰正脸照片后，可根据泛红、痘印、毛孔、油光和纹理生成更具体的报告。";
  const photoSummary = scan.photo?.filename
    ? `已结合 ${scan.photo.filename} 的像素特征生成研判，图片签名 ${profile.file_signature || "已记录"}。`
    : profile.file_signature
      ? "已读取本次照片特征，未登录保存时仍可生成临时面诊结论。"
      : "当前为基础面诊结果；上传正脸照片后可形成更完整的记录。";
  const recommendations = [
    ...mainIssues.map((item) => item.advice),
    hydration < 48 ? "当前保湿稳定度偏弱，建议把温和洁面、保湿乳霜和防晒作为第一阶段。" : "保湿状态相对平稳，可在稳定基础上逐步加入针对性护理。",
    redness > 52 || spotDensity > 48 ? "如持续炎症、敏感或反复爆痘，建议面诊专业顾问确认处理节奏。" : "维持规律作息和防晒，观察 2-4 周后再升级护理方案。",
  ].filter(Boolean);
  const riskNotes = [
    redness > 52 ? "泛红明显时避免热敷、磨砂、刷酸和强刺激项目。" : "避免过度清洁和频繁更换产品。",
    spotDensity > 45 ? "痘印和色沉改善周期较长，需配合稳定防晒。" : "敏感期先做局部测试。",
    oiliness > 50 ? "控油不等于强清洁，过度清洁可能加重屏障不稳。" : "医美项目需结合实际皮肤状态评估。",
  ];

  return {
    id: makeId("beauty_analysis"),
    provider_status: "local",
    generated_at: new Date().toISOString(),
    summary,
    photo_summary: photoSummary,
    recommendations: recommendations.slice(0, 4),
    risk_notes: riskNotes,
    image_profile: profile,
    sources: [],
    disclaimer: "本结果为皮肤护理参考，不替代医生或专业机构面诊。",
  };
}

export function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getLeadCollection(pageId, actionId) {
  return leadCollections[pageId]?.[actionId] ?? null;
}

export function getPageCollections(pageId) {
  return Object.values(leadCollections[pageId] ?? {});
}

export async function registerUser({ email, password, firstName }) {
  if (SUPABASE_ENABLED) return supabaseRegisterUser({ email, password, firstName });
  if (REMOTE_DIRECTUS_ENABLED) {
    await directusRequest("/users/register", {
      method: "POST",
      body: {
        email,
        password,
        first_name: firstName,
      },
    });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) throw new Error("请填写邮箱和密码。");
  const accounts = readLocalJson(LOCAL_ACCOUNTS_KEY, []);
  if (accounts.some((item) => item.email === normalizedEmail)) throw new Error("该邮箱已注册。");
  const now = new Date().toISOString();
  const user = {
    id: makeId("user"),
    email: normalizedEmail,
    first_name: String(firstName || "").trim() || normalizedEmail.split("@")[0],
    credential: encodeCredential(password),
    date_created: now,
  };
  writeLocalJson(LOCAL_ACCOUNTS_KEY, [...accounts, user]);
}

export async function loginUser({ email, password, firstName }) {
  if (SUPABASE_ENABLED) return supabaseLoginUser({ email, password, firstName });
  if (REMOTE_DIRECTUS_ENABLED) {
    const session = await directusRequest("/auth/login", {
      method: "POST",
      body: { email, password, mode: "json" },
    });
    return storeSession(session);
  }

  const normalizedEmail = normalizeEmail(email);
  const credential = encodeCredential(password);
  if (!normalizedEmail || !password) throw new Error("请填写邮箱和密码。");
  const accounts = readLocalJson(LOCAL_ACCOUNTS_KEY, []);
  let user = accounts.find((item) => item.email === normalizedEmail);
  if (!user) {
    user = {
      id: makeId("user"),
      email: normalizedEmail,
      first_name: String(firstName || "").trim() || normalizedEmail.split("@")[0],
      credential,
      date_created: new Date().toISOString(),
    };
    writeLocalJson(LOCAL_ACCOUNTS_KEY, [...accounts, user]);
  } else if (user.credential !== credential) {
    throw new Error("邮箱或密码不正确。");
  }
  return storeSession(localSessionFor(user));
}

export async function refreshSession(session = getStoredSession()) {
  if (!session?.refresh_token) return null;
  if (SUPABASE_ENABLED) return supabaseRefreshStoredSession(session);
  if (!REMOTE_DIRECTUS_ENABLED) return session.local ? storeSession(session) : null;
  const nextSession = await directusRequest("/auth/refresh", {
    method: "POST",
    body: { refresh_token: session.refresh_token, mode: "json" },
  });
  return storeSession(nextSession);
}

export async function logoutUser(session = getStoredSession()) {
  if (SUPABASE_ENABLED) {
    await supabaseLogout(session);
    return;
  }
  if (REMOTE_DIRECTUS_ENABLED && session?.refresh_token) {
    await directusRequest("/auth/logout", {
      method: "POST",
      body: { refresh_token: session.refresh_token, mode: "json" },
    }).catch(() => null);
  }
  storeSession(null);
}

export async function getCurrentUser(session = getStoredSession()) {
  if (!session?.access_token) return null;
  if (SUPABASE_ENABLED) return shapeSupabaseUser(await getSupabaseUser(session));
  if (!REMOTE_DIRECTUS_ENABLED) {
    const user = getLocalUserBySession(session);
    return user ? localProfile(user) : null;
  }
  return directusRequest("/users/me", { token: session.access_token });
}

export async function submitLead({ pageId, actionId, values, context, session = getStoredSession() }) {
  const collection = getLeadCollection(pageId, actionId);
  if (!collection) throw new Error("当前业务表单未配置。");
  if (!session?.access_token) throw new Error("请先登录。");

  if (SUPABASE_ENABLED) {
    return supabaseCreateRecord({ collection, values, pageId, actionId, context, session });
  }

  if (!REMOTE_DIRECTUS_ENABLED) {
    return localCreateItem({ collection, values, pageId, actionId, context, session });
  }

  return directusRequest(`/items/${collection}`, {
    method: "POST",
    token: session.access_token,
    body: {
      ...values,
      source_page: pageId,
      action_id: actionId,
      context,
      consent_accepted: true,
      submitted_at: new Date().toISOString(),
    },
  });
}

export async function submitSystemEvent({ pageId, actionId, values = {}, context, session = getStoredSession() }) {
  return submitLead({ pageId, actionId, values, context, session });
}

export async function analyzeBeautyScan({ scan, session = getStoredSession() }) {
  if (!REMOTE_DIRECTUS_ENABLED) return buildLocalBeautyAnalysis(scan);
  return directusRequest("/ai/beauty/analyze", {
    method: "POST",
    token: session?.access_token,
    body: scan,
  });
}

export async function listUserItems({ pageId, session = getStoredSession(), userId, limit = defaultListLimit }) {
  if (!session?.access_token) throw new Error("请先登录。");
  if (SUPABASE_ENABLED) return supabaseListRecords({ pageId, session, userId, limit });
  if (!REMOTE_DIRECTUS_ENABLED) return localListItems({ pageId, session, userId, limit });

  const collections = getPageCollections(pageId);
  const results = await Promise.all(
    collections.map(async (collection) => {
      const query = new URLSearchParams({
        fields: "*",
        limit: String(limit),
        sort: "-date_created",
      });
      query.set("filter[user_created][_eq]", userId || "$CURRENT_USER");
      const records = await directusRequest(`/items/${collection}?${query.toString()}`, {
        token: session.access_token,
      });
      return (records ?? []).map((record) => ({ ...record, collection }));
    }),
  );

  return results
    .flat()
    .sort((left, right) =>
      String(right.date_updated || right.date_created || "").localeCompare(String(left.date_updated || left.date_created || "")),
    );
}

export async function readItem({ collection, id, session = getStoredSession() }) {
  if (!session?.access_token) throw new Error("请先登录。");
  if (SUPABASE_ENABLED) return supabaseReadRecord({ collection, id, session });
  if (!REMOTE_DIRECTUS_ENABLED) return localReadItem({ collection, id, session });
  const record = await directusRequest(`/items/${collection}/${id}`, {
    token: session.access_token,
  });
  return { ...record, collection };
}

export async function updateItem({ collection, id, values, session = getStoredSession() }) {
  if (!session?.access_token) throw new Error("请先登录。");
  if (SUPABASE_ENABLED) return supabaseUpdateRecord({ collection, id, values, session });
  if (!REMOTE_DIRECTUS_ENABLED) return localUpdateItem({ collection, id, values, session });
  const record = await directusRequest(`/items/${collection}/${id}`, {
    method: "PATCH",
    token: session.access_token,
    body: values,
  });
  return { ...record, collection };
}

export async function uploadFile({ file, metadata = {}, session = getStoredSession() }) {
  if (!session?.access_token) throw new Error("请先登录。");
  if (SUPABASE_ENABLED) return supabaseUploadFile({ file, metadata, session });
  if (!REMOTE_DIRECTUS_ENABLED) return localUploadFile({ file, metadata, session });

  const form = new FormData();
  form.append("file", file);
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });

  const response = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readError(payload, "Request failed."));
  }
  return payload?.data ?? payload;
}


