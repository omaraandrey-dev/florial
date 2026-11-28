import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  }))
  return nested.flat()
}

test('every public direct Sanity client callsite is explicitly inventoried and tagged', async () => {
  const root = new URL('../src/', import.meta.url)
  const files = (await walk(root.pathname)).filter((path) => /\.(ts|tsx|js|mjs)$/.test(path))
  const actual = []
  for (const path of files) {
    const source = await readFile(path, 'utf8')
    if (/\b(?:sanityLiveClient|plantsClient)\b/.test(source) && /\.fetch(?:<[^>]+>)?\s*\(/.test(source)) {
      actual.push(relative(root.pathname, path).replaceAll('\\\\', '/'))
    }
  }

  const expected = [
    'App.tsx',
    'lib/routeData/productDetails.ts',
    'lib/routeData/search.ts',
    'manager/plantCategories.ts',
    'pages/IrrigationAssistantPage.tsx',
    'pages/IrrigationSupportPage.tsx',
  ].sort()
  assert.deepEqual(actual.sort(), expected)

  const tagsByFile = {
    'App.tsx': ['browser.catalog.equipment', 'browser.catalog.plants'],
    'lib/routeData/productDetails.ts': ['browser.product.detail.plants', 'browser.product.detail.equipment', 'browser.product.recommended-irrigation'],
    'lib/routeData/search.ts': ['browser.search.equipment', 'browser.search.plants'],
    'manager/plantCategories.ts': ['manager.plant-categories'],
    'pages/IrrigationAssistantPage.tsx': ['browser.irrigation-assistant.catalog'],
    'pages/IrrigationSupportPage.tsx': ['browser.delivery.zones'],
  }
  for (const [path, tags] of Object.entries(tagsByFile)) {
    const source = await read('../src/' + path)
    for (const tag of tags) assert.ok(source.includes(tag), path + ' is missing request tag ' + tag)
  }
})

test('all Sanity SDK clients apply the Florial request-tag prefix', async () => {
  const source = await read('../src/lib/sanity.ts')
  assert.equal((source.match(/createClient\(/g) || []).length, 4)
  assert.equal((source.match(/requestTagPrefix: 'florial'/g) || []).length, 4)
})

test('server-side direct Sanity API requests carry endpoint-specific tags', async () => {
  const expectations = [
    ['../functions/api/orders.ts', 'florial.checkout.order-validation'],
    ['../functions/api/manager/plant-direct-lib.ts', 'florial.manager.plants.read', 'florial.manager.plants.write'],
    ['../functions/api/manager/order-products.ts', 'florial.manager.order-products'],
    ['../functions/api/manager/product-seo.ts', 'florial.manager.product-seo.read', 'florial.manager.product-seo.write'],
    ['../functions/api/manager/category-seo.ts', 'florial.manager.category-seo.read', 'florial.manager.category-seo.write'],
    ['../functions/api/manager/image-library.ts', 'florial.manager.image-library'],
    ['../functions/api/manager/upload-image.ts', 'florial.manager.image-upload'],
  ]
  for (const [path, ...tags] of expectations) {
    const source = await read(path)
    for (const tag of tags) assert.ok(source.includes(tag), path + ' is missing request tag ' + tag)
  }
})


test('published-data CI smoke scripts use the API CDN instead of consuming Live API quota', async () => {
  const expectations = [
    ['../scripts/smoke-plant-ssr.mjs', 'florial.ci.smoke.plants'],
    ['../scripts/smoke-equipment-product-ssr.mjs', 'florial.ci.smoke.equipment-product'],
    ['../scripts/smoke-equipment-catalog-ssr.mjs', 'florial.ci.smoke.equipment-catalog'],
  ]
  for (const [path, tag] of expectations) {
    const source = await read(path)
    assert.ok(source.includes('.apicdn.sanity.io/'), path + ' must use the API CDN')
    assert.ok(!source.includes('.api.sanity.io/'), path + ' must not call the Live API')
    assert.ok(source.includes(tag), path + ' is missing its CI request tag')
  }
})


test('read-only description migration dry-run uses the CDN and safely reports an exhausted quota', async () => {
  const source = await read('../scripts/migrate-descriptions-to-portable-text.mjs')
  assert.match(source, /useCdn: !apply/)
  assert.match(source, /florial\.ci\.description-migration\.dry-run/)
  assert.match(source, /error\?\.statusCode === 402/)
  assert.match(source, /error\?\.response\?\.body\?\.error === 'plan_limit_reached'/)
  assert.match(source, /DRY-RUN пропущен/)
})


test('public service-lead form configuration is read from the published API CDN', async () => {
  const source = await read('../functions/api/service-leads.ts')
  assert.ok(source.includes('.apicdn.sanity.io/'))
  assert.ok(!source.includes('.api.sanity.io/'))
  assert.ok(source.includes("url.searchParams.set('perspective', 'published')"))
  assert.ok(source.includes('florial.service-leads.config'))
})


test('public SSR, sitemap and services feed API CDN requests carry request-family tags', async () => {
  const middleware = await read('../functions/_middleware.ts')
  assert.match(middleware, /function getSanityRequestTag\(/)
  assert.match(middleware, /return 'florial\.ssr\.' \+ family \+ '\.' \+ dataset/)
  assert.match(middleware, /url\.searchParams\.set\('tag', getSanityRequestTag\(dataset, cachePath\)\)/)

  const sitemap = await read('../functions/sitemap.xml.ts')
  assert.match(sitemap, /url\.searchParams\.set\('tag', 'florial\.ssr\.sitemap\.' \+ dataset\)/)

  const feed = await read('../functions/feeds/services-bg.xml.ts')
  assert.match(feed, /sanityUrl\.searchParams\.set\('tag', 'florial\.ssr\.services-feed'\)/)
})

test('authenticated blog migration scripts identify their Live API requests', async () => {
  const importer = await read('../scripts/blog-migration/import-blog-posts.mjs')
  assert.match(importer, /requestTagPrefix: 'florial\.blog-migration\.import'/)

  const preparation = await read('../scripts/blog-migration/prepare-from-source.mjs')
  assert.match(preparation, /requestTagPrefix: 'florial\.blog-migration\.prepare'/)
})
