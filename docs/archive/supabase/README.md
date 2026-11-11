# Supabase archive — historical only

**Retired backend. Do not execute or restore.**

Current Florial architecture: Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend.

This folder preserves SQL migrations and analytics documents from the previous Supabase implementation for audit/history only. They are not D1 migrations, are not part of current deployment workflows, and must never be run against D1 or Production.

- `migrations/` — historical SQL.
- `FLORIAL_MANAGER_ANALYTICS.md` — previous Manager analytics design.
- `analytics-report.md` — previous SQL analytics report.

Current instructions: [AI_INSTRUCTIONS](../../../AI_INSTRUCTIONS.md), [START_HERE](../../AI/START_HERE.md), [TECHNICAL_PASSPORT](../../TECHNICAL_PASSPORT.md).

Cloudflare variables with SUPABASE names are a separate live configuration issue. Their values were not read or changed by this archival operation.
