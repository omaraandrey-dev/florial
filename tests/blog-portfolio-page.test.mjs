import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = () => readFile(new URL('../src/pages/BlogPage.tsx', import.meta.url), 'utf8')

test('blog portfolio page uses one clear breadcrumb and removes the redundant Florial eyebrow', async () => {
  const page = await read()
  assert.ok(page.includes('aria-current="page"'))
  assert.ok(!page.includes('<p className="text-xs font-bold uppercase tracking-widest text-[#71824F]">Florial</p>'))
  assert.ok(page.includes('Блог и портфолио'))
})

test('blog portfolio presents four curated visual directions using existing published post tags and cover images', async () => {
  const page = await read()
  for (const id of ['landscape', 'irrigation', 'lawn', 'planting']) assert.ok(page.includes("id: '" + id + "'"))
  assert.ok(page.includes('posts.filter((post) => hasAnyTag(post, category.tags))'))
  assert.ok(page.includes('imagePost?.cover?.asset?.url'))
  assert.ok(page.includes('getSanityImageProps(imagePost.cover.asset.url'))
})

test('blog portfolio combines search, topic, publication type and year filters', async () => {
  const page = await read()
  for (const token of ['type="search"', 'selectedCategory', 'selectedTag', 'selectedType', 'selectedYear', 'matchesCategory && matchesTag && matchesType && matchesYear && matchesSearch', "sortOrder === 'newest'", 'function clearFilters()']) assert.ok(page.includes(token))
})

test('secondary topic chips are curated from known tags and unavailable topics are not displayed', async () => {
  const page = await read()
  assert.ok(page.includes("const extraTags = ['Разпръсквачи', 'Капково напояване', 'Контролери']"))
  assert.ok(page.includes('const availableExtraTags = extraTags.filter'))
})

test('blog portfolio keeps existing Sanity content read-only and uses the current compact blog query', async () => {
  const page = await read()
  assert.ok(page.includes('fetchBlogPosts(undefined, language)'))
  for (const write of ['create_documents(', 'patch_documents(', 'publish_documents(']) assert.ok(!page.includes(write))
})
