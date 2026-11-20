import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const manifest = JSON.parse(read('public/manager/manifest.webmanifest'))
const worker = read('public/manager/sw.js')
const managerApp = read('src/manager/ManagerApp.tsx')
const middleware = read('functions/_middleware.ts')
const managerApiLib = read('functions/api/manager/_lib.ts')
const gemini = read('functions/api/manager/plants/gemini-test.ts')
const orderDocuments = read('functions/api/manager/order-documents.ts')

test('Manager PWA is scoped to its own online-only standalone application', () => {
  assert.equal(manifest.start_url, '/manager/')
  assert.equal(manifest.scope, '/manager/')
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.lang, 'bg')
  assert.deepEqual(manifest.icons.filter((icon) => icon.type === 'image/png').map((icon) => icon.sizes).sort(), ['192x192', '512x512'])
  assert.ok(manifest.icons.some((icon) => icon.type === 'image/svg+xml' && icon.sizes === 'any' && icon.purpose === 'maskable'))
  assert.ok(manifest.icons.every((icon) => icon.src.startsWith('/manager/')))
})

test('Manager registers the service worker only from the Manager application', () => {
  assert.match(managerApp, /navigator\.serviceWorker\.register\('\/manager\/sw\.js', \{ scope: '\/manager\/' \}\)/)
  assert.match(middleware, /href="\/manager\/manifest\.webmanifest"/)
  assert.match(middleware, /rel="apple-touch-icon"/)
  assert.match(middleware, /noindex, nofollow, noarchive/)
})

test('service worker is network-only and never stores Manager data or an offline shell', () => {
  assert.match(worker, /request\.mode !== 'navigate'/)
  assert.match(worker, /url\.pathname\.startsWith\('\/manager\/'\)/)
  assert.match(worker, /event\.respondWith\(fetch\(request\)\)/)
  assert.doesNotMatch(worker, /caches\.|CacheStorage|cache\.put|cache\.add|cache\.match/i)
  assert.doesNotMatch(worker, /\/api\/manager\//)
})

test('all JSON Manager API responses and binary order documents are non-cacheable', () => {
  assert.match(managerApiLib, /'cache-control': 'no-store'/i)
  assert.match(gemini, /'Cache-Control': 'no-store, no-transform'/)
  assert.match(orderDocuments, /'Cache-Control':'no-store'/)
})

test('Manager PWA icons use the canonical Florial droplet/leaf artwork', () => {
  const icon192 = readFileSync(new URL('../public/manager/icons/icon-192.png', import.meta.url))
  const icon512 = readFileSync(new URL('../public/manager/icons/icon-512.png', import.meta.url))
  assert.equal(icon192.readUInt32BE(16), 192)
  assert.equal(icon192.readUInt32BE(20), 192)
  assert.equal(icon512.readUInt32BE(16), 512)
  assert.equal(icon512.readUInt32BE(20), 512)
  assert.ok(read('public/manager/icons/icon-192.svg').includes('data:image/png;base64,'))
  assert.ok(read('public/manager/icons/icon-512.svg').includes('data:image/png;base64,'))
})
