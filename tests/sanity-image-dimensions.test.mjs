import test from 'node:test'
import assert from 'node:assert/strict'
import { getSanityImageDimensionAttributes } from '../functions/lib/sanityImageDimensions.ts'

test('reserves square Sanity image dimensions in fallback HTML', () => {
  const attributes = getSanityImageDimensionAttributes(
    'https://cdn.sanity.io/images/bxvcy0qs/production/1ad53198d5c22297855e59e7927002d6ec28f9bb-1254x1254.png',
  )
  assert.equal(attributes, ' width="1254" height="1254"')
})

test('preserves landscape and portrait dimensions when CDN query parameters are present', () => {
  assert.equal(
    getSanityImageDimensionAttributes('https://cdn.sanity.io/images/bxvcy0qs/production/example-1600x900.webp?auto=format&fit=max'),
    ' width="1600" height="900"',
  )
  assert.equal(
    getSanityImageDimensionAttributes('https://cdn.sanity.io/images/bxvcy0qs/production/example-900x1600.jpg?rect=0,0,900,1600'),
    ' width="900" height="1600"',
  )
})

test('does not invent intrinsic dimensions for non-Sanity or dimensionless images', () => {
  assert.equal(getSanityImageDimensionAttributes('https://example.com/garden.jpg'), '')
  assert.equal(getSanityImageDimensionAttributes('https://cdn.sanity.io/images/bxvcy0qs/production/garden.jpg'), '')
  assert.equal(getSanityImageDimensionAttributes('/images/garden-1200x800.jpg'), '')
})

test('rejects invalid zero dimensions', () => {
  assert.equal(getSanityImageDimensionAttributes('https://cdn.sanity.io/images/bxvcy0qs/production/garden-0x800.jpg'), '')
  assert.equal(getSanityImageDimensionAttributes('https://cdn.sanity.io/images/bxvcy0qs/production/garden-800x0.jpg'), '')
})
