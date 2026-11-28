import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('shared header SSR seed replaces repeated browser-side header requests', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const fragment of ['async function fetchHeaderSeed(', 'header/production/shell-v1/', 'header/plants/categories-v1', 'florial-header-ssr-data', 'const sanityQueryInFlight = new Map', 'sanityQueryInFlight.get(inFlightKey)', '!isHomepage', '!isManager']) {
    assert.ok(middleware.includes(fragment), 'middleware missing: ' + fragment)
  }
  for (const fragment of ['function readHeaderSeed(language: string)', 'if (homepageSeed || initialHeaderSeed)', 'initialHeaderSeed?.language === language ? initialHeaderSeed.headerBlogPosts']) {
    assert.ok(app.includes(fragment), 'app missing: ' + fragment)
  }
})

test('combined header query preserves every existing header data family', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  for (const fragment of ['"equipmentCategories": *[_type == "category"]', '"services": *[_type == "service" && isActive != false]', '"siteSettings": *[_type == "siteSettings"][0]', '"logo": *[_type == "photo"', '"headerBlogPosts": *[_type == "blogPost"']) {
    assert.ok(middleware.includes(fragment), 'combined query missing: ' + fragment)
  }
})

test('Header SSR category payload also satisfies the full catalogue category state', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(middleware, /"productCount": count\(\*\[_type == "product"/)
  assert.match(middleware, /"imageUrl": coalesce\(image\.asset->url, externalImageUrl\)/)
  assert.match(app, /useState\(!\(homepageSeed \|\| initialHeaderSeed\)\)/)
  assert.match(app, /useRef\(Boolean\(homepageSeed \|\| initialHeaderSeed\)\)/)
  assert.match(app, /initialHeaderSeed \? \[\.\.\.initialHeaderSeed\.equipmentCategories, \.\.\.initialHeaderSeed\.plantCategories\]/)
})
