# Rain Bird performance-data and Florial catalogue audit

Date: 2026-11-16  
Sanity project: `bxvcy0qs`  
Dataset: `production`  
Perspective: `published`  
Code baseline: `221687bf4ec7ca94053c1188a192226ca9b17c79`  
Status: read-only engineering audit; no calculator dataset or automatic selector has been released.

## 1. Published Florial inventory checkpoint

Live Sanity GROQ read, 2026-11-16:

- Sprinkler category `sprinklers`: 20 published products.
- Nozzle category `nozzles`: 26 published products.
- All 46 inspected products have a published `priceEUR`.
- All 46 have `stockStatus: onRequest`; this is not live/guaranteed stock.
- All 46 have no `productType` value. Product membership must be resolved through category references, not `productType`.
- Product/category documents were only read. No Sanity writes, drafts, schema changes or publishing operations were performed.

### Sprinkler/body catalogue mapping

| Sanity product ID | SKU | Published model |
|---|---|---|
| `97436060-98f6-430e-ba36-3fa11b085b24` | A44020 | 1802 |
| `a84929ff-e088-437c-bb33-f8ec9b2817f3` | A44120 | 1804 |
| `dac0f67b-0638-48e8-884c-10ea19cffe4d` | A43905 | 1804-SAM |
| `556bb59c-ec52-4884-b811-5687d2310343` | A44205 | 1806 |
| `4854cd78-5a9c-4b44-bcd3-1399162d572c` | A43912 | 1806-SAM |
| `5f6c0504-3cf9-4439-adda-a147d8178799` | A44305 | 1812 |
| `65730615-f75c-4c80-a5b3-2622c9997f61` | A43930 | 1812-SAM |
| `de179416-ef68-48c5-aa70-56a4c528885f` | Y34001 | 3504-PC |
| `d1a1a13d-31dc-4635-a666-21283e58abbd` | Y34500 | 3504-PC-SAM |
| `b70be356-b0cf-45a1-9e9c-82414b428122` | Y45010 | 5004+FC |
| `4d3214ae-7251-4109-8c70-2ede32ef34d0` | Y5410730MX | 5004PC30 |
| `ec9baf44-b3f5-4b96-9672-7b580b12539b` | B8120018 | 8005 |
| `b905cfab-56da-4367-b623-4e7718886ef7` | B8140018 | 8005-SS |
| `9863df6e-0a8e-4e1e-b5ae-7c6e1450493e` | B65311 | 6504-FC / Falcon FC |
| `9c6ab885-2daa-4c2c-896d-7b76814ca633` | B65301 | 6504-PC / Falcon PC |
| `bd82a0c0-b259-42d6-9b27-d2a412925513` | P40000 | US-400 (body without nozzle) |
| `d353f503-4ce8-479c-b548-771ed58d590c` | P40010 | US-410HE (with HE-VAN-10) |
| `59c0c78f-a1d7-4948-bd0f-572b82b83e54` | P40012 | US-412HE (with HE-VAN-12) |
| `16804f4a-04c9-49bd-a8c9-05c6fc612b2f` | P40015 | US-415HE (with HE-VAN-15) |
| `090dd217-badb-47a0-bbed-e7c123063f59` | P41018 | US-418 (with 18-VAN) |

### Nozzle catalogue mapping

| Sanity product ID | SKU | Published model |
|---|---|---|
| `a365a2c3-1936-4076-a7a7-ba462b21c07f` | A47007 | 15-CST |
| `ccbd32bb-7f3f-4109-8928-4518f21e7ec4` | A47006 | 15-EST |
| `f6a7da86-77fd-4b8d-b761-1d86569a12ae` | A47033A | 15-LCS |
| `c8902118-2d87-4f8d-aa3e-bbcafdc5593a` | A47034A | 15-RCS |
| `6f45d30e-1d6b-48e5-8ffd-c72faeb733b0` | A47008 | 15-SST |
| `3f5c3d95-ec09-40f7-b5ab-86337b3a362a` | A47047 | 9-SST |
| `11a27fdf-2904-40b8-9ba3-264bc22a4359` | P10004 | 4-VAN |
| `1d4a4b1d-aea5-4d1e-bd19-1f4933de98d4` | P10006 | 6-VAN |
| `21e4bb9f-c635-4d6f-882d-c9fefb70b8d3` | HE0801 | HE-VAN-8 |
| `e25925d0-b54f-45fa-844e-ad4fde8e6440` | HE1001 | HE-VAN-10 |
| `de88e310-c33d-4111-9ad6-c638b49a2ed8` | HE1201 | HE-VAN-12 |
| `63289ec9-c0dd-4f13-ae4d-1f7f00a442c6` | HE1501 | HE-VAN-15 |
| `3e435ac6-f184-4637-bf06-c34822cc93dc` | A84659 | R-VAN-14 |
| `96daa552-e9b6-4d1f-b858-c8bb24dc1cc2` | A84664 | R-VAN-14F (full circle) |
| `678c8039-dda2-4873-a7cb-98083c4ef971` | A84660 | R-VAN-18 |
| `816a0665-1e3e-484c-b08f-fdcf8a68e9d2` | A84665 | R-VAN-18F (full circle) |
| `20fce09d-ffd6-49f5-b5ca-f4945136014a` | A84661 | R-VAN-24 |
| `6eac9b54-c3e7-41b1-aa6c-560e64012ef4` | A84666 | R-VAN-24F (full circle) |
| `fce79548-830a-4bcd-9ff5-8e9a85f39ab5` | A84667 | R-VAN-LCS |
| `42f54182-8fc4-41ee-9b8c-2c50b504907d` | A84668 | R-VAN-RCS |
| `4f4a7e6b-7df5-4ee4-94f1-346b68fc75a9` | A84669 | R-VAN-SST |
| `2e200586-8866-4526-adc7-ae0becb35601` | P1001001 | VAN-10 |
| `81dfc913-3bfe-451b-9c76-fa468366cdbb` | P1001201 | VAN-12 |
| `f36e2aff-6c5b-4544-a6c0-a7c413fbb181` | P1001501 | VAN-15 |
| `a6e7016e-7bba-4078-b76c-6afefb30661d` | P10018 | VAN-18 |
| `47d220db-38af-4b22-9995-dc52de55efb7` | P10008 | VAN-8 |

## 2. Manufacturer data sources checked

All references below are Rain Bird manufacturer pages or PDFs:

- 3500 Series metric nozzle performance table (pressure, nozzle, radius, flow and square/triangular precipitation): https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- 5000 Series Rotor Nozzle Performance Charts, including standard-angle, low-angle and PRS tables: https://www-app.rainbird.com/media/4159
- R-VAN Rotary Nozzles metric technical specification, document D41159B; adjustable-arc, full-circle and strip tables: https://www.rainbird.com/sites/default/files/media/documents/2025-10/026549_rb_rvantechspecsheet_metric_f.pdf
- R-VAN 2025 updated performance chart (imperial source tables): https://www.rainbird.com/sites/default/files/media/documents/2025-10/026579_rb_rvanperformancechartupdate_basef.pdf
- HE-VAN Series performance charts, metric tables for 8/10/12/15 families and multiple arcs: https://www.rainbird.com/media/4172
- VAN Series metric performance charts, including 4/6/8/10/12/15/18 families: https://www.rainbird.com/sites/default/files/media/documents/2020-09/van-series-spray-nozzles-performance-charts.pdf
- Rain Bird 2023 International Turf Catalog, including 15 Strip Series and 9-SST metric tables: https://www.rainbird.com/sites/default/files/media/documents/2022-11/d42140_2023_intl_turf_catalog_v3_eng.pdf
- Rain Bird 1800 Series spray body specifications and pop-up heights: https://www.rainbird.com/products/1800-series-spray-sprinkler-bodies

## 3. Data readiness by family

### 3500 rotor — promising candidate, still requires a model/nozzle assembly rule

The official 3500 table contains discrete operating points at 1.7, 2.0, 2.5, 3.0, 3.5 and 3.8 bar for nozzles 0.75, 1.0, 1.5, 2.0, 3.0 and 4.0, with radius, flow and precipitation. The Sanity records 3504-PC and 3504-PC-SAM currently publish broad ranges, not the exact installed nozzle operating point.

The engine must select a specific nozzle number and pressure point, not treat the rotor SKU's broad min/max flow as one operating point. Confirm the exact contents/nozzle tree supplied with each Florial 3504 SKU before mapping a complete bill of materials.

### 5000 rotor — promising candidate, but the product-to-nozzle configuration needs confirmation

The official chart has discrete metric standard-angle and low-angle operating points. The chart explicitly says precipitation values are based on half-circle operation, with square/triangular spacing based on 50% of throw diameter and zero-wind testing.

Sanity's 5004PC30 indicates a 3.0 nozzle; this is a useful exact candidate once the full SKU configuration is checked. The 5004+FC record does not identify its installed nozzle in the fields inspected. Do not assume the same nozzle or performance point for that SKU without verifying the package configuration.

### HE-VAN and VAN spray nozzles — strong data coverage

Official metric performance charts provide discrete pressure/arc/radius/flow/precipitation values for the relevant nozzle families. The catalogue contains both standalone nozzles and integrated UNI-Spray assemblies (US-410HE, US-412HE, US-415HE and US-418).

The product model must be represented as either:
- a complete body/nozzle assembly SKU; or
- a body SKU plus a separate nozzle SKU.

Never add a second nozzle to an integrated assembly. The US-400 is explicitly a body without a preinstalled nozzle and can only be offered with a separately verified compatible nozzle.

HE-VAN/VAN tables are nozzle operating data, not proof that the same pressure exists at the water source. The design engine must calculate/verify pressure at the nozzle after all pipe, valve and elevation losses.

### 15 Strip and 9-SST nozzles — data available, geometric role is constrained

The 2023 International Turf Catalog provides metric width/length and flow at discrete pressure points for 15-EST/CST/LCS/RCS/SST and 9-SST. These are specialized strip-pattern devices, not interchangeable circular spray heads. The geometry solver must identify matching strip boundaries and orientation before these can be considered.

### R-VAN — detailed data available, but pressure and body matching are critical

The metric manufacturer specification provides discrete pressure points from 2.1 to 3.8 bar, with radius, flow and precipitation for R-VAN14/18/24 at 45°–270°, full-circle variants and strip models. The performance notes specify testing on 10.2 cm (4-inch) pop-up bodies, zero wind, and head-to-head spacing assumptions.

Rain Bird recommends 3.1 bar operating pressure for R-VAN and recommends 1800/RD1800 bodies regulated to 45 psi (3.1 bar). The current inspected Florial body catalogue contains standard 1800 models and SAM variants, but no confirmed 1800 PRS-45 body. Therefore the R-VAN family must not be automatically selected until the system can prove 3.1 bar at the nozzle or a verified regulator solution is available.

The Sanity R-VAN-14F/18F/24F names map by manufacturer SKU to R-VAN14-360/R-VAN18-360/R-VAN24-360 respectively. The strip SKU mapping is A84667=LCS, A84668=RCS, A84669=SST. Preserve the manufacturer distinction; do not infer from product title alone.

## 4. Engineering safeguards derived from the audit

1. Store manufacturer performance points as discrete records with exact source URL, document ID/revision, page/table, units and verification metadata.
2. Do not extrapolate outside a manufacturer's tested pressure range. Do not silently interpolate between performance points until an explicit engineering rule and validation tests are approved.
3. Distinguish pressure measured at the source from pressure required at the nozzle. A customer-reported source pressure is not a nozzle operating point.
4. Distinguish static pressure from dynamic pressure under measured flow. Static pressure alone cannot authorize hydraulic feasibility.
5. Do not mix precipitation families merely because their radius ranges overlap. Use manufacturer precipitation data and a documented matching tolerance.
6. Respect head-to-head spacing assumptions, arc, square/triangular layout, strip orientation and zero-wind test conditions; actual wind/site conditions may reduce confidence.
7. Do not use broad Sanity min/max flow ranges as operating points.
8. Do not mark stock as available. All 46 inspected records are `onRequest`; display current published price only after server-side read and state availability honestly.
9. Keep the 8005 and Falcon 6504 families out of the first residential-lawn candidate set until their exact nozzle/performance datasets, operating pressures and use cases are curated and tested.
10. The 1800 body operating range (1.0–4.8 bar) is not the operating range of every nozzle. Validate body and nozzle independently. The body catalogue includes 1802 (2-inch pop-up), but R-VAN performance data was tested on 4-inch pop-ups and the Rain Bird store compatibility listings explicitly name 1804/1806/1812 for R-VAN. Keep 1802 out of R-VAN automatic compatibility until exact manufacturer confirmation.
11. Do not infer PRS capability from a standard 1800 or SAM body. A SAM check valve and a pressure regulator are different functions.
12. Treat integrated UNI-Spray assemblies and standalone nozzles as alternative catalogue representations; prevent duplicate nozzle quantities in the BOM.

## 5. Recommended first supported calculation subset

A safe first implementation should use only:
- 3500 3504-PC / 3504-PC-SAM with a verified nozzle tree and explicit nozzle selection;
- 5000 only where the exact rotor + installed nozzle configuration is verified;
- 1800/UNI-Spray + HE-VAN/VAN/strip combinations with exact body/nozzle compatibility and nozzle pressure;
- R-VAN only after the 3.1 bar regulation/pressure path and body matching are confirmed.

Do not automatically recommend 8005/Falcon 6504 in the first release.

## 6. Still unresolved

- Confirm exact package/nozzle-tree contents for the Florial 3504-PC, 3504-PC-SAM and 5004+FC SKUs.
- Confirm the exact default nozzle and low-angle/standard-angle configuration of 5004+FC.
- Confirm which 1800 body heights are suitable for turf in the actual installation conditions; do not choose pop-up height from hydraulic data alone.
- Verify whether any current Florial valve, filter, backflow, regulator and pipe SKUs have complete technical specifications for the hydraulic network.
- Curate internal pipe diameters, material, fitting-loss method and permitted velocity/loss thresholds before pipe sizing.
- Define engineering-approved baseline sites and independent manual calculation checks before exposing a customer-facing calculator.
- No Gemini API, customer-data transfer, Cloudflare secret, cart integration, Sanity write or production configuration change is approved or implemented by this audit.

## 7. Verification boundary

This is a read-only audit of published Sanity documents and public Rain Bird manufacturer documents. It is not a signed irrigation design, not a full compatibility certification, and not an implemented calculator. The next engineering artifact should be a versioned, code-owned performance dataset with schema validation and tests, followed by deterministic geometry/coverage/hydraulic modules.
