# Manager Web Push self-test diagnostics — 2026-11-21

## Problem and verified baseline

The Owner-only Manager self-test previously returned only aggregate `attempted`, `accepted` and `failed` counts. An Owner-reported result of 0 accepted from 1 subscription therefore did not identify whether the failure occurred during local payload/VAPID signing, provider HTTP handling, or network transport.

## Implementation

PR #455 changed the shared sender result and the Owner self-test response to return safe per-subscription diagnostics:

- `signing / payload_signing_failed`: payload/VAPID signing failed before the provider request.
- `provider / provider_http_error`: provider returned a non-success HTTP response; the status code is returned.
- `provider / subscription_expired`: provider returned HTTP 404 or 410; the expired subscription is removed as before and the UI instructs the Owner to disable/re-enable notifications.
- `network / network_timeout`: the provider request timed out.
- `network / network_error`: a transport or unexpected request failure occurred.

The Manager displays Bulgarian guidance for VAPID/signing, provider authorization (401/403), payload/subscription rejection (400/413), rate limiting (429), expired subscriptions, timeout and network failures.

## Privacy and safety

- No subscription endpoint, p256dh/auth key, VAPID public/private value, request body or raw provider response body is returned.
- Only the bounded error name, phase, category and numeric HTTP status are exposed.
- No durable logging table or D1 migration was added.
- No Production settings/secrets, D1 schema/data, orders, service leads, Sanity or Resend were changed.
- The assistant did not invoke the authenticated Owner test endpoint; no Production push test was sent.

## Validation evidence

- PR: [#455](https://github.com/omaraandrey-dev/florial/pull/455).
- Merge commit: `675079b6d3f00e9eb24f5af1fa439a912606a175`.
- Blog and Studio validation run `44886370993`: success (TypeScript, lint, Node tests, build, migration checks, Studio typecheck/build).
- D1 migration validation run `44886313079`: success (lint, build, Pages Functions syntax and migration checks).
- Cloudflare Pages Preview deployment `7f7a68f8-d6d2-438a-858d-6be7635d860d`: success from exact PR head `4f9a5bac329c591d96a884b2614a50c525ba8712`.
- Cloudflare Pages Production deployment `e81f8261-1e92-4b4c-bbb6-ca43bee0260a`: success from exact merge commit; aliases `florial-bg.com` and `www.florial-bg.com`.
- Production `/manager/`: HTTP 200, `noindex,nofollow,noarchive`.
- Unauthenticated Production GET `/api/manager/push/subscriptions`: HTTP 401, `Authentication required`.

## Remaining acceptance test

The Owner must run the fixed self-test from the deployed Manager on the subscribed Android/Chrome device and report the complete Bulgarian diagnostic text. Provider acceptance is not proof of visible Android notification delivery. If provider acceptance is positive but no notification appears, continue with browser/device permission and service-worker delivery checks. If a provider error is shown, use its phase/category/status to select the next targeted fix.
