# Florial — introduction video on the irrigation direction page

Date: 2026-11-16  
Implementation PR: #305  
Production merge commit: `5ff280711c0b8926e420a2594428941085fc2824`  
Documentation integration PR: #306, merged as `392807b9312632c586bff98e609518d111be4dae`  
Base for documentation integration: `25089e19d98656b529b028d9b48053c53d872970`

## Owner-approved media

- HeyGen video title: `Florial — Intelligent Irrigation`.
- HeyGen video ID: `b83867d35fde41fd9de9d92f477e857b`.
- HeyGen Video Agent session: `69f59f9b2b294406bdd0d15d4f495d79`.
- Duration: 60.3314 seconds (60.33 s); owner reviewed and approved the duration and overall result. Do not shorten or regenerate without a new request.
- Language: Bulgarian narration and Bulgarian captions.
- Format: landscape 16:9; user avatar as presenter; Florial original logo in the closing frame.
- Video page: https://app.heygen.com/videos/b83867d35fde41fd9de9d92f477e857b
- Video Agent project: https://app.heygen.com/video-agent/69f59f9b2b294406bdd0d15d4f495d79

## Website implementation

- Added to `src/pages/ServiceDirectionPage.tsx`, guarded by `direction.id === 'irrigation'`.
- Public route: `/services/category/polivni-sistemi`.
- Localized heading and accessibility label for BG/RU/EN; RU and EN explicitly state that the video is in Bulgarian.
- Native responsive HTML5 player, `controls`, `playsInline`, `preload="metadata"`; no autoplay.
- Source used by the player (captioned MP4 returned by HeyGen):
  `https://resource2.heygen.ai/aws_pacific/avatar_tmp/a325ce0213c54e69b093be6054dc6c3e/vc1b997e189a34b6183aa7cf5251491cd/caption_b83867d35fde41fd9de9d92f477e857b.mp4`
- The player is not added to other service directions, product/category pages or global site chrome.

## Git and CI evidence

- PR #305 merged by squash; merge commit: `5ff280711c0b8926e420a2594428941085fc2824`.
- Runtime files changed: `src/pages/ServiceDirectionPage.tsx`, `tests/service-direction-pages.test.mjs`.
- Regression test verifies irrigation-only visibility, the exact video source, metadata preload, inline playback and Bulgarian-language notice.
- Exact-SHA Blog and Studio validation: GitHub Actions run `43785923727`, completed successfully. This included app/Pages typecheck, lint, website tests/build, migration dry-run and Studio typecheck/build.
- Exact-SHA D1 migration validation: GitHub Actions run `43785923863`, completed successfully.
- Cloudflare Pages Preview deployment: `04fc4a5c-5f04-4f2c-ab72-9727c5152bde`, URL https://04fc4a5c.florial.pages.dev, deploy stage succeeded for the PR head.
- Cloudflare Pages Production deployment: `8631bee8-93f6-432c-9e99-83dcaf989ef3`, URL https://8631bee8.florial.pages.dev, deploy stage succeeded for exact commit `5ff280711c0b8926e420a2594428941085fc2824`; aliases included https://florial-bg.com and https://www.florial-bg.com.
- Production deployment was independently read back from Cloudflare Pages and confirmed as latest/canonical at the time of verification.

## Scope and exclusions

- No Sanity documents/schema, D1 schema/data, orders, Resend, Cloudflare bindings/secrets/DNS, Header, menu, Footer or global routing were changed.
- No video was uploaded to Florial-controlled object storage in this implementation.
- The media URL contains the HeyGen `avatar_tmp` path. Long-term URL availability/retention has **not been confirmed**; treat as an open operational risk and verify with the provider before relying on it as permanent hosting.
- Direct browser visual/playback QA on a physical mobile/desktop browser was not completed. The Firecrawl browser request could not run because the connected account had insufficient credits. Do not report visual QA as passed.
- The website deployment and exact-SHA CI passed; these do not prove that every browser/device can fetch and play the remote media.

## Follow-up

1. Verify real playback on desktop and mobile (BG page, and RU/EN localized routes) when browser QA is available.
2. Confirm HeyGen asset retention and whether the `avatar_tmp` URL is stable. If not, propose a durable Florial-controlled hosting option (for example, approved Cloudflare storage) with file size, cache, range-request and subtitle checks before any upload.
3. Do not change Cloudflare secrets/bindings or upload media to production storage without explicit approval.
