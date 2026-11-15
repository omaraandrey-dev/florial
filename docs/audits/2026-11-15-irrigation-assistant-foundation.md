# Irrigation assistant — first implementation checkpoint

Date: 2026-11-15  
Base commit: `18d9b8a3b7b242e0e2b3ba787ad85771bf9bb653`  
Branch: `feat/irrigation-assistant-foundation`

## Implemented in this branch

- Added a persistent, compact, circular floating launcher on the left side of storefront pages, with a responsive hint and keyboard focus styling.
- The launcher retrieves the existing published Sanity photo document `309c6f57-7fd9-406a-ba32-3778a65ee3dd`, slug `inzhener-polivni-sistemi`, rather than copying or changing the service photo.
- Added the separate route `/irrigation-assistant`; the assistant page is marked `noindex`.
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

## Scope and safety

- No Sanity document or schema writes.
- No D1, order, checkout, Resend, Cloudflare setting, binding, secret or DNS changes.
- No Header, navigation menu or Footer component changes.
- The application shell is extended only to mount the launcher and resolve the dedicated assistant route.
- Photo source is queried read-only from Sanity Production.

## Verification status

- Source-level review: pending final PR review.
- TypeScript, lint, tests and Vite build: pending exact-head GitHub Actions.
- Production deployment and live visual QA: not performed in this branch.
