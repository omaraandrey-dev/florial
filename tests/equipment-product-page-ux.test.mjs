import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/pages/ProductPage.tsx', import.meta.url), 'utf8')

test('equipment product page presents its short description and purchase information clearly', () => {
  assert.match(source, /!isPlantProduct\(product\) && product\.shortDescription/)
  assert.match(source, /bg-gradient-to-b from-emerald-50\/80 to-white/)
  assert.match(source, /imageBadgeStatus && imageBadgeLabel/)
  assert.match(source, /Цена на продукта/)
})

test('equipment page highlights only existing localized specifications and retains the full list', () => {
  assert.match(source, /const equipmentSpecifications = isPlantProduct\(product\) \? \[\] : localizedSpecifications/)
  assert.match(source, /featuredEquipmentSpecifications = equipmentSpecifications\.slice\(0, 3\)/)
  assert.match(source, /Всички посочени параметри за този продукт\./)
  assert.match(source, /localizedSpecifications\.map\(/)
})

test('equipment purchase action remains available in a mobile sticky bar when original controls leave view', () => {
  assert.match(source, /if \(!actions \|\| typeof IntersectionObserver === 'undefined'\) return/)
  assert.match(source, /<div ref=\{purchaseActionsRef\}/)
  assert.match(source, /!purchaseActionsInView && \(/)
  assert.match(source, /onClick=\{handleAdd\} className="min-h-12 flex-1 rounded-xl bg-emerald-700/)
})

test('equipment compatibility and manufacturer documents use distinct visual sections', () => {
  assert.match(source, /rounded-2xl border border-cyan-100 bg-cyan-50\/30/)
  assert.match(source, /rounded-2xl border border-sky-100 bg-sky-50\/30/)
  assert.match(source, /product\.manualPDFUrl \|\| product\.catalogPDFUrl \|\| \(product\.documents && product\.documents\.length > 0\)/)
  assert.doesNotMatch(source, /\{\/\* Документы и инструкции \*\/\}/)
})

test('plant-specific purchase and care behavior remains present', () => {
  assert.match(source, /plantStockStatus !== 'outOfStock'/)
  assert.match(source, /Ръководство за отглеждане/)
  assert.match(source, /recommendedIrrigation/)
})
