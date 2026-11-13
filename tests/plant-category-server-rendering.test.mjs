import test from 'node:test'
import assert from 'node:assert/strict'
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
