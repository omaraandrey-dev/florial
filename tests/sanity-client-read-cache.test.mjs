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
  assert.match(source, /function writeProductIdentity\(/)
  assert.match(source, /writeProductIdentity\(slug, identity\.dataset, identity\.id\)/)
  assert.match(source, /function writeProductDetails\(/)
  assert.match(source, /writeProductDetails\(cacheKey, enrichedDetails\)/)
  assert.match(source, /productIdentityCache\.size > 100/)
  assert.match(source, /productDetailsCache\.size > 100/)
  assert.match(app, /initialProductRouteSeed\.id,[\s\S]{0,80}activeProductSlug/)
})

test('concurrent product slug resolution shares the two-dataset lookup', async () => {
  const source = await read('../src/lib/routeData/productDetails.ts')
  for (const fragment of [
    'const productIdentityInFlight = new Map<string, Promise<{ dataset: \'production\' | \'plants\'; id: string } | null>>()',
    'let pending = productIdentityInFlight.get(slug)',
    'pending = resolveProductIdentityBySlug(slug)',
    'productIdentityInFlight.set(slug, pending)',
    'async function resolveProductIdentityBySlug(',
    'productIdentityInFlight.delete(slug)',
  ]) assert.ok(source.includes(fragment), 'missing slug lookup coalescing fragment: ' + fragment)
})

test('concurrent product detail loads share one in-flight request per dataset and document ID', async () => {
  const source = await read('../src/lib/routeData/productDetails.ts')
  for (const fragment of [
    'const productDetailsInFlight = new Map<string, Promise<Product | null>>()',
    'let pending = productDetailsInFlight.get(cacheKey)',
    'pending = fetchProductDetailsUncached(foundProduct, () => false)',
    'productDetailsInFlight.set(cacheKey, pending)',
    'productDetailsInFlight.delete(cacheKey)',
    'if (productDetailsInFlight.get(cacheKey) === pending)',
  ]) assert.ok(source.includes(fragment), 'missing in-flight deduplication fragment: ' + fragment)
})

test('plant detail related documents and recommended irrigation product use one combined query', async () => {
  const source = await read('../src/lib/routeData/productDetails.ts')
  assert.match(source, /const plantRelatedAndIrrigationQuery = `\{/)
  assert.match(source, /"relatedDocuments": \*\[/)
  assert.match(source, /"recommendedProduct": \*\[_type == "product"/)
  assert.match(source, /browser\.product\.related-and-recommended/)
  assert.doesNotMatch(source, /browser\.product\.related-content|browser\.product\.recommended-irrigation/)
})

test('irrigation assistant caches catalogue reads by stable BOM SKU set', async () => {
  const source = await read('../src/pages/IrrigationAssistantPage.tsx')
  assert.match(source, /IRRIGATION_CATALOG_CACHE_TTL_MS = 30_000/)
  assert.match(source, /const cacheKey = normalizedSkus\.join\('\|'\)/)
  assert.match(source, /const baseBomSkuKey = billOfMaterials\?\.valid/)
  assert.match(source, /\}, \[baseBomSkuKey\]\)/)
  assert.match(source, /fetchIrrigationCatalogProducts\(skus\)/)
})
