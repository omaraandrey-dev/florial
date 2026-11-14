# Florial — consent-based analytics and PostHog

Status: implementation proposal in PR; not released to Production.
Date: 14.11.2026
Base: `main` at the time the feature branch was created.

## Scope

- Adds a BG/RU/EN analytics consent panel to public storefront and legal pages.
- The visitor can explicitly allow or reject analytics. A persistent on-page settings control allows changing the choice later.
- The choice is stored in localStorage under `florial:analytics-consent:v1`. If storage is unavailable or no choice exists, analytics stays disabled.
- Existing Cloudflare D1 tracking (`/api/track`) now records page views, phone clicks and chat clicks only after consent.
- PostHog events are sent directly to the EU ingestion endpoint `https://eu.i.posthog.com/i/v0/e/` only after consent and only when the build variable is configured.
- PostHog receives a random in-memory identifier that is not stored in cookies or browser storage. It groups events only in the current browser tab until the page is reloaded.
- Events currently implemented: `florial_page_view`, `florial_phone_click`, `florial_chat_click`, `florial_product_view`, `florial_category_view`, `florial_cart_view`, `florial_add_to_cart`, `florial_checkout_start`.
- Product/cart event properties are limited to language, page path, product type and quantity. No SKU, product name, order number, order contents, customer name, phone, email, address or form text is sent.
- The Manager route is not mounted with the public consent component and does not send these events.
- No session replay, heatmaps, autocapture or advertising tracking is implemented.

## PostHog configuration

Set the following variable in Cloudflare Pages for the Production build only after review:

- `VITE_POSTHOG_PROJECT_KEY` — the public project ingestion key for the Florial PostHog project (project ID 349453).

Do not put a personal API key or a secret API token in frontend code. The variable is optional: if it is absent, consent controls and consent-gated D1 analytics still work, while PostHog transmission remains disabled.

PostHog project configuration should keep session recordings disabled, IP anonymization enabled, and broad autocapture/heatmaps disabled. Verify these settings in the PostHog project before enabling the key.

## Important implementation details

- No third-party analytics script is loaded before consent.
- No PostHog cookie or persistent distinct ID is created by this integration.
- The browser sends analytics requests without credentials and with a no-referrer policy.
- D1 and PostHog both remain disabled for analytics unless the saved choice is exactly `accepted`.
- The existing technical rate-limiting controls remain separate from optional analytics.
- Consent choice is not a consent to marketing or advertising.

## Release gates — do not merge/deploy until checked

1. Run GitHub CI (build, lint and tests) and inspect all results.
2. Add `VITE_POSTHOG_PROJECT_KEY` to Cloudflare Pages build environment only after the owner approves activation.
3. Verify in browser network tools that no `/api/track` or PostHog requests occur before consent and after rejection.
4. Verify that accepting enables only the documented events; rejecting or withdrawing stops new events immediately.
5. Verify that `/manager` does not render the consent panel or send public analytics events.
6. Check the current PostHog Data Processing Agreement, EU hosting/region, subprocessors, retention and any international access/transfer safeguards.
7. Obtain Bulgarian legal review of the BG/RU/EN privacy notice and consent wording, including the applicable ePrivacy requirements. The policy wording in this PR is a technical disclosure draft, not legal advice.
8. Only after approval, merge and deploy; then test live BG/RU/EN pages and confirm actual PostHog ingestion.

## Known limits

- The banner is a lightweight analytics consent control, not a full CMP and not a control for all third-party embeds. YouTube embeds still require a separate assessment and possible click-to-load treatment.
- The consent record is stored in localStorage; if the visitor clears site storage, the banner will appear again.
- Existing service providers and technical security processing are not controlled by this optional analytics preference.
- The current PostHog event scope intentionally excludes detailed product identifiers and order values. Additional commerce analytics requires a separate privacy review.
