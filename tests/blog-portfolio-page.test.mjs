import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = () => readFile(new URL('../src/pages/BlogPage.tsx', import.meta.url), 'utf8')

test('blog portfolio page uses one clear breadcrumb and removes the redundant Florial eyebrow', async () => {
  const page = await read()
  assert.match(page, /aria-current="page">\\{copy\\.title\\}/)
  assert.doesNotMatch(page, /<p[^>]*>Florial<\\/p>/)
  assert.match(page, /Блог и портфолио/)
})

test('blog portfolio presents four curated visual directions using existing published post tags and cover images', async () => {
  const page = await read()
  for (const id of ['landscape', 'irrigation', 'lawn', 'planting']) assert.ok(page.includes("id: '" + id + "'"))
  assert.match(page, /posts\\.filter\\(\\(post\\) => hasAnyTag\\(post, category\\.tags\\)\\)/)
  assert.match(page, /imagePost\\?\\.cover\\?\\.asset\\?\\.url/)
  assert.match(page, /getSanityImageProps\\(imagePost\\.cover\\.asset\\.url/)
})

test('blog portfolio combines search, topic, publication type and year filters', async () => {
  const page = await read()
  assert.match(page, /type="search"/)
  assert.match(page, /selectedCategory/)
  assert.match(page, /selectedTag/)
  assert.match(page, /selectedType/)
  assert.match(page, /selectedYear/)
  assert.match(page, /matchesCategory && matchesTag && matchesType && matchesYear && matchesSearch/)
  assert.match(page, /sortOrder === 'newest'/)
  assert.match(page, /function clearFilters\\(\\)/)
})

test('secondary topic chips are curated from known tags and unavailable topics are not displayed', async () => {
  const page = await read()
  assert.match(page, /const extraTags = \\['Разпръсквачи', 'Капково напояване', 'Контролери'\\]/)
  assert.match(page, /const availableExtraTags = extraTags\\.filter/)
})

test('blog portfolio keeps existing Sanity content read-only and uses the current compact blog query', async () => {
  const page = await read()
  assert.match(page, /fetchBlogPosts\\(undefined, language\\)/)
  assert.doesNotMatch(page, /create_documents|patch_documents|publish_documents|schema/)
})
