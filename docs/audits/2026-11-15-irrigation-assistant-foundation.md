# Irrigation assistant — first implementation checkpoint

## 2026-11-15 — Follow-up PR #303: portrait source, launcher scope and engineering specification

- Dedicated specialist image uploaded and published in Sanity Production: photo document `15f0ab7e-b6c9-40aa-ae12-67dd84dbff53`, slug `florial-irrigation-specialist`; asset URL `https://cdn.sanity.io/images/bxvcy0qs/production/0714e789d0e162df5bc2e3200ff7951ac77abdbc-252x247.png`. Original service portrait document was not modified.
- Launcher visibility restricted to equipment catalogue category/product routes, the `polivni-sistemi` service direction and individual irrigation/maintenance/delivery services. It is hidden on homepage, plants, general services, landscaping/planting/lawn, blog, contacts, about, cart, search and the assistant route.
- PR #303 merged as `69ac9e5d2a5762f0bba97b8225fbb79ba85a3dd7`; exact-head CI runs `43752491160` and `43752481075` passed. Production deployment `28954ce2-d134-4a56-9eb7-dad7576ea116` succeeded for the same SHA.
- Production browser QA confirmed the portrait on irrigation catalogue root and `polivni-sistemi` direction, and verified absence on homepage and plant category. Preview browser QA additionally verified equipment product and individual irrigation service inclusion, and launcher absence on planting service.
- Engineering specification: `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md`. No hydraulic solver, Gemini API endpoint/secret, Sanity schema changes, D1 changes or cart integration were implemented in this follow-up.


Date: 2026-11-15  
Base commit: `18d9b8a3b7b242e0e2b3ba787ad85771bf9bb653`  
Branch: `feat/irrigation-assistant-foundation`

## Implemented in this branch

- Added a persistent, compact, circular floating launcher on the left side of storefront pages, with a responsive hint and keyboard focus styling.
- The launcher retrieves the existing published Sanity photo document `309c6f57-7fd9-406a-ba32-3778a65ee3dd`, slug `inzhener-polivni-sistemi`, rather than copying or changing the service photo.
- Added the separate route `/irrigation-assistant`; server middleware sets `noindex, nofollow` in the initial HTML and `X-Robots-Tag: noindex, nofollow, noarchive` before the client app runs. The page also maintains the client-side noindex metadata.
- Added the first localized BG/RU/EN wizard for lawn irrigation: plot shape, dimensions or area, water source, optional measured flow and pressure, and site notes.
- The final step displays the collected site information.


## Read-only Sanity catalogue inventory (Production, published perspective)

- Irrigation root category `vsichko-za-polivane`: ID `7f6eaa30-8085-4fae-be3c-1209a0c50fc6`.
- Sprinkler category `sprinklers`: ID `de7ecefe-0a25-41ed-8146-ce475efb2378`, 20 active published products.
- Nozzle category `nozzles`: ID `ad3914b4-5ab0-49e3-868a-52621c4654a7`, 26 active published products (17 spray-pattern / strip products and 9 R-VAN products).
- All 46 sprinkler/nozzle products have a published `priceEUR`; all 46 currently report `stockStatus: onRequest`. The helper must display the live Sanity price and must not promise immediate stock availability.
- The inspected irrigation product records have `productType: null`; product retrieval must use actual category references rather than filtering by `productType == "equipment"`.
- Published specifications contain useful technical attributes, but are not uniform: rotor models include radius, sector, operating pressure and flow ranges; 1800-series sprinkler bodies require a separately selected nozzle; many nozzle records do not expose complete flow tables. The selection engine must not infer missing flow values or assume every body includes a nozzle.
- This is a read-only catalogue inspection. No Sanity documents or schema were changed.

## Engineering and commercial boundary

This checkpoint is an intake interface, **not an automatic hydraulic design or a finished product configurator**. It deliberately does not calculate sprinkler quantities, zones, pipe diameters, product compatibility, prices or a bill of materials. Those require verified technical data for each product family and an explicit hydraulic selection model. The UI states this limitation instead of presenting guessed quantities as engineering advice.

The next implementation stage must:
1. inspect published irrigation products and their actual Sanity specifications/compatibility fields;
2. define and test hydraulic rules for sprinkler spacing, coverage, flow, pressure, zones and pipe losses;
3. map calculated requirements to currently published products and prices;
4. add the selected products to the existing Florial cart using the existing cart contract;
5. validate the result against representative real-world site cases before enabling purchase recommendations.


## Manufacturer performance references for the next engineering stage

Use the current metric performance tables, not just the simplified range strings in product descriptions:

- [Rain Bird 3500 Series Rotor Technical Specification](https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf) — pressure/nozzle/radius/flow/precipitation tables.
- [Rain Bird 5000 Series Rotor Performance Charts](https://www.rainbird.com/sites/default/files/media/documents/2020-09/5000-series-rotor-nozzle-performance-chart.pdf) — nozzle-specific operating data.
- [Rain Bird R-VAN Nozzle Performance Charts](https://www.rainbird.com/sites/default/files/media/documents/2020-09/r-van-nozzles-performance-charts.pdf) — arc-specific pressure, radius, flow and precipitation data.
- [Rain Bird HE-VAN Series Performance Charts](https://www.rainbird.com/sites/default/files/media/documents/2018-02/chart_HE-VAN.pdf) — pressure, arc, radius, flow and precipitation data.
- [Rain Bird 1800 Series Spray Sprinklers](https://www.rainbird.com/products/1800-series-spray-sprinkler-he-van-nozzles) — 1800 bodies accept separate spray nozzles; the nozzle is not included with many body SKUs.
- [Rain Bird 5000 Series product specifications](https://www.rainbird.com/products/5000-series) — published radius, pressure and flow operating ranges.

These are manufacturer references for the calculation dataset. Before implementation, verify that each selected Sanity SKU corresponds to the exact model/version in the performance table, and record the tested operating point (pressure, radius, flow, arc and precipitation). Do not combine incompatible precipitation families in one zone without a documented design reason.

## Scope and safety

- No Sanity document or schema writes.
- No D1, order, checkout, Resend, Cloudflare setting, binding, secret or DNS changes.
- No Header, navigation menu or Footer component changes.
- The application shell is extended only to mount the launcher and resolve the dedicated assistant route.
- The Pages middleware adds a route-scoped noindex response for `/irrigation-assistant`; no other route behavior is changed.
- Photo source is queried read-only from Sanity Production.

## Verification status

- Initial implementation CI passed on source commit `05bfecd02f290dc79fbe52a4513660d30a0a8f45`.
- Server-side noindex hardening is in commit `850574b7814a7d6678539b7d57e46d90837229b9`; exact-head CI is required again before merge.
- Production deployment and live visual QA: not performed in this branch.
