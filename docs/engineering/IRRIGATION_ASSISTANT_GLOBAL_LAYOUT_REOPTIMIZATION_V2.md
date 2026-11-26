# Historical note — global layout re-optimization v2 (superseded)

**Status:** superseded on 2026-11-26 by the owner-requested sequential rectangle/shared-coverage algorithm.

The v2 global relocation and circular R-VAN group-replacement approach was not accepted by the owner because it produced worse layouts than the previous algorithm. Do not continue or restore its whole-layout relocation, R-VAN group replacement, symmetry-orbit deletion, or balanced-candidate replacement optimizer.

The code-level v2 implementation was reverted on `develop` to the pre-v2 global optimizer baseline from commit `27e2c227186e50f9ac8654ca33b9801954a19735`. The 16×16 m five-head pattern is retained only as a validated rectangular seed candidate in the rectangle solver, not as part of the rejected global relocation optimizer.

The replacement design and current implementation are documented in:

- `docs/engineering/IRRIGATION_ASSISTANT_SEQUENTIAL_RECTANGLE_SHARED_COVERAGE_V1.md`

This historical document is retained for traceability only. Production `main` was not changed.
