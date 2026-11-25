import assert from 'node:assert/strict'

const BASE_URL = (process.env.BASE_URL || 'https://feat-ssr-equipment-product-pages-v1.florial.pages.dev').replace(/\/+$/, '')
const SANITY_PROJECT_ID = 'bxvcy0qs'
const SITE_URL = 'https://florial-bg.com'
const SANITY_DATASET = 'production'
const SANITY_API_VERSION = '2024-01-01'
const LOCALES = ['bg', 'ru', 'en']

function groqUrl(query) {
  const url = new URL('https://' + SANITY_PROJECT_ID + '.api.sanity.io/v' + SANITY_API_VERSION + '/data/query/' + SANITY_DATASET)
  url.searchParams.set('query', query)
  url.searchParams.set('perspective', 'published')
  return url
}

async function sanityFetch(query) {
  const response = await fetch(groqUrl(query), {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  assert.equal(response.status, 200, 'Sanity product inventory query must return HTTP 200')
  const body = await response.json()
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'result'), 'Sanity response must include result')
  return body.result
}

async function fetchPage(path, label, expectedStatus = 200) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const url = new URL(path, BASE_URL)
      const response = await fetch(url, {
        headers: { accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      })
      const html = await response.text()
      if (response.status === expectedStatus && /text\/html/i.test(response.headers.get('content-type') || '')) {
        return { response, html, url: response.url || url.toString() }
      }
      lastError = new Error(label + ': expected HTTP ' + expectedStatus + ', received ' + response.status)
    } catch (error) {
      lastError = error
    }
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
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function expectedName(product, language) {
  return product.translations?.[language]?.name || product.name || product.slug
}

function expectedH1(product, language) {
  return (language === 'bg' ? product.seo?.h1 : product.translations?.[language]?.seo?.h1) || expectedName(product, language)
}

async function mapLimit(items, limit, worker) {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

const products = await sanityFetch(\`
  *[_type == "product" && isActive != false && defined(slug.current)] | order(slug.current asc) {
    _id, name, "slug": slug.current, sku, priceEUR, stockStatus,
    seo { h1, noIndex },
    translations {
      ru { name, shortDescription, seo { h1, noIndex, metaTitle, metaDescription } },
      en { name, shortDescription, seo { h1, noIndex, metaTitle, metaDescription } }
    },
    "specCount": count(specifications[defined(name) && defined(value)]),
    "galleryCount": count(gallery),
    "kitCount": count(kitComponents),
    "relatedProductCount": count(relatedProducts),
    "relatedContentCount": count(relatedContent),
    "hasManual": defined(manualPDF.asset),
    "hasCatalog": defined(catalogPDF.asset),
    "hasDescription": defined(description)
  }
\`)
assert.ok(Array.isArray(products) && products.length > 0, 'Sanity must expose published active equipment products')
console.log('Discovered ' + products.length + ' active published irrigation equipment products in Sanity production')

for (const language of LOCALES) {
  await mapLimit(products, 8, async (product) => {
    const path = '/product/' + encodeURIComponent(product.slug) + (language === 'bg' ? '' : '?lang=' + language)
    const label = language + ' /product/' + product.slug
    const { html, response } = await fetchPage(path, label)
    assert.match(html, new RegExp('<html\\b[^>]*lang="' + language + '"', 'i'), label + ': html lang mismatch')
    assert.match(html, /name="robots"[^>]*content="index, follow"/i, label + ': indexable robots metadata missing')
    assert.match(html, /rel="canonical"/i, label + ': canonical missing')
    assert.match(html, /hreflang="bg"/i, label + ': BG alternate missing')
    assert.match(html, /hreflang="ru"/i, label + ': RU alternate missing')
    assert.match(html, /hreflang="en"/i, label + ': EN alternate missing')
    assert.match(html, /data-florial-ssr="equipment-product-v1"/i, label + ': full equipment product SSR marker missing')

    const main = html.match(/<main\\b[^>]*data-florial-ssr="equipment-product-v1"[^>]*>([\\s\\S]*?)<\\/main>/i)
    assert.ok(main, label + ': server-rendered product main missing')
    const h1 = main[1].match(/<h1\\b[^>]*>([\\s\\S]*?)<\\/h1>/i)
    assert.ok(h1, label + ': localized H1 missing')
    assert.ok(h1[1].includes(escapeHtml(expectedH1(product, language))), label + ': H1 differs from Sanity localized SEO H1')
    assert.match(main[1], /data-florial-product-breadcrumbs="true"/, label + ': product category breadcrumbs missing')
    assert.match(main[1], /data-florial-product-gallery="true"/, label + ': product gallery missing')
    assert.match(main[1], /srcset=/, label + ': responsive product image srcset missing')
    assert.match(main[1], /data-florial-product-price="/, label + ': factual product price missing')
    assert.match(main[1], new RegExp('data-florial-product-price="' + Number(product.priceEUR).toFixed(2) + '"'), label + ': SSR price differs from Sanity EUR price')
    assert.match(main[1], new RegExp('data-florial-product-stock="' + (product.stockStatus || 'onRequest') + '"'), label + ': stock status differs from Sanity')
    if (product.sku) assert.ok(main[1].includes('SKU: ' + escapeHtml(product.sku)), label + ': SKU missing')
    if (product.specCount > 0) {
      const specCount = Number(main[1].match(/data-florial-product-spec-count="(\\d+)"/)?.[1] || 0)
      assert.equal(specCount, product.specCount, label + ': rendered technical specification count differs from Sanity')
    }
    if (product.hasDescription) assert.match(main[1], /data-florial-product-description="true"/, label + ': product description missing')
    if (product.kitCount > 0) assert.match(main[1], /data-florial-product-kit="true"/, label + ': kit components missing')
    if (product.hasManual || product.hasCatalog) assert.match(main[1], /data-florial-product-documents="true"/, label + ': product PDF documents missing')
    if (product.relatedProductCount > 0) assert.match(main[1], /data-florial-product-related-products="true"/, label + ': related products missing')
    if (product.relatedContentCount > 0) assert.match(main[1], /data-florial-product-related-content="true"/, label + ': related services/articles missing')

    const productData = extractJsonLd(html, 'product', label)
    assert.equal(productData['@type'], 'Product', label + ': Product JSON-LD type mismatch')
    assert.equal(productData.name, expectedName(product, language), label + ': Product JSON-LD name differs from localized Sanity name')
    assert.equal(productData.sku || '', product.sku || '', label + ': Product JSON-LD SKU mismatch')
    assert.ok(Array.isArray(productData.image) && productData.image.length > 0, label + ': Product JSON-LD images missing')
    assert.equal(productData.offers?.price, Number(product.priceEUR).toFixed(2), label + ': Offer price mismatch')
    assert.equal(productData.offers?.priceCurrency, 'EUR', label + ': Offer currency mismatch')
    assert.equal(productData.offers?.url, SITE_URL + '/product/' + encodeURIComponent(product.slug) + (language === 'bg' ? '' : '?lang=' + language), label + ': Offer URL mismatch')
    if (product.stockStatus === 'inStock') assert.equal(productData.offers?.availability, 'https://schema.org/InStock', label + ': Offer availability mismatch')
    if (product.stockStatus === 'outOfStock') assert.equal(productData.offers?.availability, 'https://schema.org/OutOfStock', label + ': Offer availability mismatch')
    if (product.stockStatus === 'onRequest') assert.equal(productData.offers?.availability, undefined, label + ': on-request stock must not be represented as in-stock/pre-order')
    assert.equal(productData.aggregateRating, undefined, label + ': fabricated aggregate rating')
    assert.equal(productData.review, undefined, label + ': unsupported review data')

    const breadcrumb = extractJsonLd(html, 'breadcrumbs', label)
    assert.equal(breadcrumb['@type'], 'BreadcrumbList', label + ': BreadcrumbList type mismatch')
    assert.ok(breadcrumb.itemListElement?.length >= 3, label + ': category breadcrumb trail incomplete')
    assert.equal(breadcrumb.itemListElement.at(-1).item, SITE_URL + '/product/' + encodeURIComponent(product.slug) + (language === 'bg' ? '' : '?lang=' + language), label + ': breadcrumb product URL mismatch')
    assert.equal(response.status, 200, label + ': unexpected response status')
  })
  console.log('PASS ' + language + ': ' + products.length + ' product pages returned full first-response HTML, localized details, images, price/stock, technical data and Product/BreadcrumbList JSON-LD')
}

const missing = await fetchPage('/product/florial-ssr-missing-equipment-product-check-404', 'missing equipment product', 404)
assert.match(missing.html, /noindex/i, 'missing/unpublished product must be noindex')
console.log('PASS missing/unpublished equipment product returns 404 noindex')
