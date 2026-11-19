import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlantCategoryBreadcrumbs } from '../src/lib/productBreadcrumbs.ts'

const category = (id, name, parentId = null, slug = id) => ({
  _id: id,
  name,
  slug: { current: slug },
  parentId,
})

const categories = [
  category('plants-root', 'Растения', null, 'rastenia'),
  category('trees', 'Дървета и храсти', 'plants-root'),
  category('palms', 'Палми', 'trees'),
  category('evergreen', 'Вечнозелени', 'plants-root'),
  category('large', 'Крупномерни', 'plants-root'),
  category('flowers', 'Цветя', 'plants-root'),
]

test('plant breadcrumbs show the primary category path and every extra category once', () => {
  const result = buildPlantCategoryBreadcrumbs({
    categoryId: 'palms',
    categories: [
      { _id: 'palms', name: 'Палми' },
      { _id: 'evergreen', name: 'Вечнозелени' },
      { _id: 'large', name: 'Крупномерни' },
      { _id: 'evergreen', name: 'Duplicate' },
    ],
  }, categories)

  assert.equal(result.catalogRoot?._id, 'plants-root')
  assert.deepEqual(result.primaryTrail.map((item) => item._id), ['trees', 'palms'])
  assert.deepEqual(result.additionalCategories.map((item) => item._id), ['evergreen', 'large'])
})

test('a category repeated in the assigned list and primary ancestor path is not duplicated', () => {
  const result = buildPlantCategoryBreadcrumbs({
    categoryId: 'palms',
    categories: [
      { _id: 'trees', name: 'Дървета и храсти' },
      { _id: 'palms', name: 'Палми' },
      { _id: 'flowers', name: 'Цветя' },
    ],
  }, categories)

  assert.deepEqual(result.primaryTrail.map((item) => item._id), ['trees', 'palms'])
  assert.deepEqual(result.additionalCategories.map((item) => item._id), ['flowers'])
})

test('legacy products without categoryId use their deepest assigned category as primary', () => {
  const result = buildPlantCategoryBreadcrumbs({
    categories: [
      { _id: 'trees', name: 'Дървета и храсти' },
      { _id: 'palms', name: 'Палми' },
      { _id: 'evergreen', name: 'Вечнозелени' },
    ],
  }, categories)

  assert.deepEqual(result.primaryTrail.map((item) => item._id), ['trees', 'palms'])
  assert.deepEqual(result.additionalCategories.map((item) => item._id), ['evergreen'])
})

test('missing references and category cycles do not create broken or repeated breadcrumbs', () => {
  const cyclic = [
    category('plants-root', 'Растения', null, 'rastenia'),
    category('cycle-a', 'A', 'cycle-b'),
    category('cycle-b', 'B', 'cycle-a'),
  ]
  const result = buildPlantCategoryBreadcrumbs({
    categoryId: 'cycle-a',
    categories: [{ _id: 'missing', name: 'Missing' }],
  }, cyclic)

  assert.deepEqual(result.primaryTrail.map((item) => item._id), ['cycle-b', 'cycle-a'])
  assert.deepEqual(result.additionalCategories, [])
})
