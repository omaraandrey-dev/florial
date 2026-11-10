import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePlantOldPrice } from '../functions/api/manager/plant-old-price-lib.mjs'

test('keeps an old price only when it represents a real discount', () => {
  assert.equal(normalizePlantOldPrice(15, 10), 15)
  assert.equal(normalizePlantOldPrice(10, 10), null)
  assert.equal(normalizePlantOldPrice(5, 10), null)
  assert.equal(normalizePlantOldPrice(null, 10), null)
})

test('allows an ordinary price increase without requiring an old price', () => {
  assert.equal(normalizePlantOldPrice(null, 10), null)
  assert.equal(normalizePlantOldPrice(5, 10), null)
})
