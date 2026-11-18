# Florial — first-party D1 statistics and optional PostHog analytics

## Manager on-demand analytics integration — implementation in progress (18.11.2026)

- A separate protected endpoint `GET /api/manager/analytics-posthog?days=1|7|30|90` and Manager UI block are being added. The block loads only after an explicit click; it does not replace or merge the D1 baseline report.
- The endpoint queries only the five event names confirmed in the live event schema on 18.11.2026 and returns event totals, daily page views, top pages, language breakdown and approximate GeoIP countries. It does not claim unique visitor counts or conversion rates.
- Server authentication uses the existing Manager session and `canViewAnalytics` permission. The PostHog credential is server-only: `POSTHOG_PERSONAL_API_KEY` with read/query permission. It must never be exposed to browser code.
- Live Cloudflare Pages project inspection (18.11.2026) found `VITE_POSTHOG_PROJECT_KEY` as a plain-text build variable, which is the public event-ingestion key. No `POSTHOG_PERSONAL_API_KEY` secret was configured at the first inspection; the latest read-only metadata check found a server secret named `POSTHOG_API_KEY`. Existing key values were not read or exposed; no secret was added or changed.
- Therefore the UI/server integration remains unavailable until the owner provides/creates a least-privilege PostHog Personal API Key and explicitly approves storing it as the Cloudflare Pages Production secret `POSTHOG_PERSONAL_API_KEY`. Preview does not have the required production bindings and is not an acceptance environment.
- API responses are cached in the Worker isolate for five minutes to avoid repeat query bursts. Data is fetched only on demand.
- This implementation is not yet live-verified against the PostHog Query API and is not yet deployed to Production.


Status: D1 baseline tracking and optional PostHog analytics are implemented. Live PostHog ingestion from Florial was confirmed on 14.11.2026 and re-verified on 18.11.2026. The dashboard is active and contains six insight charts.
Last live verification: 18.11.2026. Historical implementation release: 14.11.2026
PR #264 merge commit: `047e03172f2571b6542adb4a0ed8d4b855df6b24`.
Production deployment: `1fd6a8da-1bdd-4222-93b4-79adc23841f3` (`https://1fd6a8da.florial.pages.dev`), successful on the exact merge commit.
PostHog project: EU project ID `349453`.
Dashboard: https://eu.posthog.com/project/349453/dashboard/1114600

## Data flow

### Cloudflare D1 — baseline site statistics

- The four existing first-party events continue to be sent to `/api/track` regardless of whether the visitor accepts or rejects optional PostHog analytics:
  - `page_view`
  - `call_bg`
  - `call_en_ru`
  - `chat_click`
- D1 stores only event type, language, page path and event timestamp in `site_events`.
- The tracking endpoint retains same-origin checks, request-size limits, event/language/path validation and rate limiting.
- The raw request IP is not written to `site_events`; Cloudflare/network security systems may still process connection metadata.
- No customer/order details, contact data, product names/SKUs, form contents or order values are sent to D1 by this tracking path.
- Automatic deletion is not currently configured for `site_events`. A concrete retention period and a documented balancing assessment for the legitimate-interest basis remain required operational/legal follow-ups.

### PostHog — optional additional analytics

- PostHog transmission remains disabled unless the visitor's stored choice is exactly `accepted`.
- A rejection does not stop the first-party D1 baseline events; it prevents the optional PostHog requests.
- **Observed in the live PostHog event schema (18.11.2026):** `florial_page_view`, `florial_category_view`, `florial_product_view`, `florial_cart_view`, `florial_add_to_cart`.
- **Present in the current tracking code but not observed in the live event schema during this check:** `florial_phone_click`, `florial_chat_click`, `florial_checkout_start`. Do not describe these as live/working events until they appear in the schema or a fresh event query.
- PostHog uses a random in-memory identifier, not a persistent cookie or browser-storage identifier. It groups events only within the current tab until reload; reload creates a new identifier. Event counts therefore are not reliable unique-visitor counts or cross-session journeys.
- Client-supplied properties include language, page path, consent version, library label and, where applicable, product type and quantity. PostHog also adds approximate GeoIP and virtual-traffic classification properties. No SKU, product name, order number, order contents, customer name, phone, email, address, form text or order values are sent.
- No PostHog SDK, session replay, heatmaps, broad autocapture or advertising tracking is implemented.

## Consent interface

- The BG/RU/EN panel explains that basic D1 statistics are recorded regardless of the optional PostHog choice, while additional PostHog events require acceptance.
- Visitors can accept or reject optional PostHog analytics.
- The choice is stored in localStorage under `florial:analytics-consent:v1`.
- After a choice, the panel can be reopened through the localized Footer link: BG `Настройки за поверителност`, RU `Настройки конфиденциальности`, EN `Privacy settings`.
- Manager routes remain excluded.
- This lightweight preference control is not a full CMP and does not control third-party embeds such as YouTube.

## PostHog project configuration

- Project ID: `349453`; EU API host: `https://eu.i.posthog.com`.
- Project public ingestion key is available from PostHog project settings. It must be used only as the public `VITE_POSTHOG_PROJECT_KEY` build variable; never use a personal API key or secret token in frontend code.
- Live ingestion is confirmed: the five Florial events above have real records in EU project `349453`. This proves the published site is transmitting events; this audit did not read or expose any Cloudflare variable value.
- Session recordings remain disabled. The current tracking implementation does not initialize the PostHog SDK and does not enable autocapture, heatmaps or recordings.
- Never use a personal API key or secret token in frontend code. Do not rewrite the full Cloudflare environment-variable map or inspect secret values as part of analytics maintenance.

## Privacy and retention follow-ups

- The public BG/RU/EN notice now distinguishes D1 baseline events from optional PostHog analytics and states that D1 automatic deletion is not currently configured.
- The stated legitimate-interest basis for D1 must be supported by a documented balancing test (LIA) before treating it as legally confirmed.
- Confirm and implement a concrete D1 retention period, including an appropriate cleanup mechanism.
- Review PostHog's DPA, retention, subprocessors and international access/transfer safeguards; obtain Bulgarian legal review of the privacy notice and consent wording, including applicable ePrivacy requirements.
- These technical changes do not constitute legal advice or a conclusion that consent is never required for any analytics processing.

## Live verification evidence — 18.11.2026

- PostHog live event schema confirms the five observed Florial events listed above.
- Existing dashboard was extended in place; it remains private (`is_shared: false`): https://eu.posthog.com/project/349453/dashboard/1114600.
- Six dashboard tiles are present: page views; categories/products; cart actions; language distribution; top pages; country map.
- All six insight tiles were refreshed and returned results with no query warnings.
- Rolling dashboard window: last 7 days (11–18 November UTC); Florial ingestion began on 14 November. 18 November is a partial day.
- Page-view totals for the observed 14–18 November period: 576. Language breakdown: BG 323, RU 247, EN 6. GeoIP country breakdown: BG 570, BE 5, UA 1. These are event counts, not unique people.
- Top observed paths: `/services` 43; `/services/landshaften-dizain` 36; `/` 34; `/services/avtomatichno-napoyavane` 29; `/category/rastenia` 24; `/services/avtomatizirano-kapkovo-napoyavane` 23; `/services/category/polivni-sistemi` 22; `/services/category/landshaften-arhitekt` 21; `/about` 15; `/blog` 15. Other paths: 314 views.
- GeoIP is approximate IP-based location, not a precise visitor address.

## Remaining verification / privacy work

- Repeat a clean-browser consent test when practical: after rejection, confirm no optional PostHog request; after acceptance, confirm EU ingestion. The code path is consent-gated, but this specific browser test was not run in this documentation/dashboard pass.
- Confirm D1 `/api/track` storage and the Footer privacy-settings link in BG/RU/EN through browser/live smoke if they are changed; this pass did not modify them.
- The tracking/consent implementation is not a full CMP and does not control third-party embeds such as YouTube.

## Previous production releases

- PR #262 consent panel: merge commit `19ace984706900b51560cefb244ea56db76de79a`; deployment `69918c8b-a8df-4906-a2fd-66ce9046148b`.
- PR #263 Footer settings link: merge commit `7de2f80c8aba37f814b00a09e568ea6a0f689830`; deployment `486393c0-8bf2-4566-8977-dfa85ae21b9d`.
- The D1/PostHog separation and revised consent/privacy text are active on Production. Live PostHog ingestion is confirmed as of 18.11.2026.
