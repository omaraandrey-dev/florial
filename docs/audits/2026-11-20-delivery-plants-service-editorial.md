# 2026-11-20 — Delivery of large specimen plants service draft editorial update

## Scope and identity

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Document: `drafts.df7893e8-902e-4265-921c-3cb0fd270cc8`
- Type: `service`
- Original draft name: `Доставка крупномерных растений`
- Updated BG name: `Доставка на едроразмерни растения`
- Draft slug assigned after collision check: `dostavka-na-edrorazmerni-rasteniya`
- Existing classification preserved: `serviceCategory=delivery`, `serviceLayout=standard`, `sortOrder=85`
- The document remains an unpublished draft. No publish operation was performed.

## Backup

- Exact pre-edit Sanity snapshot: `docs/backups/sanity/2026-11-20-service-df7893e8-before-delivery-plants-editorial.json`
- Snapshot commit on this branch: `02a688de9fc81a6c225a395626e8470bfb99cf46`
- The backup was fetched back from GitHub and checked for the target document ID before the Sanity write.

## Editorial changes saved to the Sanity draft

- Reworked the Russian source into a complete commercial service article in Bulgarian, Russian and English.
- BG body is Portable Text; RU and EN bodies use the Markdown subset supported by the current `ServicePage.tsx` renderer.
- Added localized names, short descriptions, H1 values through `hero.title`, hero subtitles, meta titles, meta descriptions, keywords and `noIndex=false`.
- Added localized ALT text for the hero image and the secondary image.
- Preserved both existing image assets:
  - Hero: `image-1007d6e2fd41438f67acc6a25208e89039986172-1200x896-jpg`
  - In-article image: `image-e680b1da1df3a04af78580b6d805417ba607924c-1376x768-jpg`
- Placed the secondary image within the article using the existing `__gallery:pipeline` content-block marker and `[[gallery:pipeline]]` body marker. The current renderer supports this pattern; no code change was required.
- Added a contextual link to the already published and active planting service: `/services/zasazhdane-na-rasteniya`.
- Completed localized CTA and enquiry form copy. Replaced the malformed one-field draft form with the standard five typed fields (name, phone, email, location, details).
- Kept delivery and planting distinct in the copy; crane unloading and final positioning are described as subject to site access and equipment reach. Delivery availability and price are stated as confirmed individually, not guaranteed universally.
- Did not change document ID, image asset references, service category, layout, sort order, activation state or publication state.

## SEO and validation

- Checked that the proposed slug did not already exist among service/blogPost documents in the production dataset (count: 0).
- Sanity beta document validator: status `valid`.
- Validator reports `complete=false` because custom validation callbacks (including custom slug uniqueness callbacks) were not executed. Its built-in rules, including built-in slug uniqueness, did run.
- Sanity raw read-back confirmed the new BG/RU/EN copy, SEO fields, ALT values, CTA, five typed form fields and both preserved image references.
- The secondary image placement was checked against the current renderer logic in `src/pages/ServicePage.tsx`: the group marker is recognized and excluded from the separate bottom content-block section.
- No public browser/rendered-page check or enquiry submission was performed; the document is still a draft and has no public page.
- The connected Humanizer tool was not available in this session. Bulgarian copy was edited manually; no Humanizer use is claimed.
- The current service image schema exposes localized ALT fields but no localized image-title attribute. No unsupported title field or schema change was added. SEO meta titles are populated for all three locales.

## Systems and deployment

- Only the target Sanity draft was edited.
- No published Sanity document was changed.
- No Sanity schema, website code, Cloudflare Pages/Functions, D1, Resend, secrets or production deployment was changed.
- Shared `CHANGELOG.md`, technical passport and open-questions integration is intentionally deferred to a synchronized documentation integration pass because other documentation PRs remain open.
