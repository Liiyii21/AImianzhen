const DIRECTUS_URL = (import.meta.env.VITE_DIRECTUS_URL ?? "").replace(/\/$/, "");
const SESSION_KEY = "ai_service_directus_session";

export const directusConfig = {
  url: DIRECTUS_URL,
  isConfigured: Boolean(DIRECTUS_URL),
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
  if (!DIRECTUS_URL) {
    throw new Error("请先配置 VITE_DIRECTUS_URL。");
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
  await directusRequest("/users/register", {
    method: "POST",
    body: {
      email,
      password,
      first_name: firstName,
    },
  });
}

export async function loginUser({ email, password }) {
  const session = await directusRequest("/auth/login", {
    method: "POST",
    body: { email, password, mode: "json" },
  });
  return storeSession(session);
}

export async function refreshSession(session = getStoredSession()) {
  if (!session?.refresh_token) return null;
  const nextSession = await directusRequest("/auth/refresh", {
    method: "POST",
    body: { refresh_token: session.refresh_token, mode: "json" },
  });
  return storeSession(nextSession);
}

export async function logoutUser(session = getStoredSession()) {
  if (session?.refresh_token) {
    await directusRequest("/auth/logout", {
      method: "POST",
      body: { refresh_token: session.refresh_token, mode: "json" },
    }).catch(() => null);
  }
  storeSession(null);
}

export async function getCurrentUser(session = getStoredSession()) {
  if (!session?.access_token) return null;
  return directusRequest("/users/me", { token: session.access_token });
}

export async function submitLead({ pageId, actionId, values, context, session = getStoredSession() }) {
  const collection = getLeadCollection(pageId, actionId);
  if (!collection) throw new Error("当前动作没有配置 Directus 集合。");
  if (!session?.access_token) throw new Error("请先登录后再提交。");

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
  return directusRequest("/ai/beauty/analyze", {
    method: "POST",
    token: session?.access_token,
    body: scan,
  });
}

export async function listUserItems({ pageId, session = getStoredSession(), userId, limit = defaultListLimit }) {
  if (!session?.access_token) throw new Error("请先登录后再读取服务记录。");
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
  const record = await directusRequest(`/items/${collection}/${id}`, {
    token: session.access_token,
  });
  return { ...record, collection };
}

export async function updateItem({ collection, id, values, session = getStoredSession() }) {
  if (!session?.access_token) throw new Error("请先登录后再更新状态。");
  const record = await directusRequest(`/items/${collection}/${id}`, {
    method: "PATCH",
    token: session.access_token,
    body: values,
  });
  return { ...record, collection };
}

export async function uploadFile({ file, metadata = {}, session = getStoredSession() }) {
  requireDirectusUrl();
  if (!session?.access_token) throw new Error("请先登录后再上传文件。");
  if (!file) throw new Error("请先选择要上传的文件。");

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
