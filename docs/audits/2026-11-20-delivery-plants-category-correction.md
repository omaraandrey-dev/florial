# 2026-11-20 — Delivery of large specimen plants: service category correction

## Sanity change

- Project: `bxvcy0qs`
- Dataset: `production`
- Draft document: `drafts.df7893e8-902e-4265-921c-3cb0fd270cc8`
- Slug: `dostavka-na-edrorazmerni-rasteniya`
- Field changed: `serviceCategory`, from `delivery` to `planting`.
- Existing `serviceLayout=standard`, document identity, slug, editorial copy, localized SEO, form and image assets were not changed.
- Draft remains unpublished.

## Rationale verified against live schema and main code

- Deployed Sanity `serviceCategory` options include `planting` (Studio title: `Засаждане`), `landscaping` (Ландшафтен дизайн), `irrigation`, `lawn`, `maintenance`, and `delivery`. There is no separate `gardener` category.
- In `src/pages/ServicePage.tsx` at main commit `eb9ef90ebabb63260f7dc7129cb0bdb8996c4124`, `planting` maps to the Gardener direction: BG `Градинар`, RU `Садовник`, EN `Gardener`, slug `gardinar`.
- `landscaping` maps to Landscape Architect and therefore does not match the owner's clarification.
- The owner requested the delivery service to be categorized as the work of a landscaper/gardener. The closest existing supported category is `planting`; no schema or global mapping changes were made.

## Backup and verification

- The full original draft backup is preserved in the editorial PR #444: `docs/backups/sanity/2026-11-20-service-df7893e8-before-delivery-plants-editorial.json`.
- Sanity write used revision guard after re-reading the current draft revision.
- Raw Sanity read-back confirmed `serviceCategory=planting`, unchanged slug, `serviceLayout=standard`, and the localized names/H1 values.
- No published document, code, Sanity schema, Cloudflare, D1, Resend or Production deployment was changed.
