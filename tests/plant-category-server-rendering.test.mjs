import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildPlantCategoryEntries,
  buildPlantCategoryItemList,
  collectDescendantCategoryIds,
  renderPlantCategoryListing,
} from '../functions/_lib/plantCategoryHtml.mjs'

test('collects all nested plant category IDs and prevents parent cycles', () => {
  const categories = [
    { _id: 'root', parentId: null },
    { _id: 'trees', parentId: 'root' },
    { _id: 'conifers', parentId: 'trees' },
    { _id: 'flowers', parentId: 'root' },
    { _id: 'root', parentId: 'conifers' },
  ]
  assert.deepEqual(new Set(collectDescendantCategoryIds('root', categories)), new Set(['root', 'trees', 'conifers', 'flowers']))
})

test('plant category entries sort available products first and use localized names', () => {
  const products = [
    { _id: 'request', slugValue: 'request', name: 'Запрос', stockStatus: 'onRequest', translations: { en: { name: 'On request' } } },
    { _id: 'stock', slugValue: 'stock', name: 'Наличен', saleVariants: [{ stockStatus: 'inStock', priceEUR: 25 }], translations: { en: { name: 'Available' } } },
    { _id: 'empty', slugValue: 'empty', name: 'Изчерпан', stockStatus: 'outOfStock' },
  ]
  assert.deepEqual(buildPlantCategoryEntries(products, 'en').map((item) => item._id), ['stock', 'request', 'empty'])
})

test('renders escaped product links, localized labels, and no false empty-state text', () => {
  const products = [
    { _id: 'p1', slugValue: 'yucca-rostrata', name: '<Юка>', priceEUR: 150, stockStatus: 'inStock' },
  ]
  const html = renderPlantCategoryListing(products, 'bg')
  assert.match(html, /data-florial-server-catalogue="plants"/)
  assert.match(html, /href="https:\/\/florial-bg\.com\/product\/yucca-rostrata"/)
  assert.match(html, /&lt;Юка&gt;/)
  assert.doesNotMatch(html, /В тази категория все още няма налични продукти/)
})

test('does not invent an availability label when Sanity has no stock status', () => {
  const html = renderPlantCategoryListing([
    { _id: 'p1', slugValue: 'unknown-stock', name: 'Plant without stock status' },
  ], 'en')
  assert.doesNotMatch(html, /On request/)
  assert.match(html, /Plant without stock status/)
})

test('renders a real empty state only when the successful result is empty', () => {
  assert.match(renderPlantCategoryListing([], 'ru'), /В этой категории пока нет товаров/)
  assert.match(renderPlantCategoryListing([], 'en'), /There are currently no products/)
})

test('builds a localized ItemList with stable product URLs', () => {
  const list = buildPlantCategoryItemList([
    { _id: 'p1', slugValue: 'yucca-rostrata', name: 'Юка', translations: { en: { name: 'Yucca rostrata' } } },
  ], 'en')
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.itemListElement[0].name, 'Yucca rostrata')
  assert.equal(list.itemListElement[0].url, 'https://florial-bg.com/product/yucca-rostrata?lang=en')
})

test('Cloudflare Pages middleware includes plant products in the initial category HTML', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /type === 'category' && doc\._dataset === 'plants'/)
  assert.match(middleware, /await fetchPlantCategoryProducts\(doc\._id\)/)
  assert.match(middleware, /renderPlantCategoryListing\(plantProducts \|\| \[\], language, SITE_URL\)/)
  assert.match(middleware, /buildPlantCategoryItemList\(plantCategoryProducts, language, SITE_URL\)/)
})

test('plant catalogue failures do not become a false empty-category response', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /return unavailableResponse\(language\)/)
  assert.match(middleware, /if \(!Array\.isArray\(products\)\) throw new Error\('Sanity plants category products is not an array'\)/)
  assert.match(middleware, /s-maxage=30, stale-while-revalidate=60/)
})
