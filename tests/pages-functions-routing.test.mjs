import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Pages Functions route manifest excludes static assets but preserves dynamic page and API routes', async () => {
  const manifest = JSON.parse(await read('../public/_routes.json'))

  assert.equal(manifest.version, 1)
  assert.deepEqual(manifest.include, ['/*'])
  assert.ok(Array.isArray(manifest.exclude))
  assert.ok(manifest.exclude.length + manifest.include.length <= 100)
  assert.ok([...manifest.include, ...manifest.exclude].every((rule) => typeof rule === 'string' && rule.length <= 100))

  for (const pattern of [
    '/assets/*',
    '/manager/icons/*',
    '/*.js',
    '/*.mjs',
    '/*.css',
    '/*.map',
    '/*.png',
    '/*.jpg',
    '/*.jpeg',
    '/*.webp',
    '/*.avif',
    '/*.gif',
    '/*.svg',
    '/*.ico',
    '/*.woff2',
    '/*.pdf',
    '/*.json',
    '/*.txt',
    '/*.webmanifest',
    '/*.wasm',
    '/google*.html',
  ]) {
    assert.ok(manifest.exclude.includes(pattern), 'missing static exclusion: ' + pattern)
  }

  // These routes must continue through Pages Functions: SSR pages, API handlers,
  // sitemap and the dynamic services RSS feed. Exclusions must not shadow them.
  for (const pattern of ['/*.html', '/*.xml', '/api/*', '/manager/*']) {
    assert.ok(!manifest.exclude.includes(pattern), 'dynamic route must remain eligible: ' + pattern)
  }

  const middleware = await read('../functions/_middleware.ts')
  const sitemap = await read('../functions/sitemap.xml.ts')
  const feed = await read('../functions/feeds/services-bg.xml.ts')
  assert.ok(middleware.includes("path.startsWith('/api/')"))
  assert.ok(middleware.includes("path === '/sitemap.xml'"))
  assert.ok(sitemap.includes('export async function onRequestGet'))
  assert.ok(feed.includes('export async function onRequestGet'))
})
