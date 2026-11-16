# Catch-can lower-quarter distribution uniformity calculation

Date: 2026-11-16
Base main: 631e7c9f2070c0a0b093be84ccb157622acd02eb

## Purpose

Add a small deterministic utility to calculate measured lower-quarter distribution uniformity (DUlq) from catch-can volumes or depths. This supports field validation and does not estimate sprinkler performance from manufacturer average precipitation tables.

## Formula

DUlq = average of the lowest 25% of catch-can measurements / average of all catch-can measurements.

The lowest-quarter count is rounded upward to the next whole sample for sample counts not divisible by four. Measurements must be non-negative, finite, in one consistent unit and equally weighted by sample area. Zero readings are valid; a set whose overall mean is zero is invalid.

A result from fewer than 24 catch cans is still calculated but receives a warning that the recommended professional audit sample count was not met. This is a guidance threshold, not a mathematical minimum for the formula.

## Sources

- New Mexico State University, H-510: recommends a minimum of 24 catch cans for reliable results and describes the lowest-quarter/overall-average calculation: https://pubs.nmsu.edu/_h/H510/index.html
- Rain Bird HE-VAN technical sheet defines DUlq using the lowest quarter of catch-can measurements divided by the average of all measurements: https://www.rainbird.com/sites/default/files/media/documents/2018-02/ts_HE-VAN.pdf
- NSW DPI example rounds 26 catch cans / 4 up to 7 lowest-quarter cans: https://www.dpi.nsw.gov.au/__data/assets/pdf_file/0004/317479/Evaluating-a-lateral-move-irrigation-system.pdf

## Explicit limits

- This function calculates DUlq only from measured samples; it does not predict a future design's DUlq.
- It does not calculate scheduling coefficient (SC), midpoint uniformity, net precipitation rate or spatial maps.
- It assumes equal-area sample weighting. Non-uniform sample spacing/unequal represented areas require a separate weighted method and must not be passed as if all samples were equal.
- It does not validate catch-can placement, wind, run time, nozzle model, pressure or zone overlap.
- No DUlq threshold is hard-coded as an approval criterion; interpretation depends on sprinkler family, turf requirement and the applicable audit standard.

## Tests

Tests use the NMSU 24-can example (expected DUlq approximately 54%), non-multiple-of-four sample counts, a set below 24 cans, valid zero readings and invalid input cases.

Exact-head CI results are to be added after PR checks complete. No Sanity, D1, Cloudflare settings/secrets, Gemini, cart or Production changes are included.

## Release result

- PR #321 merged into `main` as `e8ee7bb477b2382ac60562428d8aa7e39b9b0491`.
- Exact PR head: `bc32ab7b8cc71a86fd8a007537cb41c752a8892f`.
- Blog and Studio validation run `43822321587` — success, including application/Pages TypeScript, lint, utility tests, website build, migration checks, Studio TypeScript and Studio build.
- D1 migration validation run `43822321498` — success.
- Cloudflare Pages Production deployment `ac221f58-000d-479c-a9ed-d403b416efd9` was triggered for the exact merge commit; the build stage was active at the time of this update. Deployment completion must be checked separately.
- The utility is not wired into the customer-facing assistant page. No Sanity, D1, Cloudflare settings/secrets, Gemini, cart or Production data changes were made.
