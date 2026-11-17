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
  assert.match(page, /service\.slug\?\.current === 'landshaften-dizain'\s*\?\s*null/)
  assert.match(page, /const hasIntroGallery = Boolean\\(imageGroups\\.intro\\?\\.length\\) && service\\.slug\\?\\.current !== 'zasazhdane-na-rasteniya' && service\\.slug\\?\\.current !== 'landshaften-dizain'/, 'landscape design must keep the hero above its inline gallery')
  assert.match(page, /: heroImageUrl && \\(/, 'the hero image must remain the fallback when the intro gallery is suppressed')
})
