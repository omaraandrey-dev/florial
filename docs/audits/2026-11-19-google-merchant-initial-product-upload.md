# Google Merchant Center — initial Florial product upload

Date: 2026-11-19  
Repository baseline: `main` at `476037e3c13c2075162e9b73fb730bfaf86e87aa`  
Merchant account: `5907969847` (Windsor.ai account label: `Градински център Флортал`)  
Primary API data source: `accounts/5907969847/dataSources/10797668872`  
Data source name: `Florial Bulgaria — BG products`

## Result

- Windsor.ai exposes the connected `google_merchant` account and the write actions `create_data_source` and `insert_product`.
- Created one primary API product data source, targeted to Bulgaria (`BG`). The source accepts any language/feed-label combination; each inserted item was submitted with content language `bg` and feed label `BG`.
- **75 unique product insert operations returned success**: 52 irrigation/equipment products and 23 plants.
- This confirms successful creation of Merchant API product inputs. It does **not** confirm that Google has finished processing them or approved them for Shopping/free listings.

## Published Sanity inventory and eligibility

Read-only queries against project `bxvcy0qs`, perspective `published`:

| Dataset | Active products | inStock | onRequest | outOfStock | Submitted |
|---|---:|---:|---:|---:|---:|
| `production` (equipment) | 275 | 53 | 222 | 0 | 52 |
| `plants` | 50 | 28 | 19 | 3 | 23 |
| **Total** | **325** | **81** | **241** | **3** | **75** |

The inventory is a live read at the time of this upload; older roadmap counts are historical and must not be reused as current counts.

### Inclusion rules

Only active published products with a positive price, Bulgarian short description, slug, VAT-included pricing, an image URL and confirmed `inStock` status were considered.

- Equipment: root `priceEUR`, root `stockStatus`, main image (or first gallery image fallback).
- Plants: minimum positive price among `inStock` sale variants, but only when the first/default variant shown by the current product page is itself `inStock` and its price equals that minimum. This avoids a Merchant Center price that conflicts with the default landing-page Offer.
- Currency: EUR. Prices are the VAT-included consumer prices from Sanity.
- Product language/feed label: `bg` / `BG`.
- Product links use the canonical non-www `https://florial-bg.com/product/{slug}` route.
- The main image uses the published Sanity asset URL; the first gallery image is included as an additional image when available.
- `brand` is sent only where an actual Sanity brand reference exists. No GTIN or MPN was invented; the generic store SKU was not misrepresented as a manufacturer part number.
- Availability submitted: `IN_STOCK` only. `onRequest` was not translated into `BACKORDER` or `PREORDER`.

### Exclusions

- 241 products with `onRequest` status were not submitted because Florial's request-based availability is not confirmed as an orderable Google backorder/pre-order.
- 3 plants with `outOfStock` status were not included in this initial in-stock upload.
- 1 in-stock equipment product (`fitting-3112-16202`) has neither a main image nor a first gallery image and was excluded.
- 5 in-stock plants were excluded because the minimum in-stock variant price is lower than the first/default variant price rendered on the current product page: `lavrovishnya`, `maslina-ob`, `chamaerops-humilis`, `yucca-rostrata`, `tuya-str`. Their minimum prices were not submitted against a landing page whose default Offer shows a higher price.
- One additional equipment product without an image is already `onRequest` and was therefore excluded by availability as well.

No Sanity document, Sanity schema, storefront code, Cloudflare setting/secret, D1 data, Resend configuration or Production deployment was changed.

## Merchant Center read-back limitation

- The data-source list read returned the new source ID and its `primaryProductDataSource` / `API` type.
- A Windsor product-list read returned 59 rows, but a subsequent `force_refresh` attempt explicitly reported that the current Windsor plan does not include on-demand data refresh and that the returned data is cached.
- Product Statuses returned zero rows.
- Therefore the 59-row cached response is **not** evidence that only 59 products were uploaded, and it is not a current count. The authoritative write evidence is the 75 successful `insert_product` action responses. Final processed/approved/pending/disapproved counts remain **not verified**.

Google's API action responses note that Merchant Center reflects product changes after a few minutes. A fresh status read or authenticated Merchant Center UI check is still required.

## Operational limitation and next steps

This was a one-time API push. No recurring synchronization from Sanity to Merchant Center has been configured. The current API data source will not automatically reflect future Sanity price, stock, title or image changes unless another push is run.

1. Obtain a fresh Merchant Center product/status view through an account session or a Windsor plan that supports refresh; record processed, approved, limited and disapproved counts with reasons.
2. Review Merchant Center shipping/tax/program settings for Bulgaria. This upload did not invent shipping rates, destinations or delivery times and did not change account settings.
3. Decide the durable synchronization design. Options require a separate implementation/approval: scheduled API pushes with securely managed Google credentials, or a file-based scheduled-fetch source. Do not create a second primary source or delete this API source without checking for duplicates and obtaining approval.
4. Resolve the five plant default/minimum price mismatches by an approved product-page variant deep-link/default-selection change before submitting those five at their minimum prices.
5. Revisit `onRequest` items only after confirming whether the customer can place an order and the applicable Google availability/date rules.

## Evidence classification

- **Live Sanity read:** 325 active published products; status counts and eligibility exceptions above.
- **Merchant API write responses:** one primary API data source created; 75 unique product inputs accepted.
- **Windsor read-back:** cached 59 product IDs; on-demand refresh unavailable; not suitable for final processing/approval verification.
- **Google processing/approval:** not verified.
- **Storefront/Production:** unchanged by this upload.
