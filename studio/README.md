# Florial Sanity Studio — source of truth

This directory is the version-controlled source for the Florial Sanity Studio configuration and document schemas.

## Connected project

- Sanity project ID: `bxvcy0qs`
- Irrigation catalogue, services, site content: dataset `production`, workspace `florial-admin`
- Plants: dataset `plants`, workspace `plants`
- Main website repository: `omaraandrey-dev/florial`

## Commands

Run from this directory:

```bash
npm install
npm run dev
npm run build
npm run schema:deploy
```

Schema deployment changes the schema used by Sanity Studio; it does not migrate existing document values. Review schema changes and test them before deploying. Do not run `npm run deploy` until the intended Studio deployment target is confirmed.

## Rules for future changes

1. Edit schemas only in `schemaTypes/index.ts` and configuration in `sanity.config.ts`.
2. Keep document data in Sanity; do not put credentials or API tokens in this repository.
3. Do not delete/replace document fields or data as a schema workaround.
4. Before changing a field type, check existing stored values and website queries. A schema type change alone is not a data migration.
5. Check the production and plants datasets independently.
6. Keep a changelog of schema changes in Git commits and this README.
7. The schema is based on currently deployed definitions and the fields reported as unknown in existing service documents. Verify with a Studio build and a non-destructive review before deploying it.

## Current schema scope

### Dataset `production`
Brands, irrigation categories, irrigation products, services, pages, media/photos, site settings, SEO fields, product specifications, service content blocks.

The service schema includes the six previously unrecognised fields: `advantages`, `callToAction`, `hero`, `leadForm`, `steps`, and `translations`. Service `slug` is intentionally a plain string field with no auto-generation or validation rule, as requested.

### Dataset `plants`
Plant categories and plant products, including Bulgarian, English, and Russian translations, plant details, source URL, images, pricing, availability, and SEO.

## Important migration note

The current deployed Studios are separate apps. Adding these files to GitHub does not automatically change either deployed Studio. First review/build this source; then deploy the schema to the existing intended Studio using the supported Sanity workflow. Do not create a third Studio or deploy over existing workspaces without a deliberate cutover plan.
