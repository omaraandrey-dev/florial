import test from 'node:test'
import assert from 'node:assert/strict'
import { appendPlantGalleryImage, appendPlantSaleVariant, buildPlantDuplicateQuery, validatePlantAddVariantRequest, verifyPlantSaleVariant } from '../functions/api/manager/plant-duplicate-lib.mjs'

test('duplicate query checks primary and localized names plus botanical candidates', () => {
  const query = buildPlantDuplicateQuery('Cycas', ['Cycas revoluta'])
  assert.match(query, /lower\(name\)==lower\("cycas"\)/)
  assert.match(query, /lower\(translations\.bg\.name\)/)
  assert.match(query, /lower\(translations\.ru\.name\)/)
  assert.match(query, /lower\(translations\.en\.name\)/)
  assert.match(query, /lower\(scientificName\)/)
  assert.match(query, /lower\(plantDetails\.scientificName\)/)
  assert.match(query, /!\(_id in path\("drafts\.\*\*"\)\)/)
})

test('duplicate query escapes seller/model supplied strings and bounds candidate count', () => {
  const query = buildPlantDuplicateQuery('Cycas") || true || ("', ['one', 'two', 'three', 'four'])
  assert.ok(query.includes(String.fromCharCode(92)))
  assert.doesNotMatch(query, /lower\(name\)==lower\("four"\)/)
})

test('duplicate query rejects empty input', () => {
  assert.throws(() => buildPlantDuplicateQuery('', []), /PLANT_DUPLICATE_QUERY_EMPTY/)
})

test('appending a plant variant preserves existing variants and permits a repeated size name', () => {
  const existing = [{ _type: 'plantSaleVariant', _key: 'old-size-key', name: '80 см', priceEUR: 90, stockStatus: 'inStock', stockQuantity: 1 }]
  const result = appendPlantSaleVariant(existing, { key: 'new-size-key', name: '80 см, 2 ствола', priceEUR: 145, stockQuantity: 20 })
  assert.equal(result.length, 2)
  assert.deepEqual(result[0], existing[0])
  assert.equal(result[1].name, '80 см, 2 ствола')
  assert.equal(result[1].priceEUR, 145)
  assert.equal(result[1].stockStatus, 'inStock')
  assert.equal(result[1].stockQuantity, 20)
  assert.throws(() => appendPlantSaleVariant(existing, { key: 'another-key', name: '90 см', priceEUR: 160, stockQuantity: 0 }), /PLANT_VARIANT_QUANTITY_REQUIRED/)
})

test('variant read-back confirms the exact key, name, EUR price and stock quantity', () => {
  const expected = { key: 'variantkey12', name: '500 см C300', priceEUR: 300, stockQuantity: 1 }
  const saved = [{ _key: 'variantkey12', name: '500 см C300', priceEUR: 300, stockStatus: 'inStock', stockQuantity: 1 }]
  assert.equal(verifyPlantSaleVariant(saved, expected), 'matched')
  assert.equal(verifyPlantSaleVariant([], expected), 'missing')
  assert.equal(verifyPlantSaleVariant(null, expected), 'missing')
})

test('variant read-back rejects partial or mismatched writes instead of reporting success', () => {
  const expected = { key: 'variantkey12', name: '500 см C300', priceEUR: 300, stockQuantity: 1 }
  assert.equal(verifyPlantSaleVariant([{ _key: 'variantkey12', name: '500 см C300', priceEUR: 300, stockStatus: 'inStock', stockQuantity: 0 }], expected), 'mismatch')
  assert.equal(verifyPlantSaleVariant([{ _key: 'variantkey12', name: '500 см C300', priceEUR: 250, stockStatus: 'inStock', stockQuantity: 1 }], expected), 'mismatch')
  assert.equal(verifyPlantSaleVariant([{ _key: 'variantkey12', name: '500 см C300', priceEUR: 300, stockStatus: 'onRequest', stockQuantity: 1 }], expected), 'mismatch')
  assert.equal(verifyPlantSaleVariant([{ _key: 'another-key', name: '500 см C300', priceEUR: 300, stockStatus: 'inStock', stockQuantity: 1 }], expected), 'missing')
})

test('gallery append never replaces the main image or existing gallery and skips duplicates', () => {
  const existing = [{ _type: 'image', _key: 'existing-image', asset: { _ref: 'image-existing' }, alt: 'old' }]
  const appended = appendPlantGalleryImage('image-main', existing, { assetId: 'image-new', key: 'new-image-key', alt: 'new photo' })
  assert.equal(appended.imageAdded, true)
  assert.equal(appended.gallery.length, 2)
  assert.equal(appended.gallery[0], existing[0])
  assert.equal(appended.gallery[1].asset._ref, 'image-new')
  assert.equal(appendPlantGalleryImage('image-new', existing, { assetId: 'image-new', key: 'unused' }).imageAlreadyPresent, true)
  assert.equal(appendPlantGalleryImage('image-main', existing, { assetId: 'image-main', key: 'unused' }).imageAlreadyPresent, true)
})

test('gallery limit does not delete existing images', () => {
  const existing = Array.from({ length: 9 }, (_, index) => ({ _key: 'image-' + index }))
  const result = appendPlantGalleryImage('image-main', existing, { assetId: 'image-new', key: 'new-image-key' })
  assert.equal(result.galleryFull, true)
  assert.equal(result.imageAdded, false)
  assert.equal(result.gallery.length, 9)
  assert.equal(result.gallery[0], existing[0])
})

test('gallery limit counts the main image as one of ten total photos', () => {
  const nineGalleryImages = Array.from({ length: 9 }, (_, index) => ({ _key: 'image-' + index }))
  const result = appendPlantGalleryImage('image-main', nineGalleryImages, { assetId: 'image-new', key: 'new-image-key' })
  assert.equal(result.galleryFull, true)
  assert.equal(result.gallery.length, 9)
})

test('add-variant request validation accepts the exact Manager payload contract', () => {
  const request = {
    idempotencyKey: 'd3c98287-368b-4d51-9f99-f8e01f9564f1',
    expectedRevision: 'revision-123',
    variant: { _key: 'variantkey12', name: '80 см', priceEUR: 145, stockQuantity: 20 },
    image: { assetId: 'image-asset-123', url: 'https://cdn.sanity.io/image/example' },
  }
  assert.deepEqual(validatePlantAddVariantRequest(request), [])
})

test('add-variant request validation identifies exactly which contract fields are missing', () => {
  assert.deepEqual(validatePlantAddVariantRequest(null), ['body'])
  assert.deepEqual(validatePlantAddVariantRequest({
    expectedRevision: '',
    variant: null,
    image: [],
  }), ['idempotencyKey', 'expectedRevision', 'variant', 'image'])
  assert.deepEqual(validatePlantAddVariantRequest({
    idempotencyKey: 'not-a-uuid',
    expectedRevision: 'revision-123',
    variant: {},
    image: {},
  }), ['idempotencyKey'])
})
