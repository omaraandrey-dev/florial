# Lawn irrigation engineering — merge and next-stage gate

Date: 2026-11-16

## Released implementation

- PR #317 was squash-merged into `main` as `95c32aa4570499b61252f92fc8755e25ee314856`.
- PR head: `3077a720f62b1ff9d1954875ec16f1e9dc702903`; base: `76be044bbed3f097e288263d57ac59cee469d24a`; 23 commits ahead, 0 behind at merge preflight.
- Exact PR-head GitHub Actions: Blog and Studio validation run `43819093067` — success; D1 migration validation run `43819094228` — success.
- Cloudflare Pages Production deployment `3b39ef74-3fc8-46a3-8cd0-e4cf36d6fbdb` deployed the exact merge commit `95c32aa4570499b61252f92fc8755e25ee314856`; queued, initialize, clone, build and deploy stages all succeeded. Production aliases include `florial-bg.com` and `www.florial-bg.com`.
- Browser visual QA of the irrigation assistant and physical-site watering validation were not performed by this release.

## Delivered code scope

- Exact Rain Bird R-VAN and HE-VAN discrete manufacturer performance lookups; no interpolation, extrapolation or nearest-point substitution.
- Owner preference recorded separately from manufacturer evidence: R-VAN is prioritized for suitable small residential lawns; HE-VAN is only a conditional lower-cost alternative.
- Deterministic sampled placement for one confirmed rectangle or orthogonal L-shape, with R-VAN and HE-VAN calculated separately.
- Output includes sprinkler coordinates, arc/direction, exact operating-point radius/flow/precipitation, sampled coverage, uncovered sample diagnostics, total flow and independent head-to-head spacing checks.
- Scenario tests cover 4m, 5m, 6m and 8m widths, repeatability, mirrored/rotated/reversed L-shapes and reflex-corner heads.

## Engineering boundaries

- The result is sampled geometric coverage, not continuous mathematical proof, not a globally minimal layout and not an approved design.
- Hydraulic feasibility, dynamic source pressure, pipe/valve/filter/fitting losses, zone sizing, precipitation uniformity, overspray, wind and exact body/nozzle assembly compatibility remain unevaluated.
- R-VAN's 3.1bar recommended pressure is not proof that this pressure is available at each nozzle. The audited catalogue did not confirm an 1800 PRS-45 body SKU.
- Do not infer a complete nozzle/body bill of materials from a nozzle SKU alone.
- Do not infer precipitation uniformity from average manufacturer precipitation values alone.

## Manufacturer-data gate for Rain Bird 3500

Official Rain Bird D42378 states that the 3500 can be adjusted from 40° to 360°. Its performance table explicitly says precipitation rates are based on half-circle operation; therefore the current 3500 dataset must not be used to claim measured 90°/270°/360° precipitation or to scale precipitation by arc. Before 3500 enters the placement solver, separately resolve:
1. which Florial SKU/package supplies the exact rotor and nozzle tree;
2. whether radius and flow rows can be used unchanged for other arc settings;
3. how non-180° precipitation is represented, or whether the first supported solver is deliberately restricted to 180°;
4. boundary overspray and the required sector orientation for corners/reflex corners.

Source: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf

## Precipitation-uniformity gate

Rain Bird's HE-VAN technical sheet defines lower-quarter distribution uniformity (DUlq) from catch-can measurements and reports an average DUlq of 70% and scheduling coefficient (SC) no greater than 1.6. Rain Bird's R-VAN product page states testing at or above 0.65 DU for California MWELO compliance. These are manufacturer-level performance statements; they are not per-layout simulated values and do not establish the DU of a Florial installation.

Sources:
- https://www.rainbird.com/sites/default/files/media/documents/2018-02/ts_HE-VAN.pdf
- https://www.rainbird.com/products/r-van-rotary-nozzles

A credible layout-specific uniformity assessment needs either manufacturer radial-distribution/catch-can profiles for the exact nozzle, pressure and arc, or field catch-can data from an engineer-reviewed test arrangement. Do not produce a numeric DU/SC estimate from a binary radius-sector coverage model or from average precipitation alone.

## Next roadmap sequence

1. Keep the current R-VAN/HE-VAN result explicitly preliminary and obtain engineer-reviewed reference layouts for representative rectangles and L-shapes.
2. Resolve the 3500 data/package/arc gate before adding 3500 to automatic placement.
3. Define a precipitation-uniformity validation method using supported manufacturer distribution profiles or catch-can measurements.
4. Only then begin hydraulic zoning and pipe-loss calculations, using measured dynamic flow/pressure and actual pipe, fitting, valve, filter, regulator and elevation data.
5. Integrate live Sanity price/stock and complete body/nozzle assemblies only after engineering eligibility is proven.

No Sanity, D1, Resend, Cloudflare configuration, secret, Gemini or cart changes were made.
