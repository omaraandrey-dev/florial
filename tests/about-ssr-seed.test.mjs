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
  assert.match(page, /if \(initialRolePhotos\?\.length\) return/)
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
