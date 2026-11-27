import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('sitemap reads published documents through Sanity API CDN and edge-caches the generated XML', async () => {
  const source = await read('../functions/sitemap.xml.ts')
  assert.match(source, /\.apicdn\.sanity\.io/)
  assert.match(source, /searchParams\.set\('perspective', 'published'\)/)
  assert.match(source, /edgeCache\.match\(cacheKey\)/)
  assert.match(source, /edgeCache\.put\(cacheKey, response\.clone\(\)\)/)
  assert.match(source, /s-maxage=300, stale-while-revalidate=600/)
  assert.doesNotMatch(source, /\.api\.sanity\.io/)
})

test('services RSS reads published documents through Sanity API CDN and edge-caches the generated XML', async () => {
  const source = await read('../functions/feeds/services-bg.xml.ts')
  assert.match(source, /\.apicdn\.sanity\.io/)
  assert.match(source, /searchParams\.set\('perspective', 'published'\)/)
  assert.match(source, /edgeCache\.match\(cacheKey\)/)
  assert.match(source, /edgeCache\.put\(cacheKey, response\.clone\(\)\)/)
  assert.match(source, /s-maxage=300, stale-while-revalidate=600/)
  assert.doesNotMatch(source, /\.api\.sanity\.io/)
})
