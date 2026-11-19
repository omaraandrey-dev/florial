import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Manager opens the direct Sanity plant catalogue; old requests tab is not exposed', async () => {
  const app = await read('../src/manager/ManagerApp.tsx')
  assert.match(app, /<PlantCatalogManager role=\{profile\.role\} permissions=\{profile\.permissions\} \/>/)
  assert.doesNotMatch(app, /aria-current=\{activeTab === 'submissions'/)
  assert.match(app, /className="hidden">\s*<section className="space-y-5">/)
})

test('legacy submission permissions are absent from the active server permission schema', async () => {
  const lib = await read('../functions/api/manager/_lib.ts')
  assert.doesNotMatch(lib, /canReviewPlantSubmissions|canApprovePlantSubmission|canPublishPlant/)
})

test('generic Manager data API only exposes the authenticated staff profile', async () => {
  const api = await read('../functions/api/manager/data.ts')
  assert.match(api, /body\.table !== 'catalog_staff_profiles'/)
  assert.doesNotMatch(api, /catalog_submissions|catalog_submission_events/)
})

test('legacy plant submission API routes are retired', async () => {
  for (const path of [
    '../functions/api/manager/plant-catalog.ts',
    '../functions/api/manager/publish-plant.ts',
    '../functions/api/manager/notify.ts',
    '../functions/api/manager/request-changes.ts',
    '../functions/api/manager/enrich-plant.ts',
    '../functions/api/manager/enrich-plant-care.ts',
  ]) await assert.rejects(access(new URL(path, import.meta.url)))
})
