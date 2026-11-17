import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('landscape design gallery supports inline section markers and does not render the full gallery before the article', async () => {
  const page = await read('../src/pages/ServicePage.tsx')

  assert.match(page, /intro\|design\|pipeline\|equipment\|trenches\|watering\|automation/, 'missing supported inline gallery groups')

  for (const key of [
    'dropLandscape2019', 'dropProject2021', 'img1', 'img2',
    'projectMasterPlan', 'projectDendroplan', 'projectPlantSchedule',
    'dropHedge2020', 'img3', 'img4', 'projectIrrigationPlan',
    'projectVisualisations',
  ]) {
    assert.match(page, new RegExp(`\\b${key}: '\\w+'`), `missing image placement for ${key}`)
  }

  assert.match(page, /galleryMarker = first\.match\(/)
  assert.match(page, /galleryMarker = block\.style === 'normal'/)
  assert.match(page, /service\.slug\?\.current === 'landshaften-dizain' \|\| service\.slug\?\.current === 'landshaften-proekt-online'/, 'both landscape service pages must suppress the pre-article gallery')
  assert.match(page, /onlineGardenPhoto: 'design'/, 'online landscape service must map its own gallery keys into inline groups')
  assert.match(page, /onlineMasterPlan: 'pipeline'/, 'online landscape master plan must appear in the article body')
  assert.match(page, /onlinePlantingPlan: 'pipeline'/, 'online portfolio planting plan must be grouped with the detailed project')
  assert.match(page, /onlinePlantSchedule: 'pipeline'/, 'online portfolio plant schedule must be grouped with the detailed project')
  assert.match(page, /onlineIrrigationPlan: 'pipeline'/, 'online portfolio irrigation plan must be grouped with the detailed project')
  assert.match(page, /online3DVisualisation: 'pipeline'/, 'online portfolio visualisation must be grouped with the detailed project')
  assert.match(page, /service\.slug\?\.current === 'landshaften-proekt-online'/, 'online landscape service must receive inline gallery mapping')
  assert.match(page, /landshaften-proekt-online'\)\s*\? null/, 'online landscape service must not render a duplicate full gallery before the article')
  assert.ok(page.includes("const hasIntroGallery = Boolean(imageGroups.intro?.length) && service.slug?.current !== 'zasazhdane-na-rasteniya' && service.slug?.current !== 'landshaften-dizain'"), 'landscape design must keep the hero above its inline gallery')
  assert.ok(page.includes(': heroImageUrl && ('), 'the hero image must remain the fallback when the intro gallery is suppressed')
})
