# Florial irrigation assistant — balanced zones and order PDF v1

Date: 2026-11-22  
Implementation branch: `feat/irrigation-balanced-zones-project-pdf`

## Scope

This change completes two owner-approved improvements to the existing Rain Bird R-VAN lawn assistant:

1. Mix perimeter and interior sprinkler heads in the same operating zone, regardless of 90°, 180°, 270° or 360° arc.
2. Carry the exact project snapshot used to build the irrigation kit through checkout, persist it with the D1 order, generate a separate preliminary PDF and email it to the owner after the order is successfully saved.

The work does not add a new checkout, alter product pricing, modify Sanity documents, change the D1 schema, or send the irrigation PDF to the customer.

## 1. Zone assignment

The six-head maximum is a grouping standard, not proof of hydraulic feasibility.

### Deterministic order

- Perimeter sprinklers are ordered from the top-right water connection along the existing perimeter walk.
- Interior sprinklers follow in row-major order (top to bottom, left to right).
- All heads are then combined into one ordered sequence. Arc, model and perimeter/interior source are not independent zone boundaries.

### Balanced partition

The minimum number of zones is `ceil(headCount / 6)`. Heads are distributed as evenly as possible across those zones while preserving the sequence. Earlier zones receive one additional head when the division has a remainder.

Examples:

- 14 heads → 5 + 5 + 4
- 13 heads → 5 + 4 + 4
- 12 heads → 6 + 6
- 8 heads → 4 + 4

Every zone contains at most six heads. A zone is labelled `mixed` when it contains both perimeter and interior heads. Pipe route direction is determined per sprinkler source, not from the zone label, so a mixed zone may have forward and reverse schematic branches while remaining one operating zone.

The BOM independently validates complete unique membership, minimum zone count, maximum capacity and balanced zone sizes before allowing cart handoff.

## 2. Project snapshot and checkout contract

When the customer adds the complete kit to the cart, the assistant creates a versioned snapshot containing:

- project type, creation time and UI language;
- approximate geometry, dimensions, polygon, area and perimeter;
- Rain Bird model and manufacturer reference pressure;
- sprinkler IDs, coordinates, radii, arcs, model and perimeter/interior source;
- balanced zone membership;
- schematic main/zone routes and pipe diameters;
- BOM SKU quantities;
- engine warnings.

The snapshot remains in the current application session and is passed with the order request. The cart displays that a project is attached. If the customer changes the quantity or removes a SKU belonging to the generated kit, the application detaches the snapshot so an outdated plan is not sent. Adding unrelated products does not invalidate the kit snapshot.

The order endpoint validates the snapshot independently. It checks schema version, geometry bounds, sprinkler count/coordinates/arcs, unique zone membership, six-head capacity, balanced partition, BOM shape and exact BOM SKU quantities against the server-resolved order items. Invalid or stale project metadata is ignored; it must not prevent a valid customer order from being saved.

## 3. D1 persistence without a migration

After the order is successfully inserted into `orders`, the validated snapshot is stored as JSON metadata in the existing `order_events` table with event type `irrigation_project_attached`.

- No D1 table, column, index, trigger or migration is added.
- The event records schema/PDF version and delivery status.
- The event is attached to the actual order ID and order number.
- Snapshot persistence failure is logged; the order remains saved and no PDF email is attempted without a persisted snapshot.

Delivery status values include `stored`, `sent`, `failed`, `owner_email_not_configured` and `email_not_configured`.

## 4. Owner PDF and email

The backend generates a separate A4 PDF from the validated, persisted snapshot after the order is saved. It includes:

- lawn outline and sprinkler positions with zone numbers;
- geometry and approximate dimensions;
- manufacturer model/reference pressure;
- every sprinkler's coordinates, arc and model;
- mixed/balanced zone assignments;
- schematic pipe routes and assumed diameters;
- BOM SKU quantities;
- explicit assumptions, warnings and engineering limitations.

The PDF is sent only to the configured owner notification address through the existing Resend email helper. It is not attached to the customer confirmation email and is not mixed with the order proforma. A stable Resend idempotency key is used per order. PDF/email failure is best-effort: it does not roll back or lose the saved order, and the event delivery status is updated where possible.

## 5. Engineering limits shown in the PDF

The document is a preliminary geometry/project handoff, not an approved hydraulic or installation design. It explicitly states that it does not calculate or verify:

- dynamic inlet pressure or available flow;
- pressure at each nozzle under simultaneous operating flow;
- friction/minor losses, velocity or residual pressure;
- hydraulic suitability of six heads on a valve;
- precipitation uniformity (DU/CU), wind or overspray;
- obstacles, exclusions, trench routing or actual pipe lengths;
- the complete mainline/accessories/installation BOM.

The reference pressure from the Rain Bird table is not represented as measured site pressure. Existing Florial standards remain assumptions.

## 6. Safety and release boundaries

- No Sanity writes are part of this task.
- No D1 schema migration or live D1 configuration change is required.
- No Production order or test email is created for QA.
- Existing proforma generation and customer order email behavior remain separate and unchanged.
- CI and Preview evidence must refer to the exact PR head SHA.
- Browser-based visual QA remains the owner's action unless separately authorized.

## 7. Verification scenarios

- 12 heads remain 6 + 6.
- 13 heads become 5 + 4 + 4.
- 14 heads become 5 + 5 + 4, including a zone with both perimeter and 360° interior heads.
- 8-head mixed BOM remains complete with 4 + 4 zones and unchanged total per-head/per-zone SKU quantities.
- Invalid or stale BOM quantities, duplicated sprinkler IDs, unbalanced groups, >6 heads and malformed geometry are rejected as project metadata.
- Successful checkout persists the snapshot and sends a separate owner-only PDF with an idempotency key.
- PDF/email failure does not fail the already persisted order.

## 8. Files

- `src/lib/irrigation/irrigationProjectStandards.mjs`
- `src/lib/irrigation/irrigationBillOfMaterials.mjs`
- `src/pages/IrrigationAssistantPage.tsx`
- `src/App.tsx`
- `src/pages/CartPage.tsx`
- `src/services/orderService.ts`
- `functions/api/orders.ts`
- `functions/api/_lib/irrigation-project.mjs`
- `functions/api/_lib/irrigation-project-pdf.ts`
- `tests/irrigation-project-standards.test.mjs`
- `tests/irrigation-bom.test.mjs`
- `tests/irrigation-project-order.test.mjs`
