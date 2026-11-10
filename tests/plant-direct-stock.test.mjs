import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePlantVariantStock } from '../functions/api/manager/plant-stock-lib.mjs'

const variant = (key, stockStatus = 'inStock', stockQuantity = 20) => ({
  _key: key, name: '80 см', priceEUR: 100, stockStatus, stockQuantity,
})

test('new plant variants defaulting to in stock require a positive integer quantity', () => {
  assert.equal(validatePlantVariantStock([variant('new-variant-key', 'inStock', 20)], [], true)[0].stockQuantity, 20)
  assert.throws(() => validatePlantVariantStock([variant('new-variant-key', 'inStock', null)], [], true), /реално количество/)
  assert.throws(() => validatePlantVariantStock([variant('new-variant-key', 'inStock', 0)], [], true), /реално количество/)
})

test('new variants added while editing an existing plant require quantity', () => {
  const existing = [variant('old-variant-key', 'inStock', null)]
  assert.equal(validatePlantVariantStock([
    variant('old-variant-key', 'inStock', null),
    variant('new-variant-key', 'inStock', 12),
  ], existing, false).length, 2)
  assert.throws(() => validatePlantVariantStock([
    variant('old-variant-key', 'inStock', null),
    variant('new-variant-key', 'inStock', null),
  ], existing, false), /реално количество/)
})

test('legacy in-stock variants without quantity remain editable and on-request variants need no quantity', () => {
  const legacy = variant('legacy-key', 'inStock', null)
  assert.equal(validatePlantVariantStock([legacy], [legacy], false)[0].stockQuantity, null)
  assert.equal(validatePlantVariantStock([variant('request-key', 'onRequest', null)], [], true)[0].stockStatus, 'onRequest')
})

test('changing an existing variant from on-request to in-stock requires quantity', () => {
  const existing = [variant('old-key', 'onRequest', null)]
  assert.throws(() => validatePlantVariantStock([variant('old-key', 'inStock', null)], existing, false), /реално количество/)
})

test('fractional stock quantities are rejected', () => {
  assert.throws(() => validatePlantVariantStock([variant('new-variant-key', 'inStock', 1.5)], [], true), /реално количество/)
})
