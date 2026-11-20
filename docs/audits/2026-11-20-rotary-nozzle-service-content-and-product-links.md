# Rotary nozzle replacement service — content audit and product links

**Date:** 2026-11-20  
**Main baseline:** `62d11da8d3ab3b929bdfc4d90d48e38bc71e68ad`  
**Sanity:** project `bxvcy0qs`, dataset `production`

## Service audited

- Document ID: `5b88a838-5f5e-4024-9bb8-f4fd8baaeda8`
- Type: `service`
- Slug: `zamyana-vaeerni-dyuzi-rotatorni-r-van`
- URL: `https://florial-bg.com/services/zamyana-vaeerni-dyuzi-rotatorni-r-van`
- Active and published; category `irrigation`; layout `standard`; sort order 151.

### Content review (read-only)

- BG root `name`, `shortDescription`, Portable Text `description` and `seo` are present.
- RU and EN `translations` contain name, short description, Markdown description, hero, CTA, advantages, steps, lead form and localized SEO.
- BG SEO, RU SEO and EN SEO are present; `noIndex=false` in all three locales.
- Main image exists and has BG/RU/EN ALT text. It is a general sprinkler installation image, not a close-up of a nozzle replacement.
- BG H1 falls back to `name` because root `hero.title` is absent; this is supported by the current frontend.
- BG root `advantages`, `steps`, `callToAction` and `leadForm` are not populated. The English and Russian equivalents are populated. Recommended follow-up: complete these Bulgarian fields for parity.
- The BG body begins with an H2 repeating the service name; RU/EN descriptions also begin with a heading similar to their H1. Consider removing these introductory duplicate headings.
- Bulgarian wording can be polished for native industry usage; consider consistent `ветрилни (Spray) дюзи` alongside the searchable synonym `веерни дюзи`. No service content was edited in this task.
- Technical statements reviewed against the Rain Bird material already collected for the R-VAN series: 2.1–3.8 bar operating range, about 3.1 bar recommended; adjustable 45°–270° models and separate 360° models. No obvious technical contradiction found in the reviewed text.

## Product references published

Added a reference to service `5b88a838-5f5e-4024-9bb8-f4fd8baaeda8` to `relatedContent` on all 17 active products whose primary category is `Spray / веерни дюзи` (`6534adc5-78f7-4276-bbdd-2843ef30420e`).

The pre-existing related service reference `8a4ec08b-e064-4d85-8d97-52837afe6d6f` was preserved on every product. No category helpBlock, existing service document, product description, price, SKU, category membership or other product field was changed.

Product IDs:
- `11a27fdf-2904-40b8-9ba3-264bc22a4359` — P10004
- `1d4a4b1d-aea5-4d1e-bd19-1f4933de98d4` — P10006
- `21e4bb9f-c635-4d6f-882d-c9fefb70b8d3` — HE0801
- `2e200586-8866-4526-adc7-ae0becb35601` — P1001001
- `3f5c3d95-ec09-40f7-b5ab-86337b3a362a` — A47047
- `47d220db-38af-4b22-9995-dc52de55efb7` — P10008
- `63289ec9-c0dd-4f13-ae4d-1f7f00a442c6` — HE1501
- `6f45d30e-1d6b-48e5-8ffd-c72faeb733b0` — A47008
- `81dfc913-3bfe-451b-9c76-fa468366cdbb` — P1001201
- `a365a2c3-1936-4076-a7a7-ba462b21c07f` — A47007
- `a6e7016e-7bba-4078-b76c-6afef30661d6` — P10018
- `c8902118-2d87-4f8d-aa3e-bbcafdc5593a` — A47034A
- `ccbd32bb-7f3f-4109-8928-4518f21e7ec4` — A47006
- `de88e310-c33d-4111-9ad6-c638b49a2ed8` — HE1201
- `e25925d0-b54f-45fa-844e-ad4fde8e6440` — HE1001
- `f36e2aff-6c5b-4544-a6c0-a7c413fbb181` — P1001501
- `f6a7da86-77fd-4b8d-b761-1d86569a12ae` — A47033A

## Backup and verification

- Field-level rollback snapshot of the exact `relatedContent` arrays and product identifiers was committed before Sanity writes:
  `docs/backups/sanity/2026-11-20-spray-nozzle-products-relatedContent-before-service-link.json`.
- All 17 patches succeeded and created drafts; all 17 drafts passed the deployed-schema validator as `valid`. Validator marked checks incomplete because custom validation callbacks are not executed by this beta tool.
- All 17 documents were published with revision guards.
- Post-publish read-only query confirmed the new service reference exactly once on all 17 products and confirmed the existing service reference remained on all 17.
- No frontend code, Sanity schema, category content, existing service content, Cloudflare settings or deployment were changed. No live browser rendering test was performed.

## Documentation integration note

At the time of this audit, open PRs #409, #428 and #440 overlap shared documentation files. To avoid overwriting concurrent changes, this PR contains only this unique audit and its unique backup artifact. Shared `CHANGELOG.md`, Technical Passport and OPEN_QUESTIONS integration must be performed after those overlapping PRs are reconciled.
