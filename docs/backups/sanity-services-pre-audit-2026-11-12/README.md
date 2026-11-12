# Sanity service document backup — 2026-11-12

This directory contains pre-edit snapshots of the eight existing published service documents in Sanity project `bxvcy0qs`, dataset `production`.

Captured before the 2026-11-12 service content audit and before any content patches were applied.

Each `<document-id>.json` file contains:
- `backupType`, project and dataset identifiers;
- capture timestamp and perspective (`published`);
- the complete structured Sanity document, including its original `_id` and `_rev`;
- localized content, SEO fields, image asset references, related references, CTA and form fields as they existed before editing.

Documents:
- `8a4ec08b-e064-4d85-9d97-52837afe6d6f` — sprinkler installation/repair
- `078495b7-168f-4b7d-8dbe-f723aeab0cc9` — irrigation controller installation/setup
- `d6dd1e83-f504-45a2-83de-974e144669e8` — solenoid valves
- `9f8a5130-49e8-4d34-9f76-c6124503fb5d` — irrigation system repair/modernisation
- `88d0619d-1083-4eb7-b4e6-b22897f6c901` — annual irrigation maintenance
- `e5da8f0d-45ce-41f1-a95b-53ca951dd55c` — flower beds
- `31fb7746-10c1-48a3-a949-39767f9f0205` — topiary pruning
- `fe90ae56-594e-45e4-b37f-54eb2c3bf0ed` — lawn replacement

## Validation

All eight files were fetched back from GitHub and parsed as JSON. The embedded document `_id` matched the expected Sanity document ID.

The backup was not imported into Production as a destructive restore test. For recovery, use the original document ID and restore the backed-up fields through a controlled Sanity patch/import procedure after reviewing the current document and revision. Do not blindly replace a current document with a snapshot without checking subsequent changes.
