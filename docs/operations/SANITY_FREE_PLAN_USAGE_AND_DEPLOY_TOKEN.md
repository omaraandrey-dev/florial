# Sanity Free plan — resource usage and deferred Studio Deploy Token

Snapshot date: 2026-11-20  
Sanity project: `bxvcy0qs`  
Datasets: `production`, `plants`  
Status: reference note; no Sanity, GitHub secret, Cloudflare secret, schema, or Studio configuration was changed.

## Owner decision — defer Deploy Token

On 2026-11-20 the owner decided **not to create or rotate a Sanity Deploy Token now**. The current Sanity Studio structure is sufficient for the planned work, which is primarily adding and publishing catalog/content documents. A Deploy Token is not required for ordinary content editing and publishing through the existing Studio.

Revisit this only when a change must be deployed from GitHub Actions to the hosted Sanity Studio, for example:
- changing document types or fields in `studio/**`;
- changing Studio workspace configuration;
- deploying updated Studio code or schema from the repository.

### Deferred setup procedure (do not execute until needed)

1. Open Sanity project management for project `bxvcy0qs`: https://www.sanity.io/manage/project/bxvcy0qs/api
2. In API Tokens, create a dedicated **Deploy Token** with the `deployStudio` grant. Suggested label: `Florial GitHub Studio Deploy`.
3. In GitHub repository Actions secrets, update the existing secret named `SANITY_AUTH_TOKEN`: https://github.com/omaraandrey-dev/florial/settings/secrets/actions
4. Paste the new Deploy Token into that secret only. Never put the token in chat, source files, workflow YAML, logs, or documentation.
5. Keep any old token until the deployment workflow succeeds. Do not change Cloudflare's separate `SANITY_API_TOKEN`.
6. Run or trigger the existing workflow `.github/workflows/deploy-sanity-studio.yml` and verify that `npm run build` and `npx sanity deploy --yes --schema-required --json` succeed.
7. Only after successful verification consider revoking the old token, and only if its purpose is known.

The existing workflow expects `SANITY_AUTH_TOKEN`; the Studio CLI configuration already identifies the existing hosted Studio/workspaces. Do not create a second Studio or change its app ID/host as part of token setup.

## How Sanity usage quotas work

Sanity meters API, API CDN, and bandwidth quotas per **UTC calendar month**. They reset automatically at 00:00 UTC on the first day of the next month. Free projects have hard caps and do not receive paid-plan overages.

Storage-style quotas are different: assets, documents, datasets, and user seats are measured as the total amount/count present at the end of the month. They do not reset monthly; content remains stored until deliberately removed or the plan changes.

### Snapshot recorded on 2026-11-20

The Sanity usage view previously inspected for this project showed:
- Direct API requests: 51,218 / 250,000.
- API CDN requests: 22,923 / 1,000,000.
- Asset storage: 0.76 GB / 100 GB.
- Bandwidth: 18.18 GB / 100 GB.

These are a dated usage snapshot, not live values. Re-open Sanity Manage → Usage for the current period before making operational decisions.

### Metric definitions and quota behavior

- **API requests (250,000/month):** successful HTTP(S) requests to `<project>.api.sanity.io`, excluding OPTIONS. This is the uncached/direct API, typically used by integrations, mutations, and requests that need the freshest saved data. Failed 4xx/5xx requests and Sanity's own Studio/Dashboard tooling requests are exempt from the billable request count. At 100% on Free, further public API requests are blocked (HTTP 402); Studio itself remains accessible.
- **API CDN requests (1,000,000/month):** successful HTTP(S) requests to `<project>.apicdn.sanity.io`, excluding OPTIONS. This is normally the read path used to serve public catalog content to website visitors. Cached responses are served from Sanity's CDN. At 100% on Free, additional API CDN requests are blocked (HTTP 402), so catalog content may stop loading on the public website until reset or upgrade.
- **Bandwidth (100 GB/month):** total outgoing data transferred by API, API CDN, and asset traffic during the UTC calendar month. It is not the number of requests. A few large responses/images can use more bandwidth than many small responses. At 100% on Free, further API/CDN delivery is blocked (HTTP 402).
- **Asset storage (100 GB total):** total size of uploaded images, files, and other assets stored in the project at month end. This is not a monthly allowance and does not refill on the first day of each month. At the limit, new asset uploads are blocked; existing assets continue to be served. The current snapshot used 0.76 GB, about 0.8% of the displayed 100 GB allowance.
- **Documents (Free plan limit: 10,000 total):** number of stored Sanity documents across datasets at month end, including drafts and release versions. A draft and its published document count separately. Image/file asset documents are excluded from this count because their bytes are covered by asset storage. This is a total inventory limit, not a monthly document-creation allowance. At the limit, new documents and drafts cannot be created.
- **Datasets (Free plan limit: 2):** number of datasets in the project, counted at month end. Florial currently uses `production` and `plants`, i.e. both available dataset slots. This is a count of datasets, not monthly usage.
- **Unique attributes (Free plan limit: 2,000 per dataset):** a schema/data-shape quota based on unique attribute and datatype combinations found across documents in a dataset. It is not the number of fields in one schema file and not a monthly counter. The Growth trial documentation lists the same 2,000-attribute limit per dataset.

Sanity sends usage warning emails to project/organization administrators at 80% and 100% for API, API CDN, and bandwidth. Free projects cannot pay overages automatically; reaching the hard cap blocks the affected operation until the next monthly reset or a plan upgrade.

## Interpretation for Florial

- The recorded API usage was about 20.5% of its monthly quota.
- API CDN usage was about 2.3% of its monthly quota.
- Bandwidth usage was about 18.2% of its monthly quota.
- Asset storage usage was about 0.8% of the total storage allowance.
- The request/bandwidth counters reset monthly; stored assets and document inventory do not.
- Public datasets are currently required by the existing site's public catalog read path. Do not switch either dataset to private without a separately approved architecture change.

### Document-count discrepancy to recheck

The earlier usage inspection showed two different document-related figures: a GROQ count of 1,267 and a separate usage/statistics figure of 497. Their exact metric definitions were not established during that inspection. Do not treat either number as the confirmed current document-quota count. Recheck the Sanity Manage document usage metric before approaching the 10,000-document limit.

## Sources

- Sanity, Plans and payments: https://www.sanity.io/docs/platform-management/plans-and-payments
- Sanity, Understanding the Growth plan trial: https://www.sanity.io/docs/platform-management/growth-plan-trial
- Sanity, API CDN: https://www.sanity.io/docs/content-lake/api-cdn
- Sanity, Technical limits: https://www.sanity.io/docs/content-lake/technical-limits
- Florial workflow: `.github/workflows/deploy-sanity-studio.yml`
- Florial Studio CLI configuration: `studio/sanity.cli.ts`
