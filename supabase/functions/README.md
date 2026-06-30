# Supabase Edge Functions

## beauty-vision

医美面诊的真实视觉模型分析函数。前端会优先调用：

`https://<project-ref>.supabase.co/functions/v1/beauty-vision`

需要在 Supabase Function Secrets 中配置：

- `VISION_API_KEY`: OpenAI 兼容接口密钥
- `VISION_API_BASE_URL`: 可选，默认 `https://xiaoji.baziapi.site/v1`
- `VISION_MODEL`: 可选，默认 `gpt-5.5`

部署命令：

```bash
supabase functions deploy beauty-vision --project-ref zahnteyhzrwqjgdgmmjz
supabase secrets set VISION_API_KEY=你的密钥 VISION_API_BASE_URL=https://xiaoji.baziapi.site/v1 VISION_MODEL=gpt-5.5 --project-ref zahnteyhzrwqjgdgmmjz
```
