# Manager UX — responsive navigation shell

**Date:** 2026-11-18  
**Branch:** `feature/manager-ux-navigation-shell`  
**Base:** `main` at `3b7177d88423fccdc562383bba25774d13932223`  
**Implementation commit:** `af58afc8e0b48acf322c6af710de75c7d9b4e302`

## Scope

First implementation increment from the approved Manager UX plan. It changes the authenticated Manager presentation shell only:

- Replaces the crowded horizontal tab strip with grouped navigation: primary work and administration.
- Uses a left vertical navigation rail on desktop and a horizontally scrollable navigation strip on narrow screens.
- Gives navigation controls consistent minimum 44px height, visible keyboard focus, active state and `aria-current`.
- Replaces the plant-specific top-level heading with the product name, Florial Manager, and keeps the signed-in user's role visible on larger screens.
- Expands the working canvas to a responsive maximum width while preserving the existing module components.
- Moves the plant-catalog primary action to the page header on desktop while retaining a fixed, thumb-reachable bottom action on mobile; avoids showing both placements at once.

## Permission and data boundaries

- Existing role and permission predicates were retained verbatim for all navigation entries.
- No permission model, server-side authorization, API, D1 schema/data, Sanity data/schema, Cloudflare settings/secrets, Resend, public Header, public navigation or Footer was changed.
- No new Manager route or public navigation link was added.
- All Manager UI copy remains Bulgarian.

## Verification

- Source review: completed against the stated base commit and current ManagerApp implementation.
- Local build/typecheck/lint: **not run**. The execution environment could not resolve `github.com`, so the repository could not be cloned for local validation.
- GitHub Actions: pending pull-request run.
- Cloudflare Pages Preview is not available for feature branches according to the repository's recorded project setting; no preview deployment or authenticated browser visual QA is claimed.

## Next increments

1. Validate desktop and mobile navigation with Owner, Manager and Seller accounts, including keyboard focus and narrow viewport overflow.
2. Improve plant catalog list controls and the plant editor's information hierarchy.
3. Improve order list/detail layout and shared patterns for service leads and contract withdrawals.
4. Only after each increment is verified, consolidate release notes in the shared changelog and technical passport.
