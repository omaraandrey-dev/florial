# Аудит обновления статьи о пальмах

Дата: 2026-11-18  
Репозиторий: `omaraandrey-dev/florial`  
Base main SHA: `0efaf75494c591708986f9b9b378e9a982848487`  
Sanity project: `bxvcy0qs`  
Dataset: `production`  
Document: `blogPost-nov-vnos-palmi-2025`  
Slug / URL: `nov-vnos-palmi-2025` / https://florial-bg.com/blog/nov-vnos-palmi-2025  
Original published revision: `wShFcTvKnRduO9ho4JbXhm`  
Final published revision: `LtPyN36JxI5SIUpVnhe2RC`

## Scope and approval

The owner explicitly approved the exact editorial plan on 2026-11-18, including title changes, three localized article versions, SEO, inline category images, internal links and tags. Only the existing blog post was edited.

Preserved without change: document ID, slug/public URL, publication date (`2025-03-31T05:15:06.021Z`), published state, cover image asset and original inline palm photograph. The source document was backed up before any write.

## Backup

- Full original Sanity document snapshot: `docs/backups/sanity/2026-11-18-nov-vnos-palmi-2025-before-editorial-refresh.json`.
- Backup commit: `006f4e9bf95a47305d90c7e7370f165f41065769`.
- Original revision: `wShFcTvKnRduO9ho4JbXhm`.
- Snapshot includes the complete original document, all three locales, original Portable Text, image references, tags, cover, slug and publication metadata.

## Editorial result

All three language versions were rewritten as separate localized Portable Text articles. Each version contains 53 blocks and 6 inline images.

| Locale | Original text characters | New text characters (Sanity read-back) | Blocks | Inline images |
|---|---:|---:|---:|---:|
| BG | 2,635 | 10,753 | 53 | 6 |
| RU | 2,391 | 10,249 | 53 | 6 |
| EN | 2,320 | 10,037 | 53 | 6 |

The article is substantially longer in every locale. It now covers palm selection for coastal gardens, species characteristics, site assessment, combinations with other plants, planting preparation, watering, irrigation, seasonal timing, pricing factors, delivery, and a commercial planting enquiry.

The content uses the requested positioning: “градински център Флориал” / “садовый центр Florial” / “Florial Garden Centre”. It does not describe Florial as a landscape studio. Geographic references include Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy, Pomorie, Kosharitsa and Kableshkovo; Sozopol was not added.

The article names current catalogue species for browsing, but does not claim that every item is currently in stock. Published plant catalogue records were checked: the palms category contains 11 published products, with different stock states. No unverified price or stock promise was inserted.

Botanical wording was reviewed carefully: Cycas and Yucca are not described as true palms; Musa basjoo is not labelled as a palm. Frost tolerance is discussed qualitatively and not presented as a guaranteed temperature for every garden. Site-specific wind, salt spray, drainage, winter protection and plant maturity are mentioned.

## Images

The original cover asset and original inline palm photograph were preserved. Five category photographs were copied from the `plants` dataset into `production` and placed inside each language version:

- Palms and yuccas
- Trees and ornamental shrubs
- Flowers and roses
- Conifers
- Exotic plants

The five new Production assets were verified by ID and CDN URL. Each image block contains BG/RU/EN alt fields and a caption. The article has six inline images per locale, including the original photograph. No category or product document was modified.

## Internal links and conversion

Each locale has 17 Portable Text internal-link annotations, read back from published Sanity. Destinations include:

- Palms and yuccas: `/category/palmi-yuki`
- Trees and ornamental shrubs: `/category/darveta-i-hrasti`
- Flowers and roses: `/category/tsvetya-i-rozi`
- Conifers: `/category/igol_listni`
- Exotic plants: `/category/ekzotichni-rasteniya`
- Full plant catalogue: `/category/rastenia`
- Irrigation equipment: `/category/vsichko-za-polivane`
- Drip irrigation: `/category/kapkovo-napoyavane`
- Planting service: `/services/zasazhdane-na-rasteniya`
- Related articles: olive tree, Sympathy roses, landscape design and rolled turf.

The planting service is active and its existing lead form has required name, phone and location fields, plus optional email and project details. No service form, API or submission behavior was changed; no real enquiry was submitted.

Tags are `Растения` and `Озеленяване` to support the existing tag-based related-article component. The actual related-post query was run with the same tag intersection/order as `fetchRelatedBlogPosts`; it returns these three cards:

1. `podroben-landshaften-proekt-gradina` — detailed garden landscape project
2. `rozi-sympathy` — Sympathy roses
3. `maslina-sredizemnomorie` — olive tree in the garden

The article also contains a dedicated “Още полезни статии / Читайте также / Related articles” section with four explicit links.

## Verification

- Sanity draft validator: `valid`; `complete=false` because the beta validator does not execute custom validation callbacks, including custom slug uniqueness callbacks.
- Published Sanity read-back confirms final revision `LtPyN36JxI5SIUpVnhe2RC`, all three titles/SEO titles, 53 blocks, 6 images, tags, preserved slug, date, cover and published state.
- Five uploaded image assets exist in Production.
- BG live page checked with Cloudflare Browser Rendering: new title and meta description, planting-service link, irrigation category link and new category image present; old title absent.
- RU live page checked at `?lang=ru`: new localized title, planting-service link, irrigation link and new category image present.
- EN live page checked at `?lang=en`: localized title, planting-service link, irrigation category link and new category image are present; old title is absent.
- BG, RU and EN live rendered HTML checks are complete through Cloudflare Browser Rendering. A direct web page open could not access the Production URL; the Cloudflare Browser Rendering checks are the live-page evidence.
- No application code, Sanity schema, Cloudflare settings/secrets, D1, Resend, form/API or global navigation were changed. No build or deployment was required for this content-only change.

## Documentation integration

This branch contains the unique backup and audit artifacts only. Shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are intentionally not changed while the existing content-documentation PRs are open. Integrate the shared history entries after synchronizing with the then-current `main`, in accordance with the repository work protocol.
