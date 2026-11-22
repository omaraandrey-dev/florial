import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/pages/ProductPage.tsx', import.meta.url), 'utf8')

test('plant product page presents confirmed plant highlights and a clearer purchase hierarchy', () => {
  assert.match(source, /plantCare\?\.foliageType/)
  assert.match(source, /plantCare\?\.blackSeaCoast/)
  assert.match(source, /bg-gradient-to-b from-emerald-50\/80 to-white/)
  assert.match(source, /Цена на избрания вариант/)
})

test('plant sale size data is shown in the purchase panel without a duplicate sale section', () => {
  assert.match(source, /typeof saleHeightCm === 'number'/)
  assert.match(source, /typeof containerVolumeL === 'number'/)
  assert.doesNotMatch(source, /Available sale option|Вариант за продажба/)
})

test('plant care groups and care guide remain available in all supported locales', () => {
  assert.match(source, /Основни характеристики/)
  assert.match(source, /Условия на отглеждане/)
  assert.match(source, /Ръководство за отглеждане/)
  assert.match(source, /<details className="group rounded-xl/)
})

test('mobile sticky purchase action observes the original purchase controls and preserves stock guards', () => {
  assert.match(source, /new IntersectionObserver/)
  assert.match(source, /purchaseActionsRef/)
  assert.match(source, /fixed inset-x-0 bottom-0/)
  assert.match(source, /plantStockStatus === 'outOfStock'/)
})
