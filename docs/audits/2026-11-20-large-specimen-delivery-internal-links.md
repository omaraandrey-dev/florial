# Внутренняя перелинковка услуги доставки крупномерных растений

**Дата:** 2026-11-20  
**GitHub baseline:** `8eba517521f4e13fa4e9802014f2d211f1daf441`  
**Sanity project:** `bxvcy0qs`  
**Target service:** `df7893e8-902e-4265-921c-3cb0fd270cc8`  
**Target slug:** `dostavka-na-edrorazmerni-rasteniya`  
**Target URL:** https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya

## Scope and published changes

### Plant products — dataset `plants`

Added one item to `relatedContentBySlug` on 35 unique published product documents:

```json
{
  "_key": "large-specimen-delivery",
  "contentType": "service",
  "slug": "dostavka-na-edrorazmerni-rasteniya"
}
```

The target was added once per document; existing related links were preserved. The product groups overlap, so each document was patched only once.

- Palm / yucca group: 12 products.
- Olive / olive-tree group: 6 products.
- Tree / shrub group: 23 products.
- Unique union: 35 products.

Product document IDs:
- `136f52af-b717-48be-be5e-232d24fc84e6`
- `305e9713-7d6b-4cac-9928-afab0748d4f4`
- `39120ccd-4168-4303-8d0f-0062ccaef034`
- `8165f8d2-05f4-4443-b464-e4bf1d3c13c3`
- `89b199b5-e6f3-48ce-acb4-769c00539f89`
- `923e6c6f-a3a2-4182-bf89-7461cd594f99`
- `a2f17ef5-bafd-4e41-ae5a-97126b640ad2`
- `a5f65135-51e1-4597-aee2-ae3a206932e5`
- `b4f7638d-8c5a-469c-8ed1-af6eadae2243`
- `c3c6ce76-9fa7-4964-8f4f-ef6cb7a3abfc`
- `d6460a04-4731-45a9-9576-1fc7d589af2f`
- `e6f4a52d-8d74-4dc1-a0f9-d4a6239c7215`
- `fcabd283-f419-4067-9eea-e9c28b7b4778`
- `flower-fuchsia`
- `flower-rose`
- `olive-olea-europaea`
- `olive-specimen`
- `palm-brahea`
- `palm-butia`
- `palm-chamaerops`
- `palm-phoenix-canariensis`
- `palm-phoenix-dactylifera`
- `palm-phoenix-roebelenii`
- `palm-sabal`
- `palm-trachycarpus`
- `palm-washingtonia`
- `palm-yucca-rostrata`
- `plant-3b1f30e9-51e5-4020-847d-bdea5a403dec`
- `plant-477cf71e-194c-40b5-998d-9c25a9a3be1f`
- `plant-b0e4396c-49b8-4a10-a608-ff248b95cc46`
- `plant-cd8a49d4-c1c7-41f4-9e99-bd598f21b3a0`
- `plant-dfa442af-261b-4f3b-a0c3-71686132a7e2`
- `shrub-cypress`
- `shrub-thuja`
- `tree-laurel`

### Plant category «Солитеры»

- Document ID: `plants-solitaires`
- URL: `/category/soliteri-edrorazmerni`
- Added a Portable Text paragraph/link to BG root `seoContent`, RU `translations.ru.seoContent` and EN `translations.en.seoContent`.
- BG anchor: «Доставка на едроразмерни растения».
- RU anchor: «Доставка крупномерных растений».
- EN anchor: «Large Plant Delivery».
- All links target `/services/dostavka-na-edrorazmerni-rasteniya`.
- Existing category text and `helpBlock` (including its button URL to `/services/zasazhdane-na-rasteniya`) were preserved.

### Existing service pages — dataset `production`

Added a reference to service `df7893e8-902e-4265-921c-3cb0fd270cc8` in `relatedContent`:

| Service | Document ID | Slug |
|---|---|---|
| Засаждане на растения | `cfdbf22c-a7d9-480b-b88b-d1529a9389ef` | `zasazhdane-na-rasteniya` |
| Засаждане на палми | `5fd92607-19dd-44ae-b546-01e841f835c9` | `zasazhdane-na-palmi` |
| Засаждане на маслини | `6afc3eff-944c-4085-a48c-38686999b0f3` | `profesionalno-zasazhdane-na-maslini` |
| Засаждане на иглолистни растения | `d978a193-d607-419c-97fb-8906a8e9a3ff` | `zasazhdane-na-iglolistni-rasteniya` |

Existing related references were preserved. No service copy, translations, SEO, slug, images, active state or category fields were changed.

## Backups

Full published-document snapshots were created before Sanity writes and committed to GitHub:

- `docs/backups/sanity/2026-11-20-large-specimen-links-plants-01.json` — 16 product documents.
- `docs/backups/sanity/2026-11-20-large-specimen-links-plants-02.json` — 19 product documents and category `plants-solitaires`.
- `docs/backups/sanity/2026-11-20-large-specimen-links-services.json` — all four existing service documents.

Total snapshot coverage: 40 documents.

## Implementation and verification

- Confirmed the deployed Sanity schema for `product.relatedContentBySlug`, `category.seoContent` Portable Text links and `service.relatedContent` references.
- Checked current `main` source: `src/lib/routeData/productDetails.ts` resolves plant `relatedContentBySlug` and category help links; `src/pages/ProductPage.tsx` renders up to four related cards. `src/pages/CategoryPage.tsx` renders localized category SEO Portable Text through `RichText`.
- All 40 edits were applied to drafts with optimistic revision guards and published successfully: plants dataset 36 documents (35 products + category), production dataset 4 services.
- Published read-back: 35/35 product docs have exactly one target slug; 4/4 services have exactly one target reference; BG/RU/EN category arrays contain the link. Previous product arrays, service references, all pre-existing category Portable Text blocks and the category helpBlock were compared against the snapshots and preserved.
- Live Production HTML fetch checked four representative product pages (palm, olive, broadleaf tree, shrub), the category in BG/RU/EN, and all four service pages. The target link was found on each. RU and EN category HTML also contained the expected localized anchor text.
- The destination service page had already been independently published and its BG/RU/EN Production pages returned HTTP 200 in the preceding publication task. No lead form was submitted.

## Change boundaries

- Sanity content only: 35 plant products, one plant category and four service pages.
- No frontend code, Studio schema, Cloudflare Pages/Functions settings, D1, Resend, secrets or Production deployment changed.
- CI/build was not run because no code/schema/runtime files changed.
- The current unrelated open PR #441 changes only its own rotary-nozzle audit and backup files; this task uses separate audit/backup paths and does not overlap those files.
