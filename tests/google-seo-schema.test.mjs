import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildProductOffer, getServerProductPrice } from '../functions/_lib/productJsonLd.mjs'

test('plant server price and Offer use the default first sale variant instead of a stale root price', () => {
  const product = {
    _dataset: 'plants',
    priceEUR: 3000,
    saleVariants: [{ priceEUR: 25 }, { priceEUR: 35 }],
  }
  assert.equal(getServerProductPrice(product), 25)
  assert.deepEqual(buildProductOffer(product, 'https://florial-bg.com/product/citrus-japonica-kumquat'), {
    '@type': 'Offer',
    price: '25.00',
    priceCurrency: 'EUR',
    url: 'https://florial-bg.com/product/citrus-japonica-kumquat',
    itemCondition: 'https://schema.org/NewCondition',
  })
})

test('plant with one unique sale price emits a regular Offer', () => {
  const product = {
    _dataset: 'plants',
    priceEUR: 3000,
    saleVariants: [{ priceEUR: 13 }],
  }
  assert.equal(getServerProductPrice(product), 13)
  assert.equal(buildProductOffer(product, 'https://florial-bg.com/product/fuchsia').price, '13.00')
  assert.equal(buildProductOffer(product, 'https://florial-bg.com/product/fuchsia')['@type'], 'Offer')
})

test('plant with multiple variants does not collapse them into AggregateOffer', () => {
  const offer = buildProductOffer({
    _dataset: 'plants',
    saleVariants: [{ priceEUR: 25 }, { priceEUR: 25 }],
  }, 'https://florial-bg.com/product/plant')
  assert.deepEqual(offer, {
    '@type': 'Offer',
    price: '25.00',
    priceCurrency: 'EUR',
    url: 'https://florial-bg.com/product/plant',
    itemCondition: 'https://schema.org/NewCondition',
  })
})

test('plant without a priced default first variant does not advertise a later variant price', () => {
  const product = {
    _dataset: 'plants',
    priceEUR: 3000,
    saleVariants: [{ name: 'Size pending' }, { priceEUR: 13 }],
  }
  assert.equal(getServerProductPrice(product), null)
  assert.equal(buildProductOffer(product, 'https://florial-bg.com/product/plant'), null)
})

test('irrigation product continues to use its published root price and stock status', () => {
  const product = { _dataset: 'production', priceEUR: 141.27, stockStatus: 'inStock' }
  assert.equal(getServerProductPrice(product), 141.27)
  assert.deepEqual(buildProductOffer(product, 'https://florial-bg.com/product/valve'), {
    '@type': 'Offer',
    price: '141.27',
    priceCurrency: 'EUR',
    url: 'https://florial-bg.com/product/valve',
    itemCondition: 'https://schema.org/NewCondition',
    availability: 'https://schema.org/InStock',
  })
})

test('server middleware emits Product, Service, BlogPosting and CollectionPage schemas', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /makeProductJsonLd\(doc, name, metaDescription, canonicalUrl\)/)
  assert.match(middleware, /buildServiceDetailStructuredData\(doc as ServiceDetailDocument, language\)/)
  assert.match(middleware, /makeServiceJsonLd\(\s*\{ serviceCategory: 'delivery' \}/)
  assert.match(middleware, /makeBlogPostingJsonLd\(doc, name, metaDescription, canonicalUrl, language\)/)
  assert.match(middleware, /makeCategoryCollectionJsonLd\(name, metaDescription, canonicalUrl, categoryStructuredProducts, language\)/)
  assert.match(middleware, /buildEquipmentCategoryEntries\(categoryProducts \|\| \[\], language, equipmentCategoryOptions\)/)
  assert.match(middleware, /seo\?\.noIndex === true \|\| categorySeo\?\.noIndex === true/)
  assert.match(middleware, /fetchPlantCategoryProducts\(doc\._id(?:,\s*\(categories\))?/)
  assert.match(middleware, /fetchCategoryProducts\('production', doc\._id, \(categories\) => \{ equipmentCategoryTree = categories \}\)/)
  assert.match(middleware, /"categoryId": category->_id/)
  assert.match(middleware, /"categoryIds": categories\[\]._ref/)
  assert.match(middleware, /type === 'product' \|\| type === 'service'/)
})

test('client-side SEO preserves noIndex and restores page structured data after hydration', async () => {
  const [product, service, blog, category, blogIndex, servicesIndex, terms, middleware] = await Promise.all([
    readFile(new URL('../src/pages/ProductPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/ServicePage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/BlogPostPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/CategoryPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/BlogPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/ServicesListPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/TermsPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8'),
  ])
  assert.match(product, /noIndex: localizedSeoSource\?\.noIndex === true/)
  assert.match(service, /noIndex: localizedSeo\?\.noIndex === true/)
  assert.match(service, /setStructuredData\('service'/)
  assert.match(blog, /setStructuredData\('blog-posting'/)
  assert.match(category, /setStructuredData\('collection-page'/)
  assert.match(blogIndex, /setStructuredData\('collection-page'/)
  assert.match(servicesIndex, /setStructuredData\('collection-page'/)
  assert.match(terms, /noIndex: language !== 'bg'/)
  assert.match(middleware, /noIndex: language !== 'bg'/)
})


test('plant Offer reports availability only for the default variant and only for known statuses', () => {
  const inStock = buildProductOffer({
    _dataset: 'plants',
    saleVariants: [
      { priceEUR: 25, stockStatus: 'inStock' },
      { priceEUR: 35, stockStatus: 'outOfStock' },
    ],
  }, 'https://florial-bg.com/product/plant')
  assert.equal(inStock.availability, 'https://schema.org/InStock')

  const outOfStock = buildProductOffer({
    _dataset: 'plants',
    saleVariants: [{ priceEUR: 25, stockStatus: 'outOfStock' }],
  }, 'https://florial-bg.com/product/plant')
  assert.equal(outOfStock.availability, 'https://schema.org/OutOfStock')

  const onRequest = buildProductOffer({
    _dataset: 'plants',
    saleVariants: [{ priceEUR: 25, stockStatus: 'onRequest' }],
  }, 'https://florial-bg.com/product/plant')
  assert.equal('availability' in onRequest, false)
})

test('onRequest is not converted to PreOrder for equipment or plant variants', () => {
  const equipment = buildProductOffer({
    _dataset: 'production',
    priceEUR: 141.27,
    stockStatus: 'onRequest',
  }, 'https://florial-bg.com/product/valve')
  assert.equal(equipment['@type'], 'Offer')
  assert.equal('availability' in equipment, false)

  const plant = buildProductOffer({
    _dataset: 'plants',
    saleVariants: [{ priceEUR: 25, stockStatus: 'onRequest' }],
  }, 'https://florial-bg.com/product/plant')
  assert.equal('availability' in plant, false)
  assert.notEqual(plant.availability, 'https://schema.org/PreOrder')
})

test('client ProductPage uses the same shared Offer builder and brand as server middleware', async () => {
  const [product, productDetails, middleware] = await Promise.all([
    readFile(new URL('../src/pages/ProductPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/routeData/productDetails.ts', import.meta.url), 'utf8'),
    readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8'),
  ])
  assert.match(product, /import \{ buildProductOffer \} from '..\/lib\/productJsonLd\.mjs'/)
  assert.match(product, /const offer = buildProductOffer\(/)
  assert.ok(product.includes("...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {})"))
  assert.match(productDetails, /"brand": brand->name, priceEUR, oldPriceEUR, vatIncluded/)
  assert.match(middleware, /doc\.brandName \? \{ brand: \{ '@type': 'Brand', name: doc\.brandName \} \} : \{\}/)
  assert.doesNotMatch(product, /schema\.org\/PreOrder/)
  assert.match(middleware, /import \{ buildProductOffer, getServerProductPrice \} from '.\/_lib\/productJsonLd\.mjs'/)
})

test('Organization JSON-LD links to Florial published Bulgarian terms for its return policy', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /hasMerchantReturnPolicy:\s*\{\s*'@type': 'MerchantReturnPolicy',\s*merchantReturnLink: SITE_URL \+ '\/terms'/)
  assert.match(middleware, /noIndex: language !== 'bg'/)
})
