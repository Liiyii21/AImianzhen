const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BeautyScan = {
  concerns?: string[];
  image_profile?: Record<string, unknown> & { image_data_url?: string };
  metric_labels?: Record<string, string>;
  metrics?: Record<string, number>;
  photo?: { filename?: string; type?: string; size?: number } | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function stripImageData(profile: BeautyScan["image_profile"]) {
  if (!profile) return {};
  const { image_data_url: _imageDataUrl, ...publicProfile } = profile;
  return publicProfile;
}

function buildPrompt(scan: BeautyScan) {
  return [
    "你是一名严谨的 AI 皮肤面诊报告助手，只做护肤与医美咨询前的信息整理，不做疾病诊断。",
    "请根据用户上传的面部照片和基础像素指标，生成中文 JSON。",
    "要求：结论要具体，能体现照片差异；不要提到你在看网络资料、公开资料或模型名称；不要输出 Markdown。",
    "输出字段必须是：summary, photo_summary, recommendations, risk_notes, image_profile, disclaimer。",
    "recommendations 输出 4 条；risk_notes 输出 3 条；每条建议要具体到护理优先级或注意事项。",
    "如果照片存在模糊、遮挡、非正脸或光线问题，请在 photo_summary 中说明会影响准确性。",
    `基础指标：${JSON.stringify({
      metrics: scan.metrics,
      metric_labels: scan.metric_labels,
      concerns: scan.concerns,
      image_profile: stripImageData(scan.image_profile),
      photo: scan.photo,
    })}`,
  ].join("\n");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("VISION_API_KEY");
  const baseUrl = (Deno.env.get("VISION_API_BASE_URL") || "https://xiaoji.baziapi.site/v1").replace(/\/$/, "");
  const model = Deno.env.get("VISION_MODEL") || "gpt-5.5";

  if (!apiKey) return jsonResponse({ error: "VISION_API_KEY is not configured" }, 500);

  const payload = await request.json().catch(() => null);
  const scan: BeautyScan = payload?.scan ?? {};
  const imageUrl = scan.image_profile?.image_data_url;

  if (!imageUrl || typeof imageUrl !== "string") {
    return jsonResponse({ error: "Missing image_data_url" }, 400);
  }

  const modelResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是专业、克制、可信的中文皮肤护理分析助手。只返回严格 JSON。",
        },
        {
          role: "user",
          content: [
            { type: "text", text: buildPrompt(scan) },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  const modelPayload = await modelResponse.json().catch(() => null);
  if (!modelResponse.ok) {
    return jsonResponse(
      { error: modelPayload?.error?.message || modelPayload?.message || "Vision model request failed" },
      502,
    );
  }

  const content = modelPayload?.choices?.[0]?.message?.content;
  let parsed: Record<string, unknown> = {};
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content ?? {};
  } catch {
    parsed = {};
  }

  return jsonResponse({
    id: crypto.randomUUID(),
    provider_status: "vision_model",
    generated_at: new Date().toISOString(),
    summary: parsed.summary || "本次照片已完成皮肤状态研判，建议结合当前面部表现分阶段护理。",
    photo_summary: parsed.photo_summary || "已结合上传照片生成本次面诊结论。",
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : [],
    risk_notes: Array.isArray(parsed.risk_notes) ? parsed.risk_notes.slice(0, 3) : [],
    image_profile: {
      ...stripImageData(scan.image_profile),
      ...(typeof parsed.image_profile === "object" && parsed.image_profile ? parsed.image_profile : {}),
    },
    sources: [],
    disclaimer: parsed.disclaimer || "本结果为皮肤护理参考，不替代医生或专业机构面诊。",
  });
});
