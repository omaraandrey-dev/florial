# Lawn layout sampled-coverage acceptance hardening

Date: 2026-11-16
Base main: 4fad859a5b4ee17f38915944d6706d1f76f82d65

## Purpose

The first scenario matrix checked that the solver accepted 4m, 5m, 6m and 8m-wide rectangles and several L-shape orientations, was deterministic and passed head-to-head diagnostics. It did not require those additional scenarios to return `coverage_complete_sampled`. This follow-up makes the acceptance criterion explicit rather than treating non-empty sample generation as proof of coverage.

## Test changes

- Require 100% sampled coverage and zero uncovered samples for 12m × 4/5/6/8m R-VAN18 rectangles at 0.25m sample spacing.
- Require 100% sampled coverage and zero uncovered samples for original, axis-swapped and reversed-winding L-shapes.
- Add a finer-resolution check at 0.125m for the baseline rectangle and L-shape, alongside the 0.25m check.
- Continue asserting deterministic output, head-to-head spacing and `hydraulicFeasibility === 'not_evaluated'`.

## Interpretation

A passing result proves only that all points in the specified deterministic sample set are covered and head-to-head diagnostics pass. It is not a continuous coverage proof, hydraulic approval, overspray check or precipitation-uniformity assessment. A failing finer-grid case is useful evidence of a sample-resolution sensitivity or candidate-layout gap and must be resolved before expanding the accepted geometry envelope.

## Validation

Exact-head CI results must be recorded after the PR checks complete. No Sanity, D1, Cloudflare settings, secrets, Gemini, cart or Production changes are included.

## Release result

- PR #319 merged into `main` as `df1592ba5519d75487cff030ae8b165a11d5ec35`.
- Exact PR head: `bcb1d5399612e33069dbc1c11f37fa21eaf37c26`.
- Blog and Studio validation run `43821654485` — success, including application/Pages TypeScript, lint, utility tests, website build, migration checks, Studio TypeScript and Studio build.
- D1 migration validation run `43821654670` — success.
- Cloudflare Pages Production deployment `d69f3379-bb36-4a1b-ba95-3114b35b5ba3` was triggered for exact merge commit `df1592ba5519d75487cff030ae8b165a11d5ec35`; an initial check saw deploy active, and a subsequent read-only recheck confirmed all stages succeeded and aliases `florial-bg.com` / `www.florial-bg.com` were assigned. This PR changes tests and audit documentation only; no runtime application code was changed.
