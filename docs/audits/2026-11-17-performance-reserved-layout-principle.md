# Performance principle — reserve layout space for asynchronous content

Date: 2026-11-17

## Owner-approved principle

When building or optimizing Florial pages, reserve the expected layout space before asynchronous content is rendered. Do not allow lazy-loaded page content to cause large post-load layout shifts.

Apply this principle to the relevant page regions, including:
- hero and other images (with dimensions or a stable aspect-ratio container);
- headings, introductory copy and long-form content sections;
- service/category/product cards and card grids;
- FAQ sections;
- portfolio/project cards and other below-the-fold collections;
- page-level loading states and the transition from Suspense fallback to the completed page.

Use page-specific skeleton/loading states where appropriate. Their geometry should approximate the final page structure closely enough to avoid exposing the footer or shifting major regions while the page is still loading. Prefer stable container dimensions, min-heights and aspect ratios over arbitrary spacer elements. Do not reserve excessive space without considering the final responsive layout.

## Acceptance and validation

- Treat layout stability as a design and implementation requirement, not as an optional polish step.
- Add or extend regression tests for route-specific loading fallbacks when a page is lazy-loaded and its initial fallback materially differs from its final structure.
- Validate mobile and desktop layouts at representative viewport sizes.
- Measure Core Web Vitals, especially CLS, with comparable before/after PageSpeed Insights or Lighthouse runs. A code change, successful build, CI run or deployment alone does not prove a metric improved.
- Target CLS <= 0.1; report measured values and test conditions rather than claiming success without evidence.
- Check that skeletons do not obscure content, create accessibility problems or introduce unnecessary visual delay.

## Reference implementation and outcome

The landscape architect direction page `/services/category/landshaften-arhitekt` received a route-specific Suspense loading skeleton in PR #361. The implementation reserves the main page regions while the lazy-loaded direction page is pending. The runtime change was merged and deployed to Production; see:
- PR #361: https://github.com/omaraandrey-dev/florial/pull/361
- Runtime merge commit: `dcede10a1d80b2fb38a4ba165398d69a70e57369`
- Production deployment: `5e66b391-52e5-4e2f-a734-c020c3e24a6e`
- Follow-up audit: `docs/audits/2026-11-17-landscape-direction-cls-reservation.md`

The owner subsequently confirmed that the result looked excellent. This is qualitative acceptance of the page result, not a substitute for a post-change CLS measurement. The recorded audit states that post-change PSI was not run; do not infer a numerical CLS improvement from the owner's visual confirmation.

## Scope and safeguards

This is a reusable frontend performance principle. Apply it when relevant to future page work; it does not authorize unrelated changes to Header, main navigation, Footer, global layout, routing, Sanity content/schema, Cloudflare configuration, production secrets or data. Keep changes page-scoped unless the owner separately approves broader work.
