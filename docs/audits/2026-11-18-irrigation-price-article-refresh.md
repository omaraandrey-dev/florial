# 2026-11-18 — Irrigation price blog article refresh

## Scope

- Project: `bxvcy0qs`
- Dataset: `production`
- Document ID: `blogPost-cena-sistema-avtomatichno-napoyavane-burgas`
- Slug / route: `cena-sistema-avtomatichno-napoyavane-burgas` / `/blog/cena-sistema-avtomatichno-napoyavane-burgas`
- Final published revision after the editorial and related-link corrections: `4wsk3P4LWpbmPrrSdrw0Y5`
- Existing document ID, slug, URL, publication date, cover asset and published state were preserved.

## Backup

- Complete pre-edit published document snapshot: `docs/backups/sanity/2026-11-18-irrigation-price-article-before.json`
- Snapshot includes project, dataset, document ID, original revision and all original localized fields and assets.

## Editorial changes

- Replaced the legacy BG/RU/EN article bodies with complete localized Portable Text content (40 blocks per locale).
- BG is the primary editorial version; RU and EN are independently written natural-language versions.
- New structure covers site geometry, paths and hardscape, planting and drip irrigation, water source / flow / dynamic pressure, equipment options, estimate composition and enquiry.
- Existing cover and original path-layout illustration were retained; localized cover ALT and inline image ALT/caption were updated.
- Kept the existing article URL and publication date.
- SEO title and description updated for all three locales. The BlogPostPage renderer sets index/follow, canonical and BG/RU/EN hreflang alternates.

## Products and prices verified in published Sanity

All three product documents are active, published, VAT-inclusive and linked from all three language versions:

- Super Economy Kit — `242.32 EUR`, slug `super-ikonomichen-komplekt-polivane`.
- Economy Kit — `478.32 EUR`, slug `ikonomichen-komplekt-polivane-gradina`.
- Standard Kit — `631.42 EUR`, slug `standarten-komplekt-polivane-gradina`.

The article explicitly distinguishes product prices from a complete project-and-installation quotation. The product descriptions, rather than inferred specifications, are used for kit composition.

## Internal links

- Irrigation categories: `/category/vsichko-za-polivane`, `/category/sprinklers`, `/category/controllers`, `/category/kapkovo-napoyavane`.
- Plant categories verified in the `plants` dataset: `/category/darveta-i-hrasti`, `/category/tsvetya-i-rozi`.
- Enquiry route: `/services/proektirane-sistemi-avtomatichno-napoyavane-nesebar`; the existing service is active and its BG/RU/EN lead forms were read-only verified. No form/API/D1/Resend changes were made.
- Curated blog links point to published articles: installation stages, Rain Bird equipment, detailed garden landscape project, and misting system.
- The article tag was narrowed to `Автоматично напояване` so the existing related-article renderer does not select unrelated plant posts. The renderer's three dynamic cards currently resolve to the misting system, installation stages and Rain Bird equipment articles.

## Square-versus-rectangle illustration — follow-up required

- The original DROP/Wix square-versus-rectangle sprinkler layout was located at:
  `https://static.wixstatic.com/media/1b6ca6_b3b4565a82e7483dbfddfe4ea16a9100~mv2.jpg/v1/fill/w_1000%2Ch_480%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01/1b6ca6_b3b4565a82e7483dbfddfe4ea16a9100~mv2.jpg`
- The source image compares sprinkler coverage for a square and a long rectangle separated by a central path.
- The attempt to transfer this remote image into the Sanity dataset was blocked before an upload operation was created. **The square-versus-rectangle source image is not yet in Sanity and is not embedded in the published article.**
- The article currently uses the pre-existing Sanity illustration about paths and sprinkler placement. No substitute image was invented.
- Follow-up: once the owner supplies the original image as a chat attachment or uploads it to Sanity, add it to the BG/RU/EN body with localized ALT and caption.

## Validation and live verification

- Sanity document validation: status `valid`; result is incomplete because the tool does not execute custom validation callbacks. Built-in schema checks ran.
- Published Sanity read-back confirmed final revision, titles, SEO fields, 40 body blocks per locale, one inline image per locale, preserved cover and the final internal links.
- Product IDs, prices, VAT inclusion, active status and service form were checked against published Sanity documents.
- Cloudflare Browser Rendering returned the live BG page HTML: `lang=bg`, correct title and meta description, `index, follow`, canonical URL, BG/RU/EN hreflang links and BlogPosting JSON-LD.
- Further RU/EN Browser Rendering requests were rate-limited; live rendered RU/EN HTML and visual/mobile layout are **not confirmed** in this run. Their Sanity content and SEO fields were verified.
- No actual lead form was submitted. No code, schema, route, Cloudflare settings, D1, Resend or Production secrets were changed.

## Documentation integration note

- This audit and the unique backup are kept in this branch.
- Shared files `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are not edited here because open PRs #334, #281 and #274 also modify those files. Add the content-release entry and image follow-up to the shared documents in one conflict-aware integration pass after those PRs are resolved.
