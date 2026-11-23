# ESP-BAT-BT1 and 100-HV-9V compatibility copy — 2026-11-23

**Status:** Published and read back in Sanity Production  
**Project/dataset:** `bxvcy0qs / production`  
**Owner decision:** compatibility confirmed by the owner's personal installation experience for the newer 100-HV-9V production version.

## Documents changed

- Valve: `30cbe6a0-c871-4ceb-8111-73790fea66fd`, SKU `H01040`.
- Controller: `6c33f78b-2607-474d-9b70-34b6607a3db6`, SKU `ESP-BAT-BT1`.

## Editorial change

The former blanket statement that 100-HV-9V is incompatible with ESP-BAT-BT1 was replaced in BG/RU/EN with a bounded condition:

- 100-HV-9V production versions manufactured on or after **01.01.2026** are compatible with ESP-BAT-BT1 when fitted with a suitable **9 V DC latching solenoid**.
- Compatibility is not claimed for earlier production versions.
- The production marking and solenoid type must be checked before installation.

The same condition is now stated on both product cards, in the full descriptions and in the corresponding compatibility specification values. The controller card's valve-compatibility section explicitly names 100-HV-9V. Existing general compatible-valve series and all unrelated product information were preserved.

## Backup and verification

- Complete pre-write Sanity readbacks are preserved in `docs/backups/sanity/2026-11-23-esp-bat-bt1-and-100-hv-9v-before-compatibility-copy.json`.
- Existing published revisions were read before editing; no drafts existed for either target.
- Both documents were patched as drafts with revision guards.
- Sanity validation returned `valid` for both documents. Validation was incomplete because custom callbacks (including custom slug uniqueness callbacks) are not executed by the available validator.
- Both drafts were published successfully.
- Published read-back confirmed the Bulgarian descriptions/specifications and the RU/EN compatibility text checked before publication. A raw Sanity query confirmed zero remaining target drafts.
- No prices, SKUs, images, categories, product names, stock values, short descriptions, kit component references or quantities were changed in this follow-up.

## Evidence boundary

The model-specific compatibility statement is based on the owner's direct field experience and explicit confirmation in this conversation. It is not described as a new Rain Bird manufacturer bulletin. Rain Bird's public product page previously returned an explicit exclusion for the 100-HV-9V model; the owner has clarified that the newer production version works in the stated configuration. The date/solenoid limitation is retained to avoid generalizing the confirmation to earlier units.
