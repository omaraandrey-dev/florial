import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('ozelenyavane service distributes its gallery inside the localized article', async () => {
  const page = await read('../src/pages/ServicePage.tsx')

  assert.ok(page.includes("fbecf7b03cff: 'lawn'"))
  assert.ok(page.includes("ed96b4f74e1a: 'lawn'"))
  assert.ok(page.includes("'6f4c8223f1c0': 'lawn'"))
  assert.ok(page.includes("bc772eab7d78: 'flowerbeds'"))
  assert.ok(page.includes("img1: 'intro'") && page.includes("img4: 'intro'"))
  assert.ok(page.includes("lawn: ['рулонен тревен чим и изграждане на тревни площи']"))
  assert.ok(page.includes("flowerbeds: ['цветни лехи и растителни композиции']"))
  assert.ok(page.includes("lawn: ['рулонный газон и устройство газонных площадей']"))
  assert.ok(page.includes("flowerbeds: ['цветники и цветочные композиции']"))
  assert.ok(page.includes("lawn: ['roll-out turf and lawn installation']"))
  assert.ok(page.includes("flowerbeds: ['flower beds and planting compositions']"))
  assert.match(page, /gallery:\(intro\|design\|pipeline\|equipment\|trenches\|watering\|automation\|lawn\|flowerbeds\)/)
  assert.ok(page.includes("service.slug?.current === 'ozelenyavane' ? [] : sourceBlocks.filter("))
  assert.ok(page.includes("service.slug?.current === 'ozelenyavane'\n            ? null"))
  assert.ok(page.includes("service.slug?.current !== 'ozelenyavane'"))
})
