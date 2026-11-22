# Irrigation automation selection after the lawn assistant

Status: implementation prepared on branch `feat/irrigation-automation-selection`; PR/CI and owner visual review pending. Source catalogue was read-only; no Sanity documents were changed.

## Customer flow

After the generated irrigation kit is reviewed, the customer opens a separate automation-choice step before anything is added to the cart. Four choices are available:

- Manual operation: no controller and no electromagnetic valve SKU in the assistant-generated BOM. The existing zone boxes and connection fittings remain in the BOM.
- Rain Bird ESP-TM2: wired controller. The selected catalog variants are outdoor-mount 4/6/8 station models. Keep standard 100-HV valves. Show a clear requirement to route control cable from the controller to the solenoid valves; cable length/product and installation labour are not auto-priced.
- Rain Bird ESP-RC2: Wi-Fi controller. The selected catalog variants are indoor-mount 4/6/8 station models. Keep standard 100-HV valves. Show both requirements: stable Wi-Fi at the controller location and a control cable from controller to solenoid valves. Cable length/product and installation labour are not auto-priced.
- Rain Bird ESP-BAT-BT: battery/Bluetooth controller. Replace the ordinary BOM valve with Rain Bird 100-PGA-9V (SKU B31440), one per irrigation zone. Do not use 100-HV-9V (SKU H01040): its published Sanity description explicitly says it is incompatible with ESP-BAT-BT.

Each option displays real Sanity product images, model/name, unit price, quantity, line total and total automation cost. Prices are read at runtime from published Sanity documents; they are not hardcoded. All checked products currently have `stockStatus=onRequest`, so this is a catalogue price, not a live stock confirmation.

## Published Sanity products checked

Dataset: `production`; perspective: `published`; project: `bxvcy0qs`. Query was read-only.

| Family | SKU | Published name/model | Price EUR | Image | Stock |
|---|---|---|---:|---|---|
| TM2 outdoor 4 | F54224 | ESP-TM2, 4 zones, outdoor | 249.08 | yes | onRequest |
| TM2 outdoor 6 | F54226 | ESP-TM2, 6 zones, outdoor | 286.90 | yes | onRequest |
| TM2 outdoor 8 | F54228 | ESP-TM2, 8 zones, outdoor | 352.55 | yes | onRequest |
| RC2 indoor 4 | F56154 | ESP-RC2 Indoor, 4 zones, Wi-Fi | 205.45 | yes | onRequest |
| RC2 indoor 6 | F56156 | ESP-RC2 Indoor, 6 zones, Wi-Fi | 229.33 | yes | onRequest |
| RC2 indoor 8 | F56158 | ESP-RC2 Indoor, 8 zones, Wi-Fi | 267.21 | yes | onRequest |
| BAT-BT 1 | ESP-BAT-BT1 | ESP-BAT-BT, 1 zone | 144.26 | yes | onRequest |
| BAT-BT 2 | ESP-BAT-BT2 | ESP-BAT-BT, 2 zones | 200.59 | yes | onRequest |
| BAT-BT 4 | ESP-BAT-BT4 | ESP-BAT-BT, 4 zones | 243.96 | yes | onRequest |
| BAT-BT 6 | ESP-BAT-BT6 | ESP-BAT-BT, 6 zones | 295.32 | yes | onRequest |
| BAT-compatible valve | B31440 | Rain Bird 100-PGA-9V, 1 inch, 9 V DC latching solenoid | 141.27 | yes | onRequest |

Other catalogue variants were found but are not the selected defaults: TM2 indoor SKUs F54234/F54236/F54238; RC2 outdoor 8-zone SKU F56128 (442.58 EUR). The current UI uses TM2 outdoor and RC2 indoor variants to keep one clear default per controller family. Revisit if owner wants an indoor/outdoor selector.

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

- Published Florial Sanity document B31440 is Rain Bird 100-PGA-9V. Its BG/RU/EN description and specifications identify a 9 V DC latching solenoid and compatibility with battery controllers that support a 9 V latching-solenoid output.
- Published Florial product H01040 (100-HV-9V) explicitly states that it is not compatible with ESP-BAT-BT.
- Rain Bird's official ESP-BAT-BT product page states that the controller requires a 9 V DC latching solenoid (TBOSPSOL) and lists PGA valves among compatible valve series when fitted with that solenoid; it explicitly excludes the 100-HV-9V version. Source: https://www.rainbird.com/products/esp-bat-bt
- The selected B31440 product is the catalogue's PGA 9V latching valve for battery-powered controllers. The cart does not add a separate TBOSPSOL SKU because no separate TBOSPSOL product was found in the published Florial catalogue.

## Order and PDF persistence

The final selected BOM, controller SKUs, station capacities, assigned zone numbers, BAT valve SKU/quantity, cable requirement and Wi-Fi requirement are included in the versioned project snapshot. The order endpoint validates automation type, controller SKU/capacity/zone allocation, valve compatibility and BOM quantities against server-resolved order lines. The existing D1 `order_events.metadata` storage is reused; no migration is introduced.

The owner project PDF includes the selected control type, controller models and quantities, zones per controller, compatible BAT valve, server-resolved catalogue prices and the separate cable/Wi-Fi installation notes. Order/proforma line pricing continues to be calculated by the existing server-side Sanity price resolution.

## Verification boundary

- No Sanity writes, D1 migrations/data writes, Cloudflare settings/secrets changes, Production orders or test emails were performed as part of implementation.
- CI, Pages Preview deployment, PDF generation in a real order and owner inbox delivery must be checked after the PR is created.
- Browser visual QA is not performed automatically; owner review is required.
