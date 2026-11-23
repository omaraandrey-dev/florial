# Florial — SEO Audit Agent Skill

## Purpose

The repository includes the open-source `seo-audit` Agent Skill by Corey Haines, installed for project-scoped use by compatible coding agents (including Codex). It is a read-only audit methodology and reference library; it is not a runtime dependency of the Florial website.

## Installation

- Skill path: `.agents/skills/seo-audit/SKILL.md`
- References: `.agents/skills/seo-audit/references/`
- Skill discovery follows the Agent Skills project convention.
- This installation does not add an npm dependency, change the website bundle, or alter Sanity, Cloudflare, D1, Resend or Production configuration.

## Upstream provenance

- Repository: https://github.com/coreyhaines31/marketingskills
- Upstream path: `skills/seo-audit/`
- Imported on: 2026-11-23
- Upstream `SKILL.md` blob: `1a4fd7536e099e24f841444f621497fc8fd1d768`
- Imported Agent Skill metadata version: `2.2.9` (pinned copy; updates are manual and must be reviewed).
- The seven accompanying reference files are copied with their upstream blob versions; see their Git history and file paths.
- The imported skill text is preserved, with an appended Florial-specific guardrail section. Upstream updates are not automatic; review and pin a new upstream revision before updating.

## What it covers

- Crawlability, indexation, robots.txt, XML sitemaps, canonical and redirects.
- Technical SEO and Core Web Vitals.
- Page titles, meta descriptions, heading structure, image accessibility and internal linking.
- E-commerce product/category pages and content quality.
- Multilingual SEO, hreflang and locale-specific canonical behavior.
- Local SEO, Google Business Profile/citations and genuinely useful location/service pages.
- Search Console opportunity analysis for queries/pages around positions 8–20 and low-CTR pages.

## Florial-specific operating rules

The project guardrails are embedded at the end of `SKILL.md`. In summary:

1. Florial architecture remains GitHub + Sanity + Cloudflare Pages/Functions + D1 + Resend; do not revive Supabase.
2. Audit BG, RU and EN separately using actual routes and reciprocal language annotations.
3. Respect approved geo coverage; do not add Sozopol or create thin doorway pages.
4. Existing Florial title, description and explicit localized H1 rules override generic SEO templates.
5. Existing published service, blog and portfolio documents are read-only unless the owner approves exact changes.
6. An audit is not permission to write to Sanity, change code, alter Cloudflare/D1 or make external profile changes.
7. Findings must include evidence, confidence, URL/locale/date, impact and a verification method. Unknown data stays marked as unknown.

## Recommended use

When asked to audit Florial SEO:

1. Read the current repository instructions and the relevant SEO playbook, audit and roadmap.
2. Define scope (whole site or a page type/locale) and available evidence (live pages, Search Console, sitemap, code).
3. Use the skill checklist and references, adapting generic advice to Florial's approved rules.
4. Return findings with severity, evidence, impact, proposed fix and validation method.
5. Separate read-only findings from changes that need owner approval.
6. Do not claim a complete crawl or Search Console analysis unless those data sources were actually queried.

## Important limitation

The skill provides instructions and audit methodology. It does not itself crawl the production site, connect Google Search Console, run Lighthouse, or perform fixes. Those tasks require the corresponding tools, access and explicit scope. The browser connector is not required for installation and must only be used with the owner's permission.

## Upstream references included

- `references/ai-writing-detection.md`
- `references/international-seo.md`
- `references/local-seo-pages-and-measurement.md`
- `references/local-seo-profile-and-citations.md`
- `references/local-seo.md`
- `references/rankings-push.md`
- `references/title-tags.md`


## Initial comprehensive Florial audit — 2026-11-23

The skill was applied to a read-only audit of GitHub main, Sanity published datasets, Google Search Console, GA4 and Cloudflare Pages/Zone. The report is [2026-11-23-comprehensive-seo-audit.md](../audits/2026-11-23-comprehensive-seo-audit.md); remediation stages are in [SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md](../roadmaps/SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md).

Top findings:
- Sitemap: 1,372 URLs, zero reported errors/warnings.
- Product/category SEO field coverage BG/RU/EN is complete in the audited published Sanity collections.
- Rechecked 17 representative URLs in GSC: 11 are excluded by `noindex`; three BG product URLs have Google-selected canonical pointing to unrelated products. Those three selected canonical targets also report noindex. Current code and published Sanity values do not explain the saved results; live HTML/headers remain to be verified with owner-approved Browser access.
- GA4 property has no data streams or key events; current D1/PostHog tracking is separate.
- No runtime, Sanity, Cloudflare configuration, D1, Resend or Google settings were changed.

