# Irrigation assistant Production browser smoke test

Date: 2026-11-16
Environment: public Production site
Scope: read-only browser navigation and initial-step inspection

## Routes visited

- https://florial-bg.com/
- https://florial-bg.com/services/avtomatichno-napoyavane
- https://florial-bg.com/irrigation-assistant
- https://florial-bg.com/irrigation-assistant?lang=ru
- https://florial-bg.com/irrigation-assistant?lang=en

## Findings

- The public homepage loaded.
- The automatic irrigation service page loaded and exposed the floating control titled `Помощник за напояване`; it opened the dedicated assistant route.
- The assistant loaded in Bulgarian, Russian and English through the site's own language controls.
- Bulgarian initial view: Module 1 / lawn, step 1 of 3, rectangular shape selected, L-shape available, length and width numeric inputs in metres. The Continue button is disabled while required geometry values are blank.
- The numeric fields visibly use a minimum of 0 and a step of 0.1.
- The confirmation area was not visible in the initial state. No data was entered because advancing would require form input; no form was submitted.
- The privacy banner remained visible; no consent choice was made.
- Reloads reached ready state complete. No browser runtime exception or console log entry was observed during the inspected routes.

## Not covered

- Later steps after geometry entry, geometry confirmation, water-source/flow/pressure input, summary view and form submission.
- Mobile/desktop responsive comparison; the browser report did not establish viewport-specific QA.
- Actual solver invocation: source review confirms `IrrigationAssistantPage.tsx` does not yet import or call `generateLawnSprinklerLayout`.
- Sprinkler layout, hydraulic feasibility, precipitation uniformity, overspray, product/body compatibility or field watering performance.

## Safety

Read-only inspection only. No login, form submission, analytics choice, order, message, upload, Sanity, D1 or other data write was performed.
