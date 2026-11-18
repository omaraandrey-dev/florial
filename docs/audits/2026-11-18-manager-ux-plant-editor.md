# Manager UX — plant editor hierarchy

**Date:** 2026-11-18  
**PR:** #382  
**Scope:** UI-only organization of the existing plant editor.

## Changes

- Converted the six existing editor groups into native collapsible disclosure sections: photos, basic information, sizes/prices, descriptions/translations, SEO, and botanical care.
- Each section remains expanded on initial render, preserving the existing first-open editing flow. Staff can collapse sections they are not currently using.
- Added stable section IDs for future in-page navigation.
- Kept every existing input, role condition, state binding, validation rule, upload/AI workflow, save payload, API endpoint, and persistence operation unchanged.
- The existing sticky save action remains in place.

## Boundaries

- No Manager permissions, authorization, API, Cloudflare D1 schema/data, Sanity schema/documents, Cloudflare settings/secrets, Resend, public Header/navigation/Footer, or business data changed.
- No production deployment or live Manager data write was performed.
- Manager interface copy remains Bulgarian.

## Verification

- Source transformation checked: six editor sections converted; no original editor `<section>` wrappers remain in this component.
- GitHub Actions validation for the earlier navigation-shell commit `291071649e048bfc29aa6bcb4f7b06506b0f062e` passed, including website type-check, lint, tests, website build, Studio type-check and Studio build (run `44205006178`). This run does **not** cover this later editor commit.
- CI for the editor commit is pending and must be checked against its exact SHA.
- Local build/type-check not run: the execution environment cannot resolve `github.com` for repository checkout.
- Cloudflare Pages Preview is disabled for feature branches in the recorded project configuration. Browser visual QA and role-based live QA are not claimed.

## Follow-up

- Verify this exact commit in GitHub Actions.
- Continue with order list/detail layout and shared service-lead/contract-withdrawal presentation, preserving existing permissions and API behavior.
- Before merge, recheck latest `main`, open PR overlap, full diff, and mergeability. Merge and Production release require the owner's separate explicit approval.
