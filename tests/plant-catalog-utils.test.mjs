import test from 'node:test'
import assert from 'node:assert/strict'
import {
  comparePlantProducts,
  getPlantAvailabilityPriority,
  getPlantDisplayName,
  getPlantMinimumPrice,
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
