import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeCategoryRelatedContent, mergePlantRelatedContent, parseCategoryRelatedContentPath } from '../src/lib/plantRelatedContentUtils.mjs'

const service = (slug, overrides = {}) => ({
  _id: `service-${slug}`,
  _type: 'service',
  slug: { current: slug },
  isActive: true,
  ...overrides,
})

const article = (slug, overrides = {}) => ({
  _id: `article-${slug}`,
  _type: 'blogPost',
  slug: { current: slug },
  isPublished: true,
  ...overrides,
})

test('category service is first, followed by plant-specific references in their Sanity order', () => {
  const category = service('planting-palms')
  const individual = [article('palm-care'), service('drip-irrigation')]
  assert.deepEqual(mergePlantRelatedContent(category, individual).map((item) => item.slug.current), [
    'planting-palms', 'palm-care', 'drip-irrigation',
  ])
})

test('a category item already present in plant-specific links is not duplicated', () => {
  const category = service('planting-olives')
  const individual = [article('olive-care'), service('planting-olives'), service('drip-irrigation')]
  assert.deepEqual(mergePlantRelatedContent(category, individual).map((item) => item.slug.current), [
    'planting-olives', 'olive-care', 'drip-irrigation',
  ])
})

test('inactive services and unpublished articles are excluded', () => {
  const category = service('inactive-service', { isActive: false })
  const individual = [service('active-service'), article('draft-article', { isPublished: false })]
  assert.deepEqual(mergePlantRelatedContent(category, individual).map((item) => item.slug.current), ['active-service'])
})

test('empty category relation preserves individual content order', () => {
  const individual = [article('first'), service('second')]
  assert.deepEqual(mergePlantRelatedContent(null, individual).map((item) => item.slug.current), ['first', 'second'])
})


test('equipment category service is first and keeps remaining product links in order', () => {
  const category = service('irrigation-installation')
  const individual = [article('controller-guide'), service('valve-maintenance')]
  assert.deepEqual(mergeCategoryRelatedContent(category, individual).map((item) => item.slug.current), [
    'irrigation-installation', 'controller-guide', 'valve-maintenance',
  ])
})

test('equipment category link already in product links is not repeated', () => {
  const category = service('sprinkler-installation')
  const individual = [service('sprinkler-installation'), article('sprinkler-guide')]
  assert.deepEqual(mergeCategoryRelatedContent(category, individual).map((item) => item.slug.current), [
    'sprinkler-installation', 'sprinkler-guide',
  ])
})

test('category related path accepts service and blog routes only', () => {
  assert.deepEqual(parseCategoryRelatedContentPath('/services/irrigation-installation'), {
    type: 'service', slug: 'irrigation-installation',
  })
  assert.deepEqual(parseCategoryRelatedContentPath('/blog/controller-guide'), {
    type: 'blogPost', slug: 'controller-guide',
  })
  assert.equal(parseCategoryRelatedContentPath('/category/controllers'), null)
  assert.equal(parseCategoryRelatedContentPath('https://florial-bg.com/services/irrigation-installation'), null)
  assert.equal(parseCategoryRelatedContentPath('/services/nested/path'), null)
  assert.equal(parseCategoryRelatedContentPath(''), null)
})
