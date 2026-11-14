# Product SEO quality audit — 2026-11-14

## Scope and method

- Live source: Sanity project bxvcy0qs, dataset production, perspective published.
- Scope: all published irrigation/equipment product documents with a defined name, ordered by _id.
- Read-only inspection in batches; no Sanity mutations or publications were performed.
- Total: 275 products. Each product was checked for BG/RU/EN H1, Meta Title and Meta Description.
- Automated checks included field presence, title/description character lengths, ellipsis/truncation markers, malformed punctuation, Cyrillic in English fields and a conservative set of Bulgarian-specific words in RU/EN. These are screening signals; not every length or lexical flag is automatically a content error.

## Completeness

All 275 products have all nine active localized SEO fields populated:

| Locale | H1 | Meta Title | Meta Description |
|---|---:|---:|---:|
| BG | 275/275 | 275/275 | 275/275 |
| RU | 275/275 | 275/275 | 275/275 |
| EN | 275/275 | 275/275 | 275/275 |

Total populated active fields: 2,475/2,475. This confirms field presence only; it does not establish editorial quality.

## Automated screening results

### Meta Title longer than 70 characters

- BG: 16
- RU: 7
- EN: 2

These values should be shortened without damaging model numbers, sizes, thread types or other identifying product attributes.

### Meta Description length

| Locale | Over 160 chars | Over 180 chars |
|---|---:|---:|
| BG | 132 | 105 |
| RU | 166 | 23 |
| EN | 133 | 6 |

A description over 160 characters is a review candidate, not proof of a Google penalty. The project generator had a 180-character budget, which does not match the tighter 160-character content target used elsewhere in the project. Descriptions must be shortened by removing redundant wording, not by cutting a sentence in the middle.

### Truncation and punctuation indicators

- Ellipsis in Meta Description: BG 1, RU 112, EN 73.
- Suspicious empty/double punctuation or empty feature fragments: BG 8, RU 32, EN 70.
- 71 distinct products were flagged for empty-feature/dangling punctuation patterns.

Examples from the live catalogue:

- SKU B31440 / rain-bird-100-pga-9v, RU: the feature ends at «бистабильным…» and the sentence continues with generic boilerplate.
- SKU B31440, EN: the feature ends at “for…” before the generic suffix.
- SKU IVVMP27M0N16C, EN: contains an empty feature fragment and doubled punctuation around “VAT included”.
- SKU 3112/1620, RU and EN: descriptions contain an empty feature slot; the localized product names also contain Bulgarian words.

### Localization contamination

- 32 distinct products have Cyrillic characters in at least one English name/H1/title/description field. Some are Bulgarian technical abbreviations such as Ж, or Bulgarian words copied into English names; each requires a product-by-product decision.
- 109 distinct products were flagged by a conservative Bulgarian-specific vocabulary heuristic in RU/EN fields. This is a review queue, not a verified count of mistranslations: common technical terms and shared Cyrillic vocabulary can create false positives.
- Clear examples:
  - SKU 3112/1620: “Support stake за капков маркуч 16 mm” (EN) and “Опорный колышек за капков маркуч 16 mm” (RU).
  - SKU 01311: English name contains “полиетилен, дълга дръжка”; RU description includes “Цена с ДДС”.
  - SKU IQ21520F0N25C: English name contains “с вътрешна резба”; RU name contains Bulgarian “Тройник”.

A total of 244 products received at least one automated screening flag. This is the union of length, truncation, punctuation and localization heuristics; it must not be read as 244 confirmed translation defects.

## Root cause in generator

Reviewed on current main source:

- src/lib/productSeo.mjs previously allowed a 180-character Meta Description and clipped feature text at a word boundary with an ellipsis.
- It appended a fixed generic suffix after the clipped fragment, which could turn a partial phrase into an unfinished sentence.
- It did not consistently remove VAT-only fragments or reject visibly contaminated RU/EN source names.
- The Manager endpoint uses missing-only writes. Since all current fields are populated, running that operation again would preserve the bad existing values and would not repair them.

## Code correction prepared in branch

The proposed code change:

- sets a 160-character description target;
- never clips the feature sentence; it uses a complete fallback when the feature does not fit;
- removes VAT-only fragments and empty separators;
- skips automatic RU/EN generation when the source product name is visibly contaminated with Bulgarian text, rather than writing a bad translation;
- adds regression tests for truncation, VAT-only fragments, locale contamination and length limits.

This code correction does not rewrite the 2,475 already-populated Sanity fields.

## Required data remediation — not yet performed

1. Review the 244 flagged product queue, separating confirmed errors from heuristic false positives.
2. Correct source product names/descriptions in BG/RU/EN where the source translation itself is wrong.
3. Prepare a field-level proposed change set for existing SEO values, retaining technically important specifications and model identifiers.
4. Export a complete pre-write backup of every affected published product document.
5. Show the owner a preview with old/new values and exact document IDs.
6. Only after explicit approval, write only approved SEO fields with revision guards; then read back and compare against the backup.

## Verification status

- Live Sanity read: checked.
- Sanity write/publication: not performed.
- Generator code: correction prepared in branch; CI must verify the exact PR head.
- Production deployment: not performed.
- Google recrawl/indexing: not verified.