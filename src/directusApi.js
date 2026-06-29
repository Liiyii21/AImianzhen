const DIRECTUS_URL = (import.meta.env.VITE_DIRECTUS_URL ?? "").replace(/\/$/, "");
const USE_DIRECTUS = import.meta.env.VITE_USE_DIRECTUS === "true";
const REMOTE_DIRECTUS_ENABLED = Boolean(DIRECTUS_URL && USE_DIRECTUS);
const SESSION_KEY = "ai_service_directus_session";
const LOCAL_ACCOUNTS_KEY = "ai_service_local_accounts";
const LOCAL_ITEMS_KEY = "ai_service_local_items";
const LOCAL_FILES_KEY = "ai_service_local_files";

export const isLocalMode = !REMOTE_DIRECTUS_ENABLED;

export const directusConfig = {
  url: REMOTE_DIRECTUS_ENABLED ? DIRECTUS_URL : "浏览器本地体验模式",
  isConfigured: true,
  isLocalMode,
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
    throw new Error("当前使用浏览器本地体验模式。");
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
    throw new Error(readError(payload, "Directus 请求失败。"));
  }
  return payload?.data ?? payload;
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
  if (!user) throw new Error("请先登录后再操作。");
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
  if (!item || item.user_created !== user.id) throw new Error("没有找到这条记录。");
  return item;
}

function localUpdateItem({ collection, id, values, session }) {
  const user = requireLocalUser(session);
  const items = readLocalJson(LOCAL_ITEMS_KEY, []);
  const index = items.findIndex((record) => record.collection === collection && record.id === id && record.user_created === user.id);
  if (index < 0) throw new Error("没有找到这条记录。");
  const next = { ...items[index], ...values, date_updated: new Date().toISOString() };
  items[index] = next;
  writeLocalJson(LOCAL_ITEMS_KEY, items);
  return next;
}

function localUploadFile({ file, metadata, session }) {
  const user = requireLocalUser(session);
  if (!file) throw new Error("请先选择要上传的文件。");
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
  return {
    id: makeId("beauty_analysis"),
    provider_status: "local",
    generated_at: new Date().toISOString(),
    summary:
      "本次面部指标显示需要优先关注补水、屏障稳定和痘印管理。建议先以温和清洁、基础保湿、防晒和低刺激修护为主，再逐步加入功效型护理。",
    photo_summary: scan.photo?.filename
      ? `已读取 ${scan.photo.filename} 的面诊记录，并同步保存到本机报告中。`
      : "当前为本地面诊结果；上传正脸照片后可形成更完整的记录。",
    recommendations: [
      "优先建立温和清洁、保湿和防晒的基础护理。",
      "痘痘或泛红明显时，先避免刷酸和强刺激项目。",
      "毛孔和油脂问题适合循序渐进管理，不建议一次叠加过多功效产品。",
      "如有持续炎症、敏感或反复爆痘，建议面诊专业顾问。",
    ],
    risk_notes: ["避免过度清洁和频繁更换产品。", "敏感期先做局部测试。", "医美项目需结合实际皮肤状态评估。"],
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
  if (!normalizedEmail) throw new Error("请输入邮箱。");
  if (String(password || "").length < 8) throw new Error("密码至少需要 8 位。");
  const accounts = readLocalJson(LOCAL_ACCOUNTS_KEY, []);
  if (accounts.some((user) => user.email === normalizedEmail)) throw new Error("这个邮箱已经注册，可以直接登录。");
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
  if (REMOTE_DIRECTUS_ENABLED) {
    const session = await directusRequest("/auth/login", {
      method: "POST",
      body: { email, password, mode: "json" },
    });
    return storeSession(session);
  }

  const normalizedEmail = normalizeEmail(email);
  const credential = encodeCredential(password);
  if (!normalizedEmail) throw new Error("请输入邮箱。");
  if (String(password || "").length < 8) throw new Error("密码至少需要 8 位。");
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
    throw new Error("密码不正确，请重新输入。");
  }
  return storeSession(localSessionFor(user));
}

export async function refreshSession(session = getStoredSession()) {
  if (!session?.refresh_token) return null;
  if (!REMOTE_DIRECTUS_ENABLED) return session.local ? storeSession(session) : null;
  const nextSession = await directusRequest("/auth/refresh", {
    method: "POST",
    body: { refresh_token: session.refresh_token, mode: "json" },
  });
  return storeSession(nextSession);
}

export async function logoutUser(session = getStoredSession()) {
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
  if (!REMOTE_DIRECTUS_ENABLED) {
    const user = getLocalUserBySession(session);
    return user ? localProfile(user) : null;
  }
  return directusRequest("/users/me", { token: session.access_token });
}

export async function submitLead({ pageId, actionId, values, context, session = getStoredSession() }) {
  const collection = getLeadCollection(pageId, actionId);
  if (!collection) throw new Error("当前动作没有配置记录类型。");
  if (!session?.access_token) throw new Error("请先登录后再提交。");

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
  if (!session?.access_token) throw new Error("请先登录后再读取服务记录。");
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
  if (!session?.access_token) throw new Error("请先登录后再读取详情。");
  if (!REMOTE_DIRECTUS_ENABLED) return localReadItem({ collection, id, session });
  const record = await directusRequest(`/items/${collection}/${id}`, {
    token: session.access_token,
  });
  return { ...record, collection };
}

export async function updateItem({ collection, id, values, session = getStoredSession() }) {
  if (!session?.access_token) throw new Error("请先登录后再更新状态。");
  if (!REMOTE_DIRECTUS_ENABLED) return localUpdateItem({ collection, id, values, session });
  const record = await directusRequest(`/items/${collection}/${id}`, {
    method: "PATCH",
    token: session.access_token,
    body: values,
  });
  return { ...record, collection };
}

export async function uploadFile({ file, metadata = {}, session = getStoredSession() }) {
  if (!session?.access_token) throw new Error("请先登录后再上传文件。");
  if (!file) throw new Error("请先选择要上传的文件。");
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
    throw new Error(readError(payload, "Directus 文件上传失败。"));
  }
  return payload?.data ?? payload;
}
