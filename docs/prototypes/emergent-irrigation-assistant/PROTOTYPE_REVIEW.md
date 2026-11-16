# Emergent prototype — conversation and review evidence

## Demo knowledge cards observed

1. **Чек-лист для проекта автополива** — MD, 1,277 characters, labelled “пример документа”; description starts with a checklist of data needed by a specialist (area/dimensions, water source, etc.). UI says “Используется в ответах”.
2. **Как замерить давление и дебит воды** — MD, 1,273 characters, labelled “пример документа”; instruction explains why pressure and flow determine how many sprinklers can operate together and how many zones are needed. UI says “Используется в ответах”.
3. **Нормы полива газона в Болгарии** — MD, 1,262 characters, labelled “пример документа”; sample lawn watering guidance for Bulgaria. UI says “Используется в ответах”.

All are demo/example content, not validated Florial source documents.

## User's sample test scenario

- Lawn: 200 m².
- Geometry: rectangle 10 × 20 m.
- Reported pressure: 4 bar (measurement type not specified in the first test).
- Measured flow: 40 L/min (method details not captured).
- Water source later clarified: well.
- User is an irrigation engineer and confirmed that the preliminary practical layout/recommendation was reasonable for this simple geometry.

## Assistant response behavior captured

### Initial area-only question
The prototype estimated 25–35 L/m²/week in hot Bulgarian weather, giving 5–7 m³/week for 200 m²; asked for location, water source, pressure and flow; explained bucket flow measurement; and suggested 2–4 zones as an indicative range.

### Equipment request before dimensions
It suggested ESP-TM2 controller, 100-DV valves, Rain Bird 5004 for wider areas, 1800 + R-VAN for narrow areas, and RSD-BEx rain sensor. It correctly stated that exact zones/nozzles required more information, but the equipment suggestions were generic and not yet proven to be grounded in a verified catalogue/performance dataset.

### After 4 bar and 10 × 20 m
It proposed six Rain Bird 5004 sprinklers at corners and midpoints of long sides, head-to-head principle, and deferred zone count pending flow. The owner considered this practical preliminary advice appropriate for a simple rectangular lawn.

### After 40 L/min
It initially estimated 6 sprinklers at 60–70 L/min and suggested two zones of three, plus 25–30 minutes per zone. Those figures were not justified by the cited nozzle/arc/pressure data in that response.

### After being challenged
It explicitly downgraded the prior response to a preliminary estimate, explained that 60–70 L/min was excessive for the proposed site, gave an illustrative Rain Bird 5004 nozzle #3.0 point at about 3 bar and approx. 10 L/min full-circle, estimated 25–30 L/min for six heads using 90°/180° sectors, and stated the 40 L/min source might be sufficient for one zone subject to dynamic pressure and pipe losses. It invited specialist review.

### Follow-up on well
The UI suggested further questions about zone count and missing data. A full response to the later well-specific question has not yet been captured.

## Assessment

- Positive: natural dialogue, incremental intake, understandable explanations, suggested follow-ups, source-link display, specialist escalation and clear preliminary disclaimer.
- Owner engineering judgement: practical six-head preliminary layout for the simple rectangle was considered correct by the owner. Preserve this context in later reviews.
- Caution: do not treat the first 60–70 L/min figure or the 25–30 minute runtime as validated engineering results.
- Evidence gap: the source labels and links show references to demo documents, but actual retrieval/source grounding is not proven by the UI alone.
- Engineering boundary: a simple preliminary field recommendation may be useful without a full formal design, but automatic final specification still needs verified manufacturer data, stated assumptions and reproducible Florial calculation rules.
