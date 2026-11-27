import assert from 'node:assert/strict'

const BASE_URL = (process.env.BASE_URL || 'https://develop.florial.pages.dev').replace(/\/+$/, '')
const PROJECT = 'bxvcy0qs'
const API_VERSION = '2024-01-01'
const SITE_URL = 'https://florial-bg.com'
const LOCALES = ['bg', 'ru', 'en']

async function sanityFetch(dataset, query) {
  const url = new URL('https://' + PROJECT + '.apicdn.sanity.io/v' + API_VERSION + '/data/query/' + dataset)
  url.searchParams.set('query', query)
  url.searchParams.set('perspective', 'published')
  url.searchParams.set('tag', 'florial.ci.smoke.plants')
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, 'Sanity ' + dataset + ' query must return HTTP 200')
  const body = await response.json()
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'result'), 'Sanity response must include result')
  return body.result
}

async function fetchPage(path, label, expectedStatus = 200) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const url = new URL(path, BASE_URL)
      const response = await fetch(url, { headers: { accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(25000) })
      const html = await response.text()
      if (response.status === expectedStatus && /text\/html/i.test(response.headers.get('content-type') || '')) return html
      lastError = new Error(label + ': expected HTTP ' + expectedStatus + ', received ' + response.status)
    } catch (error) { lastError = error }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }
  throw lastError || new Error(label + ': no HTML response')
}

function extractJsonLd(html, id, label) {
  const match = html.match(new RegExp('<script\\b(?=[^>]*data-florial-jsonld="' + id + '")[^>]*>([\\s\\S]*?)<\\/script>', 'i'))
  assert.ok(match, label + ': JSON-LD ' + id + ' missing')
  return JSON.parse(match[1])
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function productName(product, language) {
  return product.translations?.[language]?.name || product.translations?.bg?.name || product.name || product.slug
}

function productH1(product, language) {
  return language === 'bg' ? product.seo?.h1 || productName(product, language) : product.translations?.[language]?.seo?.h1 || productName(product, language)
}

function categoryName(category, language) {
  return category.translations?.[language]?.name || category.name || category.slug
}

function categoryH1(category, language) {
  return category.translations?.[language]?.seo?.h1 || (language === 'bg' ? category.seo?.h1 : undefined) || categoryName(category, language)
}

async function mapLimit(items, limit, worker) {
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      await worker(items[index], index)
    }
  }))
}

const productQuery = [
  '*[_type == "product" && productType in ["plant","tree","shrub","flower","perennial","indoor","citrus","palm","conifer","fruit","succulent","climber","ornamentalGrass","groundcover","bulb","herb","aquatic","other"] && isActive != false && defined(slug.current)] | order(slug.current asc) {',
  '_id, name, "slug": slug.current, sku, scientificName, seo { h1, noIndex },',
  'translations { bg { name, shortDescription, seo { h1, noIndex } }, ru { name, shortDescription, seo { h1, noIndex } }, en { name, shortDescription, seo { h1, noIndex } } },',
  '"imageUrl": mainImage.asset->url, "variantCount": count(saleVariants), "descriptionCount": count(description), "careGuideCount": count(careGuide),',
  'saleVariants[] { name, nameEn, nameRu, priceEUR, oldPriceEUR, stockStatus, saleHeightCm, containerVolumeL } }',
].join(' ')
const categoryQuery = [
  '*[_type == "category" && defined(slug.current)] | order(sortOrder asc) {',
  '_id, name, "slug": slug.current, seo { h1, noIndex },',
  'translations { bg { name, seo { h1, noIndex } }, ru { name, seo { h1, noIndex } }, en { name, seo { h1, noIndex } } } }',
].join(' ')

const products = await sanityFetch('plants', productQuery)
const categories = await sanityFetch('plants', categoryQuery)
assert.ok(Array.isArray(products) && products.length === 60, 'Expected all 60 active published plants; got ' + (products?.length ?? 'non-array'))
assert.ok(Array.isArray(categories) && categories.length === 17, 'Expected all 17 published plant categories; got ' + (categories?.length ?? 'non-array'))
assert.equal(new Set(products.map((item) => item.slug)).size, products.length, 'Plant product slugs must be unique')
assert.equal(new Set(categories.map((item) => item.slug)).size, categories.length, 'Plant category slugs must be unique')
console.log('Discovered 60 active published plants and 17 published categories')

for (const language of LOCALES) {
  await mapLimit(products, 8, async (product) => {
    const path = '/product/' + encodeURIComponent(product.slug) + (language === 'bg' ? '?ssrSmoke=plant-v1' : '?lang=' + language + '&ssrSmoke=plant-v1')
    const label = language + ' /product/' + product.slug
    const html = await fetchPage(path, label)
    assert.match(html, new RegExp('<html\\b[^>]*lang="' + language + '"', 'i'), label + ': html lang mismatch')
    assert.match(html, /data-florial-ssr="plant-product"/i, label + ': plant SSR marker missing')
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)
    assert.equal(canonical?.[1], SITE_URL + '/product/' + encodeURIComponent(product.slug) + (language === 'bg' ? '' : '?lang=' + language), label + ': canonical mismatch')
    const main = html.match(/<main\b[^>]*data-florial-ssr="plant-product"[^>]*>([\s\S]*?)<\/main>/i)
    assert.ok(main, label + ': plant main missing')
    const h1 = main[1].match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    assert.ok(h1 && h1[1].includes(escapeHtml(productH1(product, language))), label + ': localized H1 mismatch')
    if (product.scientificName) assert.ok(main[1].includes(escapeHtml(product.scientificName)), label + ': botanical name missing')
    if (product.imageUrl) {
      assert.ok(main[1].includes('cdn.sanity.io'), label + ': plant image missing')
      assert.match(main[1], /srcset=/, label + ': responsive image missing')
    }
    if (product.variantCount > 0) assert.match(main[1], /Available sizes|Доступные размеры|Предлагани размери/i, label + ': sale variants missing')
    if (product.descriptionCount > 0) assert.match(main[1], /Description|Описание/i, label + ': description missing')
    if (product.careGuideCount > 0) assert.match(main[1], /Growing and care|Уход и выращивание|Отглеждане и грижи/i, label + ': care guide missing')
    const data = extractJsonLd(html, 'product', label)
    assert.equal(data['@type'], 'Product', label + ': Product JSON-LD mismatch')
    assert.equal(data.name, productName(product, language), label + ': Product name mismatch')
    assert.equal(data.alternateName || '', product.scientificName || '', label + ': botanical alternateName mismatch')
    const prices = (product.saleVariants || []).map((item) => item.priceEUR).filter((price) => typeof price === 'number' && price > 0)
    if (prices.length) {
      assert.equal(data.offers?.lowPrice, Math.min(...prices).toFixed(2), label + ': AggregateOffer low price mismatch')
      assert.equal(data.offers?.highPrice, Math.max(...prices).toFixed(2), label + ': AggregateOffer high price mismatch')
      assert.equal(data.offers?.offerCount, prices.length, label + ': AggregateOffer count mismatch')
      assert.equal(data.offers?.priceCurrency, 'EUR', label + ': AggregateOffer currency mismatch')
    } else assert.equal(data.offers, undefined, label + ': price must not be fabricated')
    const breadcrumbs = extractJsonLd(html, 'breadcrumbs', label)
    assert.equal(breadcrumbs['@type'], 'BreadcrumbList', label + ': BreadcrumbList mismatch')
    assert.equal(breadcrumbs.itemListElement.at(-1).item, SITE_URL + '/product/' + encodeURIComponent(product.slug) + (language === 'bg' ? '' : '?lang=' + language), label + ': product breadcrumb URL mismatch')
  })
  console.log('PASS ' + language + ': 60 plant detail routes')

  await mapLimit(categories, 6, async (category) => {
    const path = '/category/' + encodeURIComponent(category.slug) + (language === 'bg' ? '?ssrSmoke=plant-v1' : '?lang=' + language + '&ssrSmoke=plant-v1')
    const label = language + ' /category/' + category.slug
    const html = await fetchPage(path, label)
    assert.match(html, new RegExp('<html\\b[^>]*lang="' + language + '"', 'i'), label + ': html lang mismatch')
    assert.match(html, /data-florial-server-catalogue="plants"/i, label + ': category listing missing')
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)
    assert.equal(canonical?.[1], SITE_URL + '/category/' + encodeURIComponent(category.slug) + (language === 'bg' ? '' : '?lang=' + language), label + ': category canonical mismatch')
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    assert.ok(h1 && h1[1].includes(escapeHtml(categoryH1(category, language))), label + ': category H1 mismatch')
    const collection = extractJsonLd(html, 'collection-page', label)
    assert.equal(collection['@type'], 'CollectionPage', label + ': CollectionPage mismatch')
    if (category.slug === 'rastenia') {
      assert.match(html, /data-florial-server-category-navigation="plants"/, label + ': root navigation missing')
      assert.match(html, /Showing products: 20|Показани продукти: 20|Показано товаров: 20/, label + ': root first page must render 20 offers')
    }
  })
  console.log('PASS ' + language + ': 17 plant category routes')
}

const missing = await fetchPage('/product/florial-plant-ssr-missing-check-404?ssrSmoke=plant-v1', 'missing plant product', 404)
assert.match(missing, /noindex/i, 'missing/unpublished plant product must be noindex')
console.log('PASS missing plant product returns 404 noindex')
console.log('PASS complete plant SSR smoke: 180 product routes + 51 category routes')
