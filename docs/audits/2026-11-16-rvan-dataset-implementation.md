# Rain Bird R-VAN dataset and Florial selection preference

Date: 2026-11-16  
Implementation branch: `feat/irrigation-rvan-performance-priority`  
Base main: `76be044bbed3f097e288263d57ac59cee469d24a`  
Scope: code-owned manufacturer data and owner-approved family preference only.

## Owner-approved selection direction

- For small residential lawns, especially plots around 5m wide, prefer Rain Bird R-VAN as the primary rotary nozzle family.
- HE-VAN remains a lower-cost alternative only where geometry, coverage, precipitation compatibility, pressure, flow and body compatibility all pass.
- For rotor applications, prefer Rain Bird 3500 for the common 6–8.5m practical radius range; 8.5–9m is conditional. Consider 5000 above approximately 9m only after exact nozzle configuration and hydraulic/network checks.
- These ranges are Florial owner engineering preferences, not manufacturer limits and not automatic selector thresholds.
- The user's field experience is recorded as owner preference/provenance; it is not misrepresented as a manufacturer test result.

## Manufacturer dataset

Source: Rain Bird R-VAN Rotary Nozzles Technical Specifications, document D41159B, 2024:  
https://www.rainbird.com/sites/default/files/media/documents/2025-10/026549_rb_rvantechspecsheet_metric_f.pdf

The code dataset includes 108 discrete manufacturer rows:
- R-VAN14 / 18 / 24 adjustable patterns: 90°, 180°, 210°, 270° × six exact pressures;
- R-VAN14-360 / 18-360 / 24-360: six exact pressure rows each;
- LCS / RCS / SST strip models: six exact pressure rows each.

The dataset preserves radius or strip dimensions, flow, square and triangular precipitation, pressure, model identity, tested body height, zero-wind conditions, spacing basis and source revision. Lookup is exact only: no interpolation, extrapolation or nearest-point substitution. Mechanical adjustable-arc range (45°–270°) is not confused with the subset of arcs for which this table provides discrete performance rows.

## Florial catalogue bindings

All nine published R-VAN nozzle models are bound to their existing Sanity product ID and SKU in the code-owned dataset. This binding does not certify a complete body/nozzle assembly.

Rain Bird specifies testing on 10.2cm pop-up bodies and recommends 1800/RD1800 bodies with 3.1bar pressure regulation for optimum performance. The currently audited Florial body catalogue did not confirm an 1800 PRS-45 model. Therefore this dataset does not enable automatic product selection or hydraulic approval by itself.

## Important hydraulic boundary

R-VAN's per-head flow may be lower than another nozzle's at a particular compared operating point, but the number of heads per zone is determined by total zone demand and the pressure remaining at every nozzle after pipe, valve, filter, regulator, fitting and elevation losses. A lower per-head flow alone does not prove that a larger zone is feasible.

The R-VAN data states 2.1–3.8bar operating range and 3.1bar recommended operating pressure. The selector must use the exact selected performance point and prove pressure at the nozzle; it must not confuse source pressure with nozzle pressure.

## Files added

- `src/lib/irrigation/rainBirdRvanPerformanceData.mjs`
- `src/lib/irrigation/rainBirdRvanPerformanceData.d.mts`
- `src/lib/irrigation/rainBirdSelectionPreference.mjs`
- `tests/irrigation-rvan-performance-data.test.mjs`

## Status

Code-owned source dataset and owner preference are implemented on this branch. This is not yet a layout solver, coverage validator, hydraulic zone solver, catalogue configurator, customer recommendation, cart integration or production release. Exact body/regulator compatibility and the complete nozzle/body bill of materials remain separate engineering gates.
