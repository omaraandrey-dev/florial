# Florial — first-party D1 statistics and optional PostHog analytics

Status: PR #264 merged to `main` and deployed to Production. PostHog ingestion remains inactive until the public project key is configured.
Date: 14.11.2026
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
- Events sent to PostHog: `florial_page_view`, `florial_phone_click`, `florial_chat_click`, `florial_product_view`, `florial_category_view`, `florial_cart_view`, `florial_add_to_cart`, `florial_checkout_start`.
- PostHog uses a random in-memory identifier, not a persistent cookie or browser-storage identifier. It groups events only within the current tab until reload.
- Event properties are limited to language, page path, product type and quantity where applicable. No SKU, product name, order number, order contents, customer name, phone, email, address, form text or order values are sent.
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
- At last inspection, PostHog reported IP anonymization enabled and session recordings disabled. No PostHog events had been ingested from Florial.
- `VITE_POSTHOG_PROJECT_KEY` was not present in the Cloudflare Pages Production environment at the last verified configuration read. The Cloudflare API read showed secret values masked; do not rewrite the full env-var map because that could overwrite existing secrets.
- Configure the public key through the Cloudflare dashboard UI or a safe additive mechanism that preserves all existing Production variables and secrets. Do not change Preview unless separately requested.

## Privacy and retention follow-ups

- The public BG/RU/EN notice now distinguishes D1 baseline events from optional PostHog analytics and states that D1 automatic deletion is not currently configured.
- The stated legitimate-interest basis for D1 must be supported by a documented balancing test (LIA) before treating it as legally confirmed.
- Confirm and implement a concrete D1 retention period, including an appropriate cleanup mechanism.
- Review PostHog's DPA, retention, subprocessors and international access/transfer safeguards; obtain Bulgarian legal review of the privacy notice and consent wording, including applicable ePrivacy requirements.
- These technical changes do not constitute legal advice or a conclusion that consent is never required for any analytics processing.

## Verification plan

1. Reject optional PostHog analytics in a clean browser profile.
2. Confirm `/api/track` still receives and stores the four baseline event types in D1.
3. Confirm no request is sent to `eu.i.posthog.com` after rejection.
4. Accept PostHog analytics and confirm a request reaches the EU ingestion endpoint.
5. Verify the event schema in PostHog, then add dashboard charts using only observed event names.
6. Confirm the Footer privacy-settings link reopens the panel in BG/RU/EN.

## Previous production releases

- PR #262 consent panel: merge commit `19ace984706900b51560cefb244ea56db76de79a`; deployment `69918c8b-a8df-4906-a2fd-66ce9046148b`.
- PR #263 Footer settings link: merge commit `7de2f80c8aba37f814b00a09e568ea6a0f689830`; deployment `486393c0-8bf2-4566-8977-dfa85ae21b9d`.
- The D1/PostHog separation and revised consent/privacy text described here are active on Production. PostHog ingestion itself remains inactive because `VITE_POSTHOG_PROJECT_KEY` is not configured.
