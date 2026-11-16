# Rain Bird HE-VAN dataset implementation

Date: 2026-11-16  
Implementation branch: `feat/irrigation-rvan-performance-priority`  
Base main: `76be044bbed3f097e288263d57ac59cee469d24a`

## Manufacturer source

Rain Bird HE-VAN Series Nozzles Performance Charts, metric tables, 2023 International Turf Catalog pages 39–41:  
https://www.rainbird.com/media/4172

## Dataset contents

64 discrete operating rows across HE-VAN-8, HE-VAN-10, HE-VAN-12 and HE-VAN-15. Each model includes 90°, 180°, 270° and 360° arcs at 1.03, 1.38, 1.72 and 2.07bar. Rows preserve manufacturer radius, flow (L/min and m³/h), square/triangular precipitation, model trajectory and exact Sanity nozzle SKU/document binding.

Lookup requires exact model, pressure and arc. No interpolation, extrapolation or nearest-point substitution is used. The source notes zero-wind test conditions and 50%-of-throw-diameter square/triangular spacing. For arcs below maximum, the radius-reduction screw may need adjustment to achieve the tabulated radius and flow.

## Florial role

HE-VAN is recorded as the lower-cost alternative to the owner-preferred R-VAN family. This is not an assertion that the families are interchangeable. Their pressure ranges, throw radii, flow, precipitation and patterns differ; comparison must be geometry-specific and use compatible bodies and exact operating points.

The HE-VAN dataset is nozzle performance only. It does not confirm that an integrated UNI-Spray SKU or a selected 1800 body is the correct assembly. No Sanity price is copied into code; current price must be resolved live from the catalogue when commercial comparison is implemented.

## Files

- `src/lib/irrigation/rainBirdHevanPerformanceData.mjs`
- `src/lib/irrigation/rainBirdHevanPerformanceData.d.mts`
- `tests/irrigation-hevan-performance-data.test.mjs`
