# Irrigation assistant breadcrumb correction

Date: 2026-11-16  
Base: `221687bf4ec7ca94053c1188a192226ca9b17c79`  
Branch: `fix/irrigation-assistant-breadcrumbs-intake`

## Problem

The assistant page displayed a standalone “Начало” button wired to the app's in-memory `onNavigateHome` callback. It did not provide the navigation context requested by the owner: a direct path back to the irrigation equipment catalogue and to the irrigation services direction.

## Change

The top navigation on `/irrigation-assistant` is now a semantic breadcrumb list with localized links:

1. Home — `/`
2. Irrigation equipment catalogue — `/category/vsichko-za-polivane`
3. Irrigation systems specialist — `/services/category/polivni-sistemi`
4. Current page — the assistant title, marked `aria-current="page"` and not linked.

All three destinations use the existing `localizedHref` helper so RU/EN retain the `lang` query parameter. Links use normal browser navigation rather than the former callback, so they remain functional on direct entry and refresh and do not depend on stale React route state.

## Scope and safety

- Changed only `src/pages/IrrigationAssistantPage.tsx`.
- No Header, menu, Footer, global routing, Sanity documents/schema, Cloudflare configuration, D1, orders, Resend or secrets changed.
- No Sanity writes.

## Verification status

- Source inspection confirms the four breadcrumb items and localized destination paths.
- Exact-head CI passed for PR #308 (Blog/Studio run 43789182046; D1 run 43789182043). Cloudflare Pages Production deployment b3134a66-bce1-4c1e-8d77-fde2231260de succeeded for final main SHA a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219. Mobile browser-rendered HTML confirmed the Bulgarian breadcrumb nav appears and page-level robots meta remains noindex,nofollow. RU/EN breadcrumb rendering, direct link click-through and desktop visual QA remain pending.
- This change does not implement the hydraulic calculation engine or product selection.
