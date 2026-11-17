import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('drip irrigation service images are placed inside the matching article sections', async () => {
  const page = await readFile(new URL('../src/pages/ServicePage.tsx', import.meta.url), 'utf8')

  assert.match(page, /const isDripIrrigationService = service\.slug\?\.current === 'avtomatizirano-kapkovo-napoyavane'/)
  assert.match(page, /gallery1: 'design'/)
  assert.match(page, /gallery4: 'watering'/)
  assert.match(page, /gallery5: 'flowerbeds'/)
  assert.match(page, /'49e8b9ec3359': 'design'/)
  assert.match(page, /title: `__gallery:\$\{group\}`/)
  assert.match(page, /additionalContentBlocks = service\.slug\?\.current === 'ozelenyavane' \|\| isDripIrrigationService \|\| isRolledTurfService \? \[\]/)
  assert.match(page, /: isDripIrrigationService \|\| isRolledTurfService\s*\? null\s*:/)

  for (const heading of [
    'как планираме системата за вашата градина?',
    'как мы планируем систему для конкретного сада?',
    'how do we plan a system for your garden?',
    'капкова тръба rain bird xfs dripline',
    'капельная трубка rain bird xfs dripline',
    'rain bird xfs dripline',
    'автоматично управление на капковото напояване',
    'автоматическое управление капельным поливом',
    'automatic control for drip irrigation',
  ]) {
    assert.ok(page.includes(heading), `Missing localized gallery heading mapping: ${heading}`)
  }
})
