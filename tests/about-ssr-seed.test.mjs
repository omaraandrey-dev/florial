import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('About page reuses the photo documents already fetched for its SSR HTML', async () => {
  const middleware = await read('../functions/_middleware.ts')
  const app = await read('../src/App.tsx')
  const page = await read('../src/pages/AboutPage.tsx')

  assert.match(middleware, /rolePhotos: photos\.map\(\(photo\) => \(\{/)
  assert.match(middleware, /id="florial-about-ssr-data"/)
  assert.match(middleware, /rolePhotos: about\.rolePhotos/)
  assert.match(app, /getElementById\('florial-about-ssr-data'\)/)
  assert.match(app, /initialRolePhotos=\{initialAboutSeed\?\.language === language \? initialAboutSeed\.rolePhotos : undefined\}/)
  assert.match(page, /initialRolePhotos\?: ServiceRolePhoto\[\]/)
  assert.match(page, /if \(hasCompleteInitialPhotos\) return/)
  assert.match(page, /\}, \[initialRolePhotos\]\)/)
})

test('About SSR seed includes the exact photo fields used by the hydrated page', async () => {
  const middleware = await read('../functions/_middleware.ts')
  const page = await read('../src/pages/AboutPage.tsx')

  for (const field of ['slug', 'imageUrl', 'imageAlt', 'imageAltEn', 'imageAltRu']) {
    assert.ok(middleware.includes(field), 'SSR seed should include ' + field)
  }
  assert.match(page, /rolePhotos\?\.find\(\(item\) => item\.slug\?\.toLowerCase\(\) === 'florial-nesebr'\)/)
  assert.match(page, /rolePhotos\?\.find\(\(item\) => item\.slug\?\.toLowerCase\(\) === 'florial-ravda'\)/)
})

test('About SSR batches production photos and equipment category into one CDN query', async () => {
  const middleware = await read('../functions/_middleware.ts')
  const start = middleware.indexOf('async function fetchAboutHtml')
  const end = middleware.indexOf('async function fetchCategoryProducts', start)
  const source = middleware.slice(start, end)
  assert.match(source, /const productionAboutQuery = `\{/)
  assert.match(source, /"photos": \$\{photoQuery\}/)
  assert.match(source, /"equipmentCategories": \$\{equipmentCategoryQuery\}/)
  assert.match(source, /about-combined-v2/)
  assert.equal((source.match(/querySanityData</g) || []).length, 2)
})

test('About page falls back to a browser read when the SSR photo seed is incomplete', async () => {
  const app = await read('../src/App.tsx')
  const page = await read('../src/pages/AboutPage.tsx')
  assert.match(app, /landshaften-arhitekt[\s\S]*florial-ravda/)
  assert.match(page, /hasCompleteInitialPhotos/)
  assert.match(page, /if \(hasCompleteInitialPhotos\) return/)
})
