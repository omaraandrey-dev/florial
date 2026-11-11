import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPlantCatalogOffers,
  comparePlantProducts,
  getPlantAvailabilityPriority,
  getPlantDisplayName,
  getPlantCatalogCardImageUrl,
  getPlantMinimumPrice,
  resolveInitialPlantVariantKey,
  getPlantStockStatus,
} from '../src/lib/plantCatalogUtils.ts'

const plant = (name, stockStatus, variants = []) => ({
  _id: name,
  name,
  priceEUR: 0,
  stockStatus,
  saleVariants: variants,
})

test('variant availability takes precedence over a stale root status', () => {
  const product = plant('Trachycarpus', 'outOfStock', [
    { name: '200 cm', stockStatus: 'inStock', priceEUR: 600 },
    { name: '240 cm', stockStatus: 'outOfStock', priceEUR: 700 },
  ])

  assert.equal(getPlantStockStatus(product), 'inStock')
  assert.equal(getPlantAvailabilityPriority(product), 0)
})

test('plants are grouped in stock, on request, then out of stock', () => {
  assert.equal(getPlantAvailabilityPriority(plant('A', 'inStock')), 0)
  assert.equal(getPlantAvailabilityPriority(plant('B', 'onRequest')), 1)
  assert.equal(getPlantAvailabilityPriority(plant('C', 'outOfStock')), 2)
})

test('variant statuses override a contradictory root in-stock status', () => {
  const product = plant('Sold out palm', 'inStock', [
    { name: 'small', stockStatus: 'outOfStock' },
    { name: 'large', stockStatus: 'outOfStock' },
  ])

  assert.equal(getPlantStockStatus(product), 'outOfStock')
  assert.equal(getPlantAvailabilityPriority(product), 2)
})

test('minimum price is taken from real positive variant prices', () => {
  assert.equal(getPlantMinimumPrice(plant('A', 'inStock', [
    { name: 'small', priceEUR: 0 },
    { name: 'medium', priceEUR: 45 },
    { name: 'large', priceEUR: 80 },
  ])), 45)
  assert.equal(getPlantMinimumPrice(plant('B', 'onRequest', [])), null)
})

test('localized plant name falls back to the main name when translation is empty', () => {
  const product = {
    name: 'Палма Трахикарпус',
    seo: { h1: 'Трахикарпус (Trachycarpus fortunei)' },
    translations: { bg: { name: '' }, ru: { name: '', seo: { h1: 'Трахикарпус Форчуна' } } },
  }

  assert.equal(getPlantDisplayName(product, '', 'bg'), 'Палма Трахикарпус')
  assert.equal(getPlantDisplayName(product, '', 'ru'), 'Трахикарпус Форчуна')
  assert.equal(getPlantDisplayName(product, 'Вентилаторна палма', 'bg'), 'Вентилаторна палма')
})

test('price sorting never moves on-request or out-of-stock plants ahead of in-stock plants', () => {
  const products = [
    plant('Available expensive', 'inStock', [{ name: 'large', priceEUR: 200 }]),
    plant('Available cheap', 'inStock', [{ name: 'small', priceEUR: 30 }]),
    plant('On request cheap', 'onRequest', [{ name: 'small', priceEUR: 5 }]),
    plant('Out of stock', 'outOfStock', [{ name: 'small', priceEUR: 1 }]),
    plant('No price', 'inStock', [{ name: 'size', priceEUR: null }]),
  ]
  const getName = (product) => product.name

  assert.deepEqual(
    products.slice().sort((a, b) => comparePlantProducts(a, b, 'priceAsc', getName, 'bg')).map((item) => item.name),
    ['Available cheap', 'Available expensive', 'No price', 'On request cheap', 'Out of stock'],
  )
  assert.deepEqual(
    products.slice().sort((a, b) => comparePlantProducts(a, b, 'priceDesc', getName, 'bg')).map((item) => item.name),
    ['Available expensive', 'Available cheap', 'No price', 'On request cheap', 'Out of stock'],
  )
})


test('catalog offers expand each plant size and preserve one shared product record', () => {
  const product = plant('Trachycarpus', 'inStock', [
    { _key: 'small', name: 'Small', priceEUR: 90, stockStatus: 'inStock' },
    { _key: 'large', name: 'Large', priceEUR: 180, stockStatus: 'inStock' },
  ])
  const offers = buildPlantCatalogOffers(
    [product],
    'default',
    (item) => item.name,
    (variant) => variant.name,
    'bg',
  )

  assert.equal(offers.length, 2)
  assert.ok(offers.every((offer) => offer.product === product))
  assert.deepEqual(offers.map((offer) => offer.variantKey), ['small', 'large'])
})

test('catalog offers sort each size by its own availability and price', () => {
  const product = plant('Palm', 'inStock', [
    { _key: 'sold', name: 'Sold', priceEUR: 20, stockStatus: 'outOfStock' },
    { _key: 'request', name: 'Request', priceEUR: 10, stockStatus: 'onRequest' },
    { _key: 'available-expensive', name: 'Available large', priceEUR: 80, stockStatus: 'inStock' },
    { _key: 'available-cheap', name: 'Available small', priceEUR: 30, stockStatus: 'inStock' },
  ])
  const offers = buildPlantCatalogOffers([product], 'priceAsc', (item) => item.name, (v) => v.name, 'bg')

  assert.deepEqual(offers.map((offer) => offer.variantKey), [
    'available-cheap',
    'available-expensive',
    'request',
    'sold',
  ])
})

test('catalog offers keep missing prices after priced offers within availability group', () => {
  const product = plant('Palm', 'inStock', [
    { _key: 'unknown', name: 'Unknown price', stockStatus: 'inStock' },
    { _key: 'priced', name: 'Priced', priceEUR: 30, stockStatus: 'inStock' },
  ])
  const offers = buildPlantCatalogOffers([product], 'priceDesc', (item) => item.name, (v) => v.name, 'bg')

  assert.deepEqual(offers.map((offer) => offer.variantKey), ['priced', 'unknown'])
})


test('catalog offers keep Sanity variant order when no price sort is selected', () => {
  const product = plant('Palm', 'inStock', [
    { _key: 'small', name: 'Small', priceEUR: 90, stockStatus: 'inStock' },
    { _key: 'large', name: 'Large', priceEUR: 180, stockStatus: 'inStock' },
  ])
  const offers = buildPlantCatalogOffers([product], 'default', (item) => item.name, (v) => v.name, 'bg')
  assert.deepEqual(offers.map((offer) => offer.variantKey), ['small', 'large'])
})

test('catalog offers support descending price order within availability groups', () => {
  const product = plant('Palm', 'inStock', [
    { _key: 'small', name: 'Small', priceEUR: 90, stockStatus: 'inStock' },
    { _key: 'large', name: 'Large', priceEUR: 180, stockStatus: 'inStock' },
  ])
  const offers = buildPlantCatalogOffers([product], 'priceDesc', (item) => item.name, (v) => v.name, 'bg')
  assert.deepEqual(offers.map((offer) => offer.variantKey), ['large', 'small'])
})

test('product page uses the requested sale variant only when the key exists', () => {
  const variants = [
    { _key: 'small', name: 'Small' },
    { name: 'Large' },
  ]
  assert.equal(resolveInitialPlantVariantKey(variants, '0'), 'small')
  assert.equal(resolveInitialPlantVariantKey(variants, '1'), '1')
  assert.equal(resolveInitialPlantVariantKey(variants, 'missing'), 'small')
  assert.equal(resolveInitialPlantVariantKey([], 'missing'), '0')
})


test('highest-priced plant size always uses the main image', () => {
  const small = { _key: 'small', name: 'Small', priceEUR: 80 }
  const large = { _key: 'large', name: 'Large', priceEUR: 250 }
  const product = {
    ...plant('Palm', 'inStock', [small, large]),
    mainImageUrl: 'main.jpg',
    imageUrl: 'fallback.jpg',
    galleryImages: ['gallery-a.jpg', { url: 'gallery-b.jpg' }],
  }

  assert.equal(getPlantCatalogCardImageUrl(product, large), 'main.jpg')
})

test('other plant sizes use a stable pseudo-random image from main and gallery', () => {
  const small = { _key: 'small', name: 'Small', priceEUR: 80 }
  const medium = { _key: 'medium', name: 'Medium', priceEUR: 140 }
  const large = { _key: 'large', name: 'Large', priceEUR: 250 }
  const product = {
    ...plant('Palm', 'inStock', [small, medium, large]),
    mainImageUrl: 'main.jpg',
    imageUrl: 'fallback.jpg',
    galleryImages: ['gallery-a.jpg', { url: 'gallery-b.jpg' }],
  }

  const selected = getPlantCatalogCardImageUrl(product, medium)
  assert.ok(['main.jpg', 'gallery-a.jpg', 'gallery-b.jpg'].includes(selected))
  assert.equal(getPlantCatalogCardImageUrl(product, medium), selected)
  assert.equal(getPlantCatalogCardImageUrl(product, large), 'main.jpg')
})
