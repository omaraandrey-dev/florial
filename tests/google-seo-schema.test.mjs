import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildProductOffer, getServerProductPrice } from '../functions/_lib/productJsonLd.mjs'

test('plant server price uses the first valid sale variant instead of a stale root price', () => {
  const product = {
    _dataset: 'plants',
    priceEUR: 3000,
    saleVariants: [{ priceEUR: 25 }, { priceEUR: 35 }],
  }
  assert.equal(getServerProductPrice(product), 25)
  assert.deepEqual(buildProductOffer(product, 'https://florial-bg.com/product/citrus-japonica-kumquat'), {
    '@type': 'AggregateOffer',
    lowPrice: '25.00',
    highPrice: '35.00',
    offerCount: 2,
    priceCurrency: 'EUR',
    url: 'https://florial-bg.com/product/citrus-japonica-kumquat',
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

test('multiple plant variants with the same price keep the true offer count', () => {
  const offer = buildProductOffer({
    _dataset: 'plants',
    saleVariants: [{ priceEUR: 25 }, { priceEUR: 25 }],
  }, 'https://florial-bg.com/product/plant')
  assert.deepEqual(offer, {
    '@type': 'AggregateOffer',
    lowPrice: '25.00',
    highPrice: '25.00',
    offerCount: 2,
    priceCurrency: 'EUR',
    url: 'https://florial-bg.com/product/plant',
  })
})

test('plant without a priced sale variant does not publish the unrelated root price', () => {
  const product = { _dataset: 'plants', priceEUR: 3000, saleVariants: [{ name: 'Size pending' }] }
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
  assert.match(middleware, /makeServiceJsonLd\(doc, name, metaDescription, canonicalUrl\)/)
  assert.match(middleware, /makeBlogPostingJsonLd\(doc, name, metaDescription, canonicalUrl, language\)/)
  assert.match(middleware, /makeCategoryCollectionJsonLd\(name, metaDescription, canonicalUrl, categoryProducts \|\| \[\], language\)/)
  assert.match(middleware, /seo\?\.noIndex === true \|\| categorySeo\?\.noIndex === true/)
  assert.match(middleware, /fetchCategoryProducts\(doc\._dataset === 'plants' \? 'plants' : 'production', doc\._id\)/)
})

test('client-side SEO preserves noIndex and restores page structured data after hydration', async () => {
  const [product, service, blog, category, blogIndex, servicesIndex] = await Promise.all([
    readFile(new URL('../src/pages/ProductPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/ServicePage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/BlogPostPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/CategoryPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/BlogPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/ServicesListPage.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(product, /noIndex: localizedSeoSource\?\.noIndex === true/)
  assert.match(service, /noIndex: localizedSeo\?\.noIndex === true/)
  assert.match(service, /setStructuredData\('service'/)
  assert.match(blog, /setStructuredData\('blog-posting'/)
  assert.match(category, /setStructuredData\('collection-page'/)
  assert.match(blogIndex, /setStructuredData\('collection-page'/)
  assert.match(servicesIndex, /setStructuredData\('collection-page'/)
})
