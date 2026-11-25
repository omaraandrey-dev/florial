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
  assert.match(html, /Показани продукти: 1/)
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
  assert.match(middleware, /if \(doc\._dataset === 'plants'\)/)
  assert.match(middleware, /await fetchPlantCategoryProducts\\(doc\\._id(?:,\\s*\\(categories\\))?/)
  assert.match(middleware, /defined\(slug\.current\)/)
  assert.match(middleware, /renderPlantCategoryListing\(plantProducts \|\| \[\], language, SITE_URL\)/)
  assert.match(middleware, /makeCategoryCollectionJsonLd\(name, metaDescription, canonicalUrl, categoryStructuredProducts, language\)/)
  assert.match(middleware, /: categoryProducts \|\| \[\]/)
})

test('plant catalogue failures do not become a false empty-category response', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /return unavailableResponse\(language\)/)
  assert.match(middleware, /if \(!Array\.isArray\(products\)\) throw new Error\('Sanity ' \+ dataset \+ ' category products is not an array'\)/)
  assert.match(middleware, /s-maxage=30, stale-while-revalidate=60/)
})


test('plant catalogue expands sale variants into the same first-page offers as the client', () => {
  const products = [
    {
      _id: 'plant-a', slugValue: 'plant-a', name: 'Alpha plant',
      imageUrl: 'https://cdn.sanity.io/images/bxvcy0qs/plants/main-800x600.jpg',
      galleryImageUrls: ['https://cdn.sanity.io/images/bxvcy0qs/plants/gallery-800x600.jpg'],
      plantCare: { minWinterTempC: -8 },
      translations: { en: { name: 'Alpha plant', shortDescription: 'A plant summary.' } },
      saleVariants: [
        { _key: 'a-1', name: 'Small C5', nameEn: 'Small C5', priceEUR: 20, stockStatus: 'outOfStock', saleHeightCm: 40, containerVolumeL: 5 },
        { _key: 'a-2', name: 'Large C20', nameEn: 'Large C20', priceEUR: 60, stockStatus: 'inStock', saleHeightCm: 100, containerVolumeL: 20 },
      ],
    },
    {
      _id: 'plant-b', slugValue: 'plant-b', name: 'Beta plant',
      saleVariants: [{ _key: 'b-1', name: 'Medium C10', nameEn: 'Medium C10', priceEUR: 35, stockStatus: 'onRequest' }],
    },
  ]
  const entries = buildPlantCategoryEntries(products, 'en')
  assert.equal(entries.length, 3)
  assert.deepEqual(entries.map((entry) => entry._catalogVariant?._key), ['a-2', 'b-1', 'a-1'])
  const html = renderPlantCategoryListing(products, 'en')
  assert.match(html, /data-florial-server-catalogue="plants"/)
  assert.match(html, /A plant summary\./)
  assert.match(html, /Large C20/)
  assert.match(html, /Small C5/)
  assert.match(html, /60\.00 €/)
  assert.match(html, /100 cm/)
  assert.match(html, /−8 °C/)
  assert.match(html, /Buy Alpha plant in Nessebar/)
  assert.match(html, /gallery-800x600/)
})

test('plant catalogue limits the server first response to 20 sale offers, not 20 source products', () => {
  const products = Array.from({ length: 12 }, (_, index) => ({
    _id: 'plant-' + index,
    slugValue: 'plant-' + index,
    name: 'Plant ' + String(index).padStart(2, '0'),
    saleVariants: [
      { _key: 'v1', name: 'Variant one', stockStatus: 'inStock', priceEUR: 10 },
      { _key: 'v2', name: 'Variant two', stockStatus: 'inStock', priceEUR: 20 },
    ],
  }))
  assert.equal(buildPlantCategoryEntries(products, 'bg').length, 20)
  assert.match(renderPlantCategoryListing(products, 'bg'), /Показани продукти: 20/)
})

test('plant category SSR includes category navigation images and localized editorial content', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /fetchPlantCategoryProducts\(doc\._id, \(categories\) => \{ plantCategoryTree = categories \}\)/)
  assert.match(middleware, /renderPlantCategoryNavigation\(plantCategoryTree, doc\._id, language\)/)
  assert.match(middleware, /renderPortableText\(language === 'bg' \? doc\.seoContent : doc\.translations\?\.\[language\]\?\.seoContent \|\| doc\.seoContent\)/)
  assert.match(middleware, /"galleryImageUrls": gallery\[\]\.asset->url/)
  assert.match(middleware, /saleVariants\[\] \{ _key, name, nameEn, nameRu, sku, priceEUR, oldPriceEUR, stockStatus, stockQuantity, saleHeightCm, containerVolumeL \}/)
  assert.match(middleware, /buildPlantCategoryEntries\(categoryProducts \|\| \[\], language\)/)
})
