import test from 'node:test'
import assert from 'node:assert/strict'
import { appendPlantGalleryImage, appendPlantSaleVariant, buildPlantDuplicateQuery } from '../functions/api/manager/plant-duplicate-lib.ts'

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
  const result = appendPlantSaleVariant(existing, { key: 'new-size-key', name: '80 см, 2 ствола', priceEUR: 145 })
  assert.equal(result.length, 2)
  assert.deepEqual(result[0], existing[0])
  assert.equal(result[1].name, '80 см, 2 ствола')
  assert.equal(result[1].priceEUR, 145)
  assert.equal(result[1].stockStatus, 'onRequest')
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
