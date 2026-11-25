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
    saleVariants: [{ priceEUR: 1, stockStatus: 'outOfStock' }],
  },
]

test('equipment category entries use localized names and stable alphabetical order', () => {
  assert.deepEqual(buildEquipmentCategoryEntries(products, 'en').map((item) => item._id), ['valve-a', 'valve-b'])
  assert.deepEqual(buildEquipmentCategoryEntries(products, 'ru').map((item) => item._id), ['valve-a', 'valve-b'])
})

test('all-irrigation root SSR preserves the React category round-robin order through nested category ancestry', () => {
  const categories = [
    { _id: 'controllers', slugValue: 'controllers', parentId: 'root' },
    { _id: 'controller-child', slugValue: 'controller-child', parentId: 'controllers' },
    { _id: 'sprinklers', slugValue: 'sprinklers', parentId: 'root' },
    { _id: 'sprinkler-child', slugValue: 'sprinkler-child', parentId: 'sprinklers' },
  ]
  const products = [
    { _id: 'c1', slugValue: 'controller-a', name: 'A controller', categoryId: 'controller-child' },
    { _id: 'c2', slugValue: 'controller-b', name: 'B controller', categoryIds: ['controller-child'] },
    { _id: 's1', slugValue: 'sprinkler-y', name: 'Y sprinkler', categoryId: 'sprinkler-child' },
    { _id: 's2', slugValue: 'sprinkler-z', name: 'Z sprinkler', categoryId: 'sprinkler-child' },
  ]
  assert.deepEqual(
    buildEquipmentCategoryEntries(products, 'en', { rootCatalog: true, categories }).map((item) => item._id),
    ['c1', 's1', 'c2', 's2'],
  )
})

test('all-irrigation root SSR keeps R-VAN before HE-VAN, VAN and other nozzles', () => {
  const categories = [{ _id: 'nozzles', slugValue: 'nozzles', parentId: 'root' }]
  const products = [
    { _id: 'he', slugValue: 'he-van', name: 'A HE-VAN nozzle', categoryId: 'nozzles' },
    { _id: 'van', slugValue: 'van', name: 'B VAN nozzle', categoryId: 'nozzles' },
    { _id: 'other', slugValue: 'other', name: 'C nozzle', categoryId: 'nozzles' },
    { _id: 'r', slugValue: 'r-van', name: 'Z R-VAN nozzle', categoryId: 'nozzles' },
  ]
  assert.deepEqual(
    buildEquipmentCategoryEntries(products, 'en', { rootCatalog: true, categories }).map((item) => item._id),
    ['r', 'he', 'van', 'other'],
  )
})

test('equipment category HTML contains localized product links, image ALT/title, price, stock and SKU', () => {
  const html = renderEquipmentCategoryListing(products, 'bg')
  assert.match(html, /data-florial-server-catalogue="equipment"/)
  assert.match(html, /Показани продукти: 2/)
  assert.match(html, /href="https:\/\/florial-bg\.com\/product\/rain-bird-valve-b"/)
  assert.match(html, /src="https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/production\/valve-b-640x480\.jpg"/)
  assert.match(html, /alt="Купете Клапан B в Равда"/)
  assert.match(html, /title="Продажба на Клапан B в Равда"/)
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
  assert.doesNotMatch(ru, /Нет в наличии/)
  assert.match(ru, /39\.00 €/)
  assert.doesNotMatch(ru, /1\.00 €/)
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
  assert.match(middleware, /renderEquipmentCategoryListing\(equipmentProducts, language, SITE_URL, \{ rootCatalog, categories: equipmentCategoryTree \|\| \[\] \}\)/)
  assert.match(middleware, /doc\._dataset === 'production' && categoryProducts !== null \? categoryProducts : undefined/)
  assert.match(middleware, /type === 'category' && categoryProducts === null\s*\? 'no-store'/)
  assert.match(middleware, /fetchCategoryProducts\('production', doc\._id, \(categories\) => \{ equipmentCategoryTree = categories \}\)/)
  assert.match(middleware, /"categoryId": category->_id/)
  assert.match(middleware, /"categoryIds": categories\[\]._ref/)
  assert.match(middleware, /category-tree-v4/)
  assert.match(middleware, /category-products-v2/)
})
