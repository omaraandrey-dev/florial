# Rain Bird 5000 MPR — manufacturer data implementation audit

**Date:** 2026-11-16  
**Base main:** `77ee6047879db9112ea0eee7c542aa1e795ebcc9`  
**Branch:** `feat/rain-bird-5000-mpr-performance-data`  
**Status:** code-owned exact manufacturer dataset candidate; no layout solver integration or catalogue mapping.

## Executive result

The official Rain Bird 5000 MPR nozzle chart provides a stronger starting point for rotor-engine development than the standard 3500/5000 nozzle tables:

- Three matched-radius nozzle families: 25 ft, 30 ft and 35 ft.
- Four explicit arc-specific nozzle patterns: Quarter (90°), Third (120°), Half (180°) and Full (360°).
- Five exact pressure points: 1.7, 2.4, 3.1, 3.8 and 4.5 bar.
- 60 exact metric operating rows (3 radius classes × 4 arc patterns × 5 pressures).
- Each row includes radius, flow and square/triangular precipitation.
- Manufacturer identifies the MPR nozzle pack as `5000MPRMPK`, with the 25/30/35 radius trees and Q/T/H/F patterns.
- Manufacturer states that the MPR nozzle families are intended to provide matched precipitation and can be used with 5000/5000 Plus rotors.

This supports an exact, discrete manufacturer-data lookup. It does **not** yet enable an automatic layout, hydraulic design or purchasable Florial BOM.

## Manufacturer evidence

1. **5000 Series MPR Nozzle Performance Charts**  
   https://www.rainbird.com/sites/default/files/media/documents/2020-09/5000-series-mpr-nozzle-performance-chart.pdf

   The chart identifies the 5000MPRMPK nozzle tree pack, the 25/30/35 ft radius classes and Q/T/H/F arc patterns. It publishes the 60 exact metric operating points transcribed into the code-owned dataset. It also records square/triangular spacing based on 50% of throw diameter, zero-wind test conditions and ASABE S398.1.

2. **Rain Bird 5000 Series MPR Nozzles product page**  
   https://www.rainbird.com/products/5000-series-mpr-nozzles

   The product page describes three nozzle trees for 25, 30 and 35 ft radius classes; each tree includes Quarter, Third, Half and Full arc nozzles. It identifies compatibility with 5000 and 5000 Plus Series rotors and matched precipitation positioning.

3. **Rain Bird 5000 / 5000+ Series product page**  
   https://www.rainbird.com/products/5000-series

   The rotor series supports adjustable part-circle/full-circle operation and documents the broader 5000 family specifications. The MPR data remains tied to its own exact nozzle tree; it must not be generalized to standard-angle, low-angle or PRS nozzles.

## Dataset implementation

Files added:

- `src/lib/irrigation/rainBird5000MprPerformanceData.mjs`
- `src/lib/irrigation/rainBird5000MprPerformanceData.d.mts`
- `tests/irrigation-rain-bird-5000-mpr-performance-data.test.mjs`

Lookup requires an exact match for:
- radius class (25, 30 or 35 ft);
- arc (90°, 120°, 180° or 360°);
- pressure (1.7, 2.4, 3.1, 3.8 or 4.5 bar).

No interpolation, extrapolation, nearest-point fallback or inferred 270° point is allowed. The lookup returns `null` for unsupported combinations.

## Practical radius observations

The exact published radius bands are:

- 25 ft class: 7.0–7.6 m;
- 30 ft class: 8.8–9.1 m;
- 35 ft class: 9.8–10.7 m.

The 30 and 35 ft classes therefore cover the owner's practical 9 m+ rotor range. These are manufacturer table values, not site recommendations; the selected point still depends on actual nozzle pressure, geometry, precipitation matching and the water network.

## Explicit solver limitations

The existing Florial layout solver generates 90°, 180°, 270° and 360° heads and currently supports only R-VAN/HE-VAN families. The 5000 MPR table has 90°, 120°, 180° and 360° data; it does not provide a 270° point.

Therefore:
- Do not add 5000 MPR to the current solver family union as a one-line change.
- Do not substitute 120° data for 90° or 270° candidates.
- Do not derive a 270° flow or precipitation point from another arc.
- A separate rotor/MPR candidate generator is required. Reflex L-shape corners and arbitrary boundaries need an independently validated placement strategy using the supported MPR arcs.
- The existing head-to-head and sampled-coverage checks are not proof of rotor distribution uniformity or boundary overspray.

## Florial catalogue boundary

The previously audited published Florial inventory contains standard rotor records such as 5004PC30 and 5004+FC, but no confirmed published MPR nozzle-tree product mapping. The standard 5004PC30 record indicates a 3.0 nozzle; it is not the same thing as a selected 5000-MPR-25/30/35 nozzle tree. The 5004+FC nozzle configuration also remains unconfirmed.

The code dataset deliberately records `florialSanityProductMapping: not_verified`. No Sanity writes or product changes were made. Do not create a purchasable proposal from this dataset until the exact rotor SKU, MPR nozzle pack SKU, package contents, published Sanity product IDs, compatibility and current commercial data are verified.

## Verification plan

- Run the complete website Node test suite, TypeScript checks, lint and website build on the exact PR head.
- Validate all 60 rows and every exact lookup combination.
- Confirm unsupported 270° and non-table pressure inputs return no operating point.
- Review the future MPR candidate-generation strategy separately before connecting it to the assistant UI.
- Keep hydraulic feasibility, pipe losses, zoning, overspray, DU/SC, field performance and BOM status as not evaluated.

## Non-claims

This implementation is a code-owned transcription of manufacturer performance data with exact lookup. It does not claim a layout has been calculated, a zone is hydraulically feasible, a product is available in Florial's catalogue, a 5000 MPR package is stocked, or a real design has passed engineer review. No Sanity, D1, Resend, Gemini, cart, Cloudflare settings/secrets or Production changes were made.
