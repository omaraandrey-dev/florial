import test from 'node:test'
import assert from 'node:assert/strict'
import { getPlantPrice, selectFeaturedEquipment } from '../src/lib/homepageFeatured.mjs'

test('featured equipment excludes the standard 5x5 kit and appends the six-zone kit', () => {
  const products = [
    { slug: { current: 'kit-a' } },
    { slug: { current: 'komplekt-polivane-5x5' } },
    { slug: { current: 'kit-b' } },
    { slug: { current: 'kit-c' } },
    { slug: { current: 'kit-d' } },
    { slug: { current: 'komplekt-avtomatizatsiya-6-zoni' } },
  ]

  assert.deepEqual(selectFeaturedEquipment(products).map((product) => product.slug.current), [
    'kit-a', 'kit-b', 'kit-c', 'komplekt-avtomatizatsiya-6-zoni',
  ])
})

test('featured equipment stays at three regular picks when the six-zone kit is unavailable', () => {
  const products = ['a', 'b', 'c', 'd'].map((current) => ({ slug: { current } }))
  assert.deepEqual(selectFeaturedEquipment(products).map((product) => product.slug.current), ['a', 'b', 'c'])
})

test('plant price uses the cheapest available variant and marks a range only for different prices', () => {
  const product = {
    saleVariants: [
      { priceEUR: 10, stockStatus: 'outOfStock' },
      { priceEUR: 18, stockStatus: 'inStock' },
      { priceEUR: 24, stockStatus: 'onRequest' },
    ],
  }
  assert.deepEqual(getPlantPrice(product), { price: 18, from: true })
  assert.deepEqual(getPlantPrice({ saleVariants: [{ priceEUR: 18 }, { priceEUR: 18 }] }), { price: 18, from: false })
})

test('plant price falls back to base price only when there are no variants', () => {
  assert.deepEqual(getPlantPrice({ priceEUR: 12.5 }), { price: 12.5, from: false })
  assert.equal(getPlantPrice({ saleVariants: [{ priceEUR: 12, stockStatus: 'outOfStock' }] }), null)
  assert.equal(getPlantPrice({ priceEUR: 0 }), null)
})
