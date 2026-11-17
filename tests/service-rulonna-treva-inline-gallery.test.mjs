import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('rolled turf service places its process photos inside the localized article', async () => {
  const page = await read('../src/pages/ServicePage.tsx')

  assert.ok(page.includes("service.slug?.current === 'rulonna-treva'"))
  assert.ok(page.includes("img4: 'lawn'"))
  assert.ok(page.includes("f0a2082a4004: 'lawn'"))
  assert.ok(page.includes("'1f1a8f9bcdb0': 'lawn'"))
  assert.ok(page.includes("'8f55ccf79674': 'lawn'"))
  assert.ok(page.includes("'75a8ab838130': 'lawn'"))
  assert.ok(page.includes("a55a84ff65d2: 'lawn'"))
  assert.ok(page.includes('...rolledTurfArticleGalleryBlocks'))
  assert.ok(page.includes("lawn: ['рулонен тревен чим и изграждане на тревни площи', 'полагане на тревния чим на терена']"))
  assert.ok(page.includes("lawn: ['рулонный газон и устройство газонных площадей', 'укладка рулонного газона на участке']"))
  assert.ok(page.includes("lawn: ['roll-out turf and lawn installation', 'laying rolled turf on site']"))
  assert.match(page, /additionalContentBlocks = .*isRolledTurfService \? \[\]/)
  assert.match(page, /isDripIrrigationService \|\| isRolledTurfService\s*\? null/)
  assert.ok(page.includes('gallery:(intro|design|pipeline|equipment|trenches|watering|automation|lawn)'))
})
