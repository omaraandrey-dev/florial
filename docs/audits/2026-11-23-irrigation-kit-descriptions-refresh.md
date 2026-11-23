# Ready-made irrigation kit descriptions — 2026-11-23

**Status:** 12/12 kits published; the former hold was resolved after the owner confirmed field compatibility  
**Sanity project/dataset:** `bxvcy0qs / production`  
**Category:** `Готови комплекти за поливане` — `6709cd41-18c6-4c5f-bc27-90d55d685dec`

## Scope and result

The live category contains 12 active products. A complete published snapshot of all 12 documents, including kit component references and quantities, was saved before editing:

- `docs/backups/sanity-kits-current-2026-11-23-complete.json`

Twelve products are now published. The 10 × 5 m kit was initially held, then its descriptions were corrected after the owner confirmed from personal installation experience that the newer 100-HV-9V production version works with ESP-BAT-BT1.

### Published products (11)

- 6-zone automation kit.
- 8-zone automation kit.
- 12-zone automation kit.
- Economical kit for a typical garden.
- Standard kit for a typical garden.
- Super-economical manual kit.
- 5 × 5 m hose-end timer kit.
- 5 × 5 m easy kit.
- 10 × 10 m easy kit.
- 15 × 5 m kit.
- 20 × 5 m kit.

### Resolved product (formerly held)

**10 × 5 m irrigation kit** — published after the owner confirmed the controller/valve pairing from personal installation experience.

The published component list remains unchanged:

- 1 × Rain Bird ESP-BAT-BT1 controller (one zone).
- 1 × Rain Bird 100-HV-9V solenoid valve (product SKU H01040).
- 6 × Rain Bird 1804 bodies and 6 × R-VAN-18 nozzles.
- 1 × VBA02672 valve box and the listed fittings.

The kit's full and short descriptions were corrected in BG/RU/EN: the controller is ESP-BAT-BT1 (not WPX1), and the 100-HV-9V compatibility statement is limited to production versions manufactured on or after 01.01.2026, with a suitable 9 V DC latching solenoid. No compatibility is claimed for earlier versions. SEO descriptions and keywords were aligned with the actual component list.

The separate product cards were also synchronized in BG/RU/EN:

- Valve H01040: the old blanket incompatibility statements were replaced with the date-limited compatibility condition.
- Controller ESP-BAT-BT1: the valve compatibility section now explicitly includes 100-HV-9V versions manufactured from 01.01.2026, subject to the suitable 9 V DC latching solenoid.
- The corresponding compatibility specification values were aligned with the descriptions.

The owner-provided confirmation is the basis for the model-specific compatibility statement; it is not represented as a newly published Rain Bird manufacturer bulletin.

**No controller, valve, solenoid or kit component was replaced.** Kit component references and quantities remain unchanged.

## Fields updated on the 12 published products

- Bulgarian `description` Portable Text.
- Russian and English `formattedDescription`.
- Bulgarian, Russian and English short descriptions.

Each locale now has five H2 sections, two verified internal links, and the required delivery/service paragraph:

- Econt delivery to office or address throughout Bulgaria.
- Engineer delivery may be arranged in Nessebar and the Burgas area.
- Installation, adjustment and repair are available for an additional fee.

The links were verified against published Sanity routes:

- `/category/gotovi-komplekti-za-polivane`
- `/blog/etapi-montazh-avtomatichna-polivna-instalatsiya`

The 5 × 5 m standard kit short description was corrected: the actual component is the Rain Bird 1ZEHTMR hose-end timer with an integrated valve, not WPX1 with a separate 9 V valve. The 10 × 10 m easy kit now identifies the same 1ZEHTMR timer explicitly. The 5 × 5 m easy kit retains the warning that the HE-VAN-15 nozzles supplied may differ from the product image.

## Technical data preserved in the descriptions

### ESP-TM2 automation kits

The 6-, 8- and 12-zone kits list the corresponding ESP-TM2 controller, the matching number of Rain Bird 100-HV 24 V AC valves and VBA02672 valve boxes, plus an RSD-BEx rain sensor. The 12-zone model is identified as ESP-TM2I12-230.

The descriptions retain the 230 V AC, 50 Hz controller supply and 24 V AC valve output. Wi-Fi requires a separately purchased LNK2 module. The main PE supply pipe and controller-to-valve cable are not listed as included components.

### ESP-TM2-4i garden and 15 × 5 / 20 × 5 m kits

The descriptions retain the published kit layouts, quantities, 24 V AC valve type and stated water-source condition of 3 m³/h at 3.5 bar where that condition appears in the existing product card. The main PE Ø25 mm pipe and electrical cable are not listed as included.

### 1ZEHTMR hose-end timer kits

The 5 × 5 m and 10 × 10 m kits use the Rain Bird 1ZEHTMR timer with an integrated valve. The descriptions state one zone, two start times per cycle and up to six hours per cycle. Two AA batteries are required and are not included. These values are consistent with Rain Bird's current product page.

The existing water-source conditions were retained: up to 1.5 m³/h at a minimum of 3.5 bar for the 5 × 5 m kits, and up to 2.2 m³/h at a minimum of 3.5 bar for the 10 × 10 m kit. These values were not recalculated.

### Manual and typical-garden kits

The super-economical kit is explicitly described as manual: three ball valves, no automatic controller and no solenoid valves. The economical and standard garden kits retain the three-area layouts and the existing stated 3 m³/h at 3.5 bar water-source condition. No hydraulic calculations were performed.

## Verification

- Live active category count: **12**.
- Edited and published: **12**.
- Held unchanged: **1** (10 × 5 m).
- Sanity validation: **11 valid**; `complete=false` because the available validation tool does not execute custom callbacks such as custom slug `isUnique`. Built-in checks ran.
- Published read-back completed for all 11 edited products.
- Every edited locale has five H2 sections, two internal links and Econt delivery wording.
- The live `kitComponents` arrays were compared with the pre-write snapshot for all 11 edited products: **11/11 unchanged**.
- Draft count across all 12 target products after publication: **0**.

## Manufacturer references

- [Rain Bird ESP-TM2 Series Controllers](https://www.rainbird.com/products/esp-tm2-series-controllers) — programs, start times, 230 V AC international input, 24 V AC output, LNK2 sold separately.
- [Rain Bird Easy-to-Program Hose-End Timer — 1ZEHTMR](https://www.rainbird.com/products/easy-program-hose-end-timer-international) — one zone, two AA batteries not included, two start times, up to six hours per cycle.

## Exclusions

No `kitComponents`, component quantity, product price, stock status, product identity, image, category reference, Sanity schema, application code, Cloudflare, D1, Resend or Production infrastructure was changed in this compatibility-copy update. The kit SEO descriptions and keywords were updated in the prior kit correction; the valve/controller compatibility copy and corresponding specification values were updated in this follow-up. No hydraulic calculations were performed.
