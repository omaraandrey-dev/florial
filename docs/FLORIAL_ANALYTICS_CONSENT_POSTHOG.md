# Florial — consent-based analytics and PostHog

Status: consent-gated D1 analytics is deployed to Production; PostHog ingestion remains inactive.
Date: 14.11.2026
Production merge: PR #262, commit `19ace984706900b51560cefb244ea56db76de79a`.
Production deployment: Cloudflare Pages deployment `69918c8b-a8df-4906-a2fd-66ce9046148b`.

## Scope

- A BG/RU/EN analytics consent panel is mounted on public storefront and legal pages; the Manager route is excluded.
- Visitors can explicitly allow or reject analytics. Until a choice is made, analytics stays disabled.
- The choice is stored in localStorage under `florial:analytics-consent:v1`. If storage is unavailable or no choice exists, analytics stays disabled.
- Existing Cloudflare D1 tracking (`/api/track`) records page views, phone clicks and chat clicks only after consent.
- Optional PostHog events are sent directly to the EU ingestion endpoint `https://eu.i.posthog.com/i/v0/e/` only after consent and only when the build variable is configured.
- PostHog receives a random in-memory identifier that is not stored in cookies or browser storage. It groups events only in the current browser tab until the page is reloaded.
- Events currently implemented: `florial_page_view`, `florial_phone_click`, `florial_chat_click`, `florial_product_view`, `florial_category_view`, `florial_cart_view`, `florial_add_to_cart`, `florial_checkout_start`.
- Product/cart event properties are limited to language, page path, product type and quantity. No SKU, product name, order number, order contents, customer name, phone, email, address or form text is sent.
- No session replay, heatmaps, autocapture or advertising tracking is implemented.

## Consent settings entry point

- The initial consent panel offers allow/reject choices in Bulgarian, Russian and English.
- After a choice, there is no floating settings button. The visitor can reopen the same consent panel using the small text link `Настройки за поверителност` / `Настройки конфиденциальности` / `Privacy settings` in the public site Footer.
- The Footer link dispatches `florial:open-analytics-settings`; the consent component listens for that event and opens the existing panel. The choice and analytics gating logic are unchanged.
- The link's fallback destination is the localized Privacy Policy page if client-side interaction is unavailable.

## PostHog configuration

Set the following variable in Cloudflare Pages for the Production build only after review and separate owner approval:

- `VITE_POSTHOG_PROJECT_KEY` — the public project ingestion key for the Florial PostHog project (project ID 349453).

Do not put a personal API key or a secret API token in frontend code. The variable is optional: if it is absent, consent controls and consent-gated D1 analytics still work, while PostHog transmission remains disabled.

PostHog project configuration should keep session recordings disabled, IP anonymization enabled, and broad autocapture/heatmaps disabled. Verify these settings in the PostHog project before enabling the key.

## Important implementation details

- No third-party analytics script is loaded before consent.
- No PostHog cookie or persistent distinct ID is created by this integration.
- The browser sends analytics requests without credentials and with a no-referrer policy.
- D1 and PostHog analytics remain disabled unless the saved choice is exactly `accepted`.
- The existing technical rate-limiting controls remain separate from optional analytics.
- Consent choice is not a consent to marketing or advertising.

## Production verification and open gates

- PR #262 was merged to `main`; Production deployment `69918c8b-a8df-4906-a2fd-66ce9046148b` completed successfully.
- Live homepage HTML contained the Bulgarian consent panel labels. Owner manually confirmed in Incognito that rejecting closes the panel and that the settings entry point remains available.
- The exact interactive acceptance/revocation network behavior has not yet been independently inspected in browser DevTools.
- `VITE_POSTHOG_PROJECT_KEY` is not configured; actual PostHog ingestion is therefore inactive.
- Before enabling PostHog: check the current PostHog Data Processing Agreement, EU hosting/region, subprocessors, retention and international access/transfer safeguards; obtain Bulgarian legal review of the BG/RU/EN privacy notice and consent wording, including applicable ePrivacy requirements. The privacy wording is a technical disclosure draft, not legal advice.
- YouTube embeds are not controlled by this analytics consent component and require a separate assessment.

## Known limits

- This is a lightweight analytics consent control, not a full CMP or a control for all third-party embeds.
- The consent record is stored in localStorage; if the visitor clears site storage, the panel will appear again.
- Existing service providers and technical security processing are not controlled by this optional analytics preference.
- The current PostHog event scope intentionally excludes detailed product identifiers and order values. Additional commerce analytics requires a separate privacy review.
