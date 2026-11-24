import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildEquipmentCategoryEntries,
  renderEquipmentCategoryListing,
} from '../functions/_lib/plantCategoryHtml.mjs'

const products = [
  {
    _id: 'valve-b',
    slugValue: 'rain-bird-valve-b',
    name: 'Клапан B',
    translations: { ru: { name: 'Клапан B' }, en: { name: 'Valve B' } },
    sku: '100-HV-B',
    priceEUR: 42.5,
    stockStatus: 'inStock',
    imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/production/valve-b-640x480.jpg',
  },
  {
    _id: 'valve-a',
    slugValue: 'rain-bird-valve-a',
    name: 'Клапан A',
    translations: { ru: { name: 'Клапан A' }, en: { name: 'Valve A' } },
    sku: '100-HV-A',
    priceEUR: 39,
    stockStatus: 'onRequest',
  },
]

test('equipment category entries use localized names and stable alphabetical order', () => {
  assert.deepEqual(buildEquipmentCategoryEntries(products, 'en').map((item) => item._id), ['valve-a', 'valve-b'])
  assert.deepEqual(buildEquipmentCategoryEntries(products, 'ru').map((item) => item._id), ['valve-a', 'valve-b'])
})

test('equipment category HTML contains localized product links, image ALT/title, price, stock and SKU', () => {
  const html = renderEquipmentCategoryListing(products, 'bg')
  assert.match(html, /data-florial-server-catalogue="equipment"/)
  assert.match(html, /Показани продукти: 2/)
  assert.match(html, /href="https:\/\/florial-bg\.com\/product\/rain-bird-valve-b"/)
  assert.match(html, /src="https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/production\/valve-b-640x480\.jpg"/)
  assert.match(html, /alt="Купете Клапан B в Несебър"/)
  assert.match(html, /title="Продажба на Клапан B в Несебър"/)
  assert.match(html, /42\.50 €/)
  assert.match(html, /В наличност/)
  assert.match(html, /SKU: 100-HV-B/)
})

test('equipment category URLs and labels are localized for Russian and English', () => {
  const ru = renderEquipmentCategoryListing(products, 'ru')
  const en = renderEquipmentCategoryListing(products, 'en')
  assert.match(ru, /Оборудование в категории/)
  assert.match(ru, /href="https:\/\/florial-bg\.com\/product\/rain-bird-valve-a\?lang=ru"/)
  assert.match(ru, /По запросу/)
  assert.match(en, /Equipment in this category/)
  assert.match(en, /href="https:\/\/florial-bg\.com\/product\/rain-bird-valve-a\?lang=en"/)
  assert.match(en, /In stock/)
})

test('equipment listing escapes product-provided text and reports a true empty result', () => {
  const escaped = renderEquipmentCategoryListing([
    { _id: 'x', slugValue: 'safe', name: '<Valve & fitting>', sku: 'X<1' },
  ], 'en')
  assert.match(escaped, /&lt;Valve &amp; fitting&gt;/)
  assert.match(escaped, /X&lt;1/)
  assert.match(renderEquipmentCategoryListing([], 'ru'), /В этой категории пока нет товаров/)
})

test('equipment initial HTML listing is capped at the first 20 products', () => {
  const many = Array.from({ length: 25 }, (_, index) => ({
    _id: 'p' + index,
    slugValue: 'product-' + index,
    name: 'Product ' + String(index).padStart(2, '0'),
  }))
  const html = renderEquipmentCategoryListing(many, 'en')
  assert.match(html, /Showing products: 20/)
  assert.doesNotMatch(html, /product-24/)
})

test('middleware injects equipment listings only after a successful production catalogue query', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /renderEquipmentCategoryListing\(equipmentProducts, language, SITE_URL\)/)
  assert.match(middleware, /doc\._dataset === 'production' && categoryProducts !== null \? categoryProducts : undefined/)
  assert.match(middleware, /categoryProducts === null\s*\? 'no-store'/)
  assert.match(middleware, /fetchCategoryProducts\('production', doc\._id\)/)
})
