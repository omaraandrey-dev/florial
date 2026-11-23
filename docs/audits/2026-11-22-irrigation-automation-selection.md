# Irrigation automation selection after the lawn assistant

Status: PR #481 merged into `main` at `1ce629772e8a1e3f7be6d0af6d20d60e76849202`; Production deployment succeeded. Source catalogue was read-only; no Sanity documents were changed.

## Customer flow

After the generated irrigation kit is reviewed, the customer opens a separate automation-choice step before anything is added to the cart. Four choices are available:

- Manual operation: no controller, electromagnetic valve SKU or VBA02672 valve box is included in the assistant-generated BOM. Other pipe fittings remain in the BOM.
- Rain Bird ESP-TM2: wired controller. The selected catalog variants are outdoor-mount 4/6/8 station models. Keep standard 100-HV valves. Show each valve as a separate priced line (one per zone) in the automation option. State that a control cable is required from controller to solenoid valves; do not mention separately priced cable installation labour.
- Rain Bird ESP-RC2: Wi-Fi controller. The selected catalog variants are indoor-mount 4/6/8 station models. Keep standard 100-HV valves. Show each valve as a separate priced line (one per zone) in the automation option. State that stable Wi-Fi and a control cable are required; do not mention separately priced cable installation labour.
- Rain Bird ESP-BAT-BT: battery/Bluetooth controller. Replace the ordinary BOM valve with Rain Bird 100-HV-9V (SKU H01040), one per irrigation zone. Use only the updated HV bonnet manufactured from 30 June 2025 and a compatible TBOSPSOL 9 V DC latching solenoid; older HV bonnet revisions are not compatible.

Each option displays real Sanity product images, model/name, unit price, quantity, line total and total automation cost. Prices are read at runtime from published Sanity documents; they are not hardcoded. All checked products have `vatIncluded=true` and `stockStatus=onRequest`: the UI prices include VAT, while stock availability is still confirmed on request.

## Published Sanity products checked

Dataset: `production`; perspective: `published`; project: `bxvcy0qs`. Query was read-only.

| Family | SKU | Published name/model | Price EUR | Image | Stock |
|---|---|---|---:|---|---|
| TM2 indoor 4 | F54234 | ESP-TM2, 4 zones, indoor | catalogue price resolved live | yes | onRequest |
| TM2 indoor 6 | F54236 | ESP-TM2, 6 zones, indoor | catalogue price resolved live | yes | onRequest |
| TM2 indoor 8 | F54238 | ESP-TM2, 8 zones, indoor | catalogue price resolved live | yes | onRequest |
| RC2 indoor 4 | F56154 | ESP-RC2 Indoor, 4 zones, Wi-Fi | 205.45 | yes | onRequest |
| RC2 indoor 6 | F56156 | ESP-RC2 Indoor, 6 zones, Wi-Fi | 229.33 | yes | onRequest |
| RC2 indoor 8 | F56158 | ESP-RC2 Indoor, 8 zones, Wi-Fi | 267.21 | yes | onRequest |
| BAT-BT 1 | ESP-BAT-BT1 | ESP-BAT-BT, 1 zone | 144.26 | yes | onRequest |
| BAT-BT 2 | ESP-BAT-BT2 | ESP-BAT-BT, 2 zones | 200.59 | yes | onRequest |
| BAT-BT 4 | ESP-BAT-BT4 | ESP-BAT-BT, 4 zones | 243.96 | yes | onRequest |
| BAT-BT 6 | ESP-BAT-BT6 | ESP-BAT-BT, 6 zones | 295.32 | yes | onRequest |
| BAT valve selected by owner | H01040 | Rain Bird 100-HV-9V, 1 inch, 9 V DC latching solenoid | 58.89 | yes | onRequest |

Other catalogue variants were found but are not selected: TM2 outdoor SKUs F54224/F54226/F54228 and RC2 outdoor SKU F56128. Owner decision (2026-11-23): use indoor TM2 SKUs F54234/F54236/F54238; keep RC2 indoor SKUs F56154/F56156/F56158.

## Controller allocation rules

### TM2 and RC2

- 1–4 zones: 1 × 4-station controller.
- 5–6: 1 × 6.
- 7–8: 1 × 8.
- 9: 1 × 6 + 1 × 4.
- 10–12: 2 × 6 (owner-approved rule; do not optimize 10 zones to 6+4).
- 13–14: 1 × 8 + 1 × 6.
- 15–16: 2 × 8.
- Higher counts use the smallest controller count and then the least excess capacity, preferring larger models on ties.

### BAT-BT

- 1: 1 × 1.
- 2: 1 × 2.
- 3–4: 1 × 4.
- 5–6: 1 × 6.
- 7–8: 1 × 6 + 1 × 2.
- 9–10: 1 × 6 + 1 × 4.
- 11–12: 2 × 6.
- 13–14: 2 × 6 + 1 × 2.
- 15–18: 3 × 6.
- Higher counts use 1/2/4/6-station controllers with minimal controller count and then least excess capacity.

Controller zone allocations are recorded as explicit sequential zone-number lists in the project snapshot.

## BAT valve compatibility evidence

- Published Florial Sanity document H01040 is Rain Bird 100-HV-9V, priced at €58.89, VAT included, stock status `onRequest`, with a product image. Its title identifies it as a valve for battery controllers, while an older paragraph in the published description still says it is incompatible; that content discrepancy has not been changed in Sanity.
- Rain Bird's current compatibility guidance says HV valves manufactured on or after 30 June 2025 are compatible with ESP-BAT-BT when fitted with the TBOSPSOL 9 V DC latching solenoid; older HV bonnet revisions are not compatible. Source: https://www.rainbird.com/esp-bat-bt-designed-for-the-field
- Rain Bird's ESP-BAT-BT product page still carries a generic note that it is not compatible with 100HV9V, so compatibility depends on the updated bonnet revision and correct TBOSPSOL fitment, not merely the 9 V coil label. Source: https://www.rainbird.com/products/esp-bat-bt
- Owner-selected cart product: H01040 (100-HV-9V), one per zone. The product is added by SKU and priced from the published Sanity record; before supply, confirm the stock batch has the updated bonnet and the compatible TBOSPSOL solenoid. No separate TBOSPSOL product was found in the published Florial catalogue, and no Sanity writes were made.

## Order and PDF persistence

The final selected BOM, controller SKUs, station capacities, assigned zone numbers, BAT valve SKU/quantity, cable requirement and Wi-Fi requirement are included in the versioned project snapshot. The order endpoint validates automation type, controller SKU/capacity/zone allocation, valve compatibility and BOM quantities against server-resolved order lines. The existing D1 `order_events.metadata` storage is reused; no migration is introduced.

The owner project PDF includes the selected control type, controller models and quantities, zones per controller, compatible BAT valve, server-resolved catalogue prices and the separate cable/Wi-Fi installation notes. Order/proforma line pricing continues to be calculated by the existing server-side Sanity price resolution.

## Verification boundary

- No Sanity writes, D1 migrations/data writes, Cloudflare settings/secrets changes, Production orders or test emails were performed as part of implementation.
- CI, Pages Preview deployment, PDF generation in a real order and owner inbox delivery must be checked after the PR is created.
- Browser visual QA is not performed automatically; owner review is required.


## Release verification

- PR #481 head `71cf237e5523dc18dc9594816a26499ada2bc2cc`: Blog/Studio validation run `45053370930` — success; D1 validation run `45053357011` — success.
- Pages Preview deployment `97fc94d3-ca3b-4ff0-8a0e-33111b86ae63` — success from the exact PR head.
- PR #481 squash-merged to main at `1ce629772e8a1e3f7be6d0af6d20d60e76849202`.
- Cloudflare Pages Production deployment `eb9110fc-1b98-41cc-8b65-a63272cf8049` — success from the exact merge SHA; aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- No Sanity writes, D1 migration/data writes, Cloudflare settings/secrets changes, Production orders or test emails. Owner visual review of the latest live revision and safe checkout/E2E remain unverified; Browser was not used.


## Owner corrections (2026-11-23)

- TM2 customer default is the indoor-mount model family (F54234/F54236/F54238), not outdoor models. RC2 remains indoor (F56154/F56156/F56158).
- TM2 and RC2 automation cards display controller(s) and standard 100-HV valves separately, including quantities, current catalogue unit prices and line totals. The automation total includes both.
- Manual mode excludes valves, valve boxes, 25 × 1-inch valve adapters (IQ21120M0N25D) and the 25-25-25 manifold tee (IQ2142000N250). It does not add fittings that belong only to an automated valve manifold.
- TM2/RC2 notes only state the control-cable requirement (and Wi-Fi requirement for RC2); no separately charged installation-labour wording.
- Flex lateral planning range is 0.5–1.5 m per sprinkler. The current sales estimate uses 0.5 m per head and the product is sold only in 30 m coils: one coil for up to 60 heads, then additional coils by the same 0.5 m planning baseline. Cutting/selling by the metre is not implemented.
