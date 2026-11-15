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
