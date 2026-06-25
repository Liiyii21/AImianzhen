# Beauty Directus Backend

This project expects its own Directus instance for beauty consultation operations.

## Local Start

1. Copy `directus/.env.example` to `directus/.env`.
2. Replace `DIRECTUS_KEY`, `DIRECTUS_SECRET`, and admin credentials.
3. Run `docker compose --env-file .env up -d` from this `directus` folder.
4. Set the frontend env to `VITE_DIRECTUS_URL=http://127.0.0.1:8055`.

## Operations Workflow

Use the backend as a skin report and advisor lead workspace:

1. New lead: user completes scan, report claim, or advisor request.
2. Qualification: operator reviews skin goal, budget, phone, consent, and likely service fit.
3. Follow-up: assign an advisor, set next action, and mark whether report delivery or store visit is needed.
4. Conversion: qualified records move to `booked` or `in_progress` once a store visit or plan review is arranged.
5. Closeout: records are closed, rejected, or archived with notes.

## Collections

Create these collections in Directus Studio:

- `beauty_reports`: full report claim requests.
- `beauty_advisor_requests`: customized plan and advisor follow-up leads.
- `beauty_scan_results`: scan events and preliminary skin result records.

## Shared Fields

Recommended fields for all three collections:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Client display name. |
| `phone` | string | PII; restrict visibility. |
| `source_page` | string | Expected value: `beauty`. |
| `action_id` | string | `report`, `advisor`, or `scan`. |
| `context` | JSON | Frontend state such as active tab and scan progress. |
| `consent_accepted` | boolean | Required for advisor follow-up. |
| `submitted_at` | datetime | Client submission time. |
| `status` | string | Pipeline enum below. Default `new`. |
| `owner` | string | Advisor or operator. |
| `priority` | string | `low`, `normal`, `high`, `urgent`. |
| `next_action` | string | Next follow-up step. |
| `notes` | text | Internal advisor notes. |

## Domain Fields

- `beauty_reports`: `goal`, `skin_type`, `skin_score`, `sensitivity_level`, `report_sent_at`.
- `beauty_advisor_requests`: `budget`, `goal`, `preferred_store`, `preferred_time`, `advisor_name`.
- `beauty_scan_results`: `scan_score`, `hydration_score`, `barrier_score`, `oil_score`, `scan_payload`.

## Status Pipeline

Use one consistent enum across collections:

- `new`: just submitted, not reviewed.
- `contacted`: first contact attempted.
- `qualified`: valid customer and service intent.
- `booked`: store visit, remote consultation, or report review scheduled.
- `in_progress`: advisor plan is being prepared or followed up.
- `closed`: handled successfully.
- `rejected`: invalid, duplicate, or not suitable.
- `archived`: retained for reporting only.

## Dashboard Views

Create Directus Insights or saved filters for:

- Today's report claims and advisor requests.
- Open leads grouped by `status`, `goal`, and `owner`.
- High-value leads where `budget in 3000-8000` and `status != closed`.
- Pending report delivery where `report_sent_at is null`.
- Store visit pipeline for the next 7 days.

## Permissions

- Public role: allow user registration and login only.
- Authenticated role: create records in the three business collections.
- Advisor role: read assigned records and update follow-up fields.
- Operator role: read and update status, owner, priority, next action, and notes.
- Admin role: manage users, records, files, roles, permissions, and Insights.

## Local Mock Admin

The repository also includes a development-only Directus-compatible mock server. Run it from the workspace root:

```bash
node scripts/start-local-directus.mjs
```

Open `http://127.0.0.1:8055` to view the local beauty operations dashboard. The mock supports record creation, status updates, list metadata, and JSON export at `/admin/export`.

## Local Vision Analysis

The mock beauty analysis route `/ai/beauty/analyze` can call an OpenAI-compatible vision API for uploaded face photos. It checks config in this order:

1. `BEAUTY_VISION_API_KEY`, `OPENAI_COMPAT_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_AUTH_TOKEN`.
2. `BEAUTY_VISION_BASE_URL`, `OPENAI_COMPAT_BASE_URL`, `OPENAI_BASE_URL`, or `ANTHROPIC_BASE_URL`.
3. The local cc switch Claude settings file at `%USERPROFILE%\.claude\settings.json`.

The default base URL is `https://xiaoji.baziapi.site/v1`, and the default model is `gpt-5.5`. Set `BEAUTY_VISION_DISABLED=1` for tests or demos that should not call the external provider.
