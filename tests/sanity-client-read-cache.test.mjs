import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('public product search reuses one recent result set and coalesces concurrent loads', async () => {
  const source = await read('../src/lib/routeData/search.ts')
  assert.match(source, /const SEARCH_PRODUCTS_CACHE_TTL_MS = 30_000/)
  assert.match(source, /searchProductsCache && searchProductsCache\.expiresAt > Date\.now\(\)/)
  assert.match(source, /const promise = fetchSearchProductsUncached\(\)/)
  assert.match(source, /sanityClient\.fetch\(equipmentSearchQuery/)
  assert.match(source, /publicPlantsClient\.fetch\(plantSearchQuery/)
  assert.match(source, /searchProductsCache = null/)
})

test('product route identity and details are reused for repeated navigation within the short cache window', async () => {
  const source = await read('../src/lib/routeData/productDetails.ts')
  const app = await read('../src/App.tsx')
  assert.match(source, /const PRODUCT_ROUTE_CACHE_TTL_MS = 30_000/)
  assert.match(source, /const cachedIdentity = readProductIdentity\(slug\)/)
  assert.match(source, /if \(cachedIdentity\) \{/)
  assert.match(source, /productIdentityCache\.set\(slug, \{ dataset, id: foundProduct\._id/)
  assert.match(source, /const cached = productDetailsCache\.get\(cacheKey\)/)
  assert.match(source, /productDetailsCache\.set\(cacheKey/)
  assert.match(app, /initialProductRouteSeed\.id,[\s\S]{0,80}activeProductSlug/)
})
