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

test('blog portfolio introduction and category copy are localized in Bulgarian, Russian and English', async () => {
  const page = await read()
  assert.ok(page.includes('Здесь собраны проекты Florial'))
  assert.ok(page.includes('Explore Florial projects'))
  assert.ok(page.includes('В блога на Florial ще откриете'))
  assert.ok(page.includes("description: {bg:"))
  assert.ok(page.includes("description: {ru:"))
  assert.ok(page.includes("description: {en:"))
})

test('four visual categories use editorial slug mapping as well as existing Sanity tags', async () => {
  const page = await read()
  for (const id of ['landscape', 'irrigation', 'lawn', 'planting']) assert.ok(page.includes("id: '" + id + "'"))
  for (const slug of [
    'kak-raboti-avtomatichnata-polivna-sistema',
    'avtomatika-za-polivane-rain-bird-kontroleri',
    'polivane-na-treva-razprskvachi-dyuzhi',
    'sravnenie-rotatorni-dyuzi-rain-bird-r-van-hunter-mp-rotator',
    'cena-sistema-avtomatichno-napoyavane-burgas',
    'sistema-magluvane-terasa-besedka',
    'podroben-landshaften-proekt-gradina',
    'maslina-sredizemnomorie',
    'etapi-montazh-avtomatichna-polivna-instalatsiya',
    'rain-bird-oborudvane',
    'prodavane-traven-chim',
    'kupete-travna-plosht',
    'rozi-sympathy',
    'nov-vnos-palmi-2025',
    'kiparis-totem',
    'landshaften-dizain-proekt-zasazhdenie',
    'landshaften-proekt-zima-burgas',
    'landshaften-proekt-nesebar',
    'etapi-landshaften-proekt-nesebar',
  ]) assert.ok(page.includes("'" + slug + "'"), 'missing editorial category mapping: ' + slug)
  assert.ok(page.includes('editorialCategorySlugs.has(slug)'))
  assert.ok(page.includes('? category.slugs.includes(slug)'))
  assert.ok(page.includes(': hasAnyTag(post, category.tags)'))
  assert.ok(page.includes('posts.filter((post) => matchesBlogCategory(post, category))'))
})

test('filter controls are collapsed behind one dropdown and do not expose publication type', async () => {
  const page = await read()
  assert.ok(page.includes('aria-expanded={filtersOpen}'))
  assert.ok(page.includes('aria-controls="blog-filter-panel"'))
  assert.ok(page.includes('{filtersOpen ? <div id="blog-filter-panel"'))
  assert.ok(page.includes('type="search"'))
  assert.ok(page.includes('selectedYear'))
  assert.ok(page.includes('sortOrder'))
  assert.ok(!page.includes('selectedType'))
  assert.ok(!page.includes('Тип публикации'))
  assert.ok(!page.includes('Publication type'))
  assert.ok(!page.includes('isProject(post)'))
})

test('all published topic tags are translated for Russian and English labels', async () => {
  const page = await read()
  for (const tag of ['автоматично поливане', 'ротаторни дюзи', 'Rain Bird R-VAN', 'Hunter MP Rotator', 'дюзи за тревни площи', 'Поливни системи', 'Озеленяване', 'Ландшафтно проектиране', 'Тревни площи', 'Растения']) {
    assert.ok(page.includes("'" + tag + "':"), 'missing localized tag: ' + tag)
  }
  assert.ok(page.includes('source.toLocaleLowerCase() === normalized'))
})

test('secondary topic chips remain inside the collapsed filter panel', async () => {
  const page = await read()
  assert.ok(page.includes("const extraTags = ['Разпръсквачи', 'Капково напояване', 'Контролери']"))
  assert.ok(page.includes('const availableExtraTags = extraTags.filter'))
  assert.ok(page.includes('{availableExtraTags.length ? <div className="mt-4">'))
})

test('blog portfolio keeps published Sanity content read-only', async () => {
  const page = await read()
  assert.ok(page.includes('fetchBlogPosts(undefined, language)'))
  for (const write of ['create_documents(', 'patch_documents(', 'publish_documents(']) assert.ok(!page.includes(write))
})
