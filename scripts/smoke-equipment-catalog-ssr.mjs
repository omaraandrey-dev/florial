import assert from 'node:assert/strict'

const BASE_URL = (process.env.BASE_URL || 'https://florial-bg.com').replace(/\/+$/, '')
const SANITY_PROJECT_ID = 'bxvcy0qs'
const SANITY_DATASET = 'production'
const SANITY_API_VERSION = '2024-01-01'
const LOCALES = ['bg', 'ru', 'en']
const ROOT_ORDER = [
  'gotovi-komplekti-za-polivane', 'controllers', 'sprinklers', 'nozzles', 'klapani',
  'shahti', 'kapkovo-napoyavane', 'trabi-fitingi-aksesoari',
  'filtri-regulatori-nalyagane', 'drugi-komponenti-za-polivane',
]
const PRODUCT_PRIORITY_ORDER = ['controllers', 'gotovi-komplekti-za-polivane', 'sprinklers', 'nozzles', 'klapani', 'shahti']

function groqUrl(query, params = {}) {
  const url = new URL('https://' + SANITY_PROJECT_ID + '.api.sanity.io/v' + SANITY_API_VERSION + '/data/query/' + SANITY_DATASET)
  url.searchParams.set('query', query)
  url.searchParams.set('perspective', 'published')
  for (const [key, value] of Object.entries(params)) url.searchParams.set('$' + key, JSON.stringify(value))
  return url
}

async function sanityFetch(query, params = {}) {
  const response = await fetch(groqUrl(query, params), {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  assert.equal(response.status, 200, 'Sanity query must return HTTP 200')
  const body = await response.json()
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'result'), 'Sanity response must contain result')
  return body.result
}

function descendantIds(rootId, categories) {
  const children = new Map()
  for (const category of categories) {
    if (!category.parentId) continue
    const items = children.get(category.parentId) || []
    items.push(category._id)
    children.set(category.parentId, items)
  }
  const result = new Set([rootId])
  const pending = [rootId]
  while (pending.length) {
    const current = pending.pop()
    for (const child of children.get(current) || []) {
      if (result.has(child)) continue
      result.add(child)
      pending.push(child)
    }
  }
  return result
}

function localizedName(category, language) {
  return language === 'bg' ? category.name : category.translations?.[language]?.name || category.name
}

function localizedSeo(category, language) {
  return language === 'bg' ? category.seo : category.translations?.[language]?.seo
}

function localizedSeoBlockCount(category, language) {
  return language === 'bg' ? category.seoBlockCount : language === 'ru'
    ? category.translations?.ru?.seoBlockCount
    : category.translations?.en?.seoBlockCount
}

function visibleCategoryIds(categories) {
  const byId = new Map(categories.map((category) => [category._id, category]))
  const visible = new Set()
  for (const category of categories) {
    if ((category.productCount || 0) <= 0) continue
    let current = category
    const visited = new Set()
    while (current && !visited.has(current._id)) {
      visited.add(current._id)
      visible.add(current._id)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
  }
  return visible
}

function categoryChildren(categoryId, categories, rootCatalog, visibleIds, language) {
  const children = categories.filter((item) =>
    item.parentId === categoryId &&
    item.slug &&
    item.slug !== 'electromagnetic-valves' &&
    visibleIds.has(item._id)
  )
  return children.sort((a, b) => {
    if (rootCatalog) {
      const ai = ROOT_ORDER.indexOf(a.slug)
      const bi = ROOT_ORDER.indexOf(b.slug)
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }
    }
    return (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || String(a.name || '').localeCompare(String(b.name || ''), language)
  })
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function expectedProductEntries(category, categories, products, language) {
  const ids = descendantIds(category._id, categories)
  const matches = products.filter((product) => {
    const refs = [product.categoryId, ...(product.categoryIds || [])].filter(Boolean)
    return refs.some((id) => ids.has(id))
  }).filter((product) => product.slug)
  const sorted = matches.slice().sort((a, b) => {
    const aName = a.translations?.[language]?.name || a.name || ''
    const bName = b.translations?.[language]?.name || b.name || ''
    return String(aName).localeCompare(String(bName), language)
  })
  if (category.slug !== 'vsichko-za-polivane') return sorted.slice(0, 20)

  const priorityIds = PRODUCT_PRIORITY_ORDER
    .map((slug) => categories.find((item) => item.slug === slug)?._id)
    .filter(Boolean)
  const prioritySet = new Set(priorityIds)
  const parentById = new Map(categories.map((item) => [item._id, item.parentId]))
  const rootIdFor = (categoryId) => {
    let current = categoryId
    const visited = new Set()
    while (current && !visited.has(current)) {
      if (prioritySet.has(current)) return current
      visited.add(current)
      current = parentById.get(current)
    }
    return undefined
  }
  const buckets = new Map(priorityIds.map((id) => [id, []]))
  const other = []
  for (const product of sorted) {
    const refs = [product.categoryId, ...(product.categoryIds || [])].filter(Boolean)
    const matching = refs.map(rootIdFor).find(Boolean)
    if (matching) buckets.get(matching).push(product)
    else other.push(product)
  }
  const nozzlesId = categories.find((item) => item.slug === 'nozzles')?._id
  const nozzleBucket = nozzlesId ? buckets.get(nozzlesId) : null
  if (nozzleBucket) {
    const rank = (product) => {
      const text = [product.name, product.translations?.[language]?.name, product.sku].filter(Boolean).join(' ').toUpperCase()
      if (/\bR[\s-]?VAN\b/.test(text)) return 0
      if (/\bHE[\s-]?VAN\b/.test(text)) return 1
      if (/\bVAN\b/.test(text)) return 2
      return 3
    }
    nozzleBucket.sort((a, b) => rank(a) - rank(b))
  }
  const ordered = []
  let more = true
  while (more) {
    more = false
    for (const id of priorityIds) {
      const next = buckets.get(id).shift()
      if (next) { ordered.push(next); more = true }
    }
  }
  return [...ordered, ...other].slice(0, 20)
}

function extractProductLinks(section) {
  return [...section.matchAll(/<a\b[^>]*href="([^"]*\/product\/[^"]+)"[^>]*>/gi)].map((match) => match[1])
}

function normalizedUrl(value) {
  const url = new URL(value, BASE_URL)
  return url.pathname + url.search
}

async function fetchPage(route) {
  let lastError
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const response = await fetch(new URL(route, BASE_URL), {
        headers: { accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      })
      const html = await response.text()
      if (response.status === 200 && html.includes('data-florial-server-catalogue="equipment"')) return { response, html }
      lastError = new Error('HTTP ' + response.status + '; equipment catalogue marker missing for ' + route)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw lastError || new Error('Failed to fetch ' + route)
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await mapper(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

const categoryQuery = [
  '*[_type == "category" && defined(slug.current)] | order(_id asc) {',
  '_id, name, "slug": coalesce(slug.current, slug), "parentId": parent->_id, sortOrder,',
  '"productCount": count(*[_type == "product" && isActive != false && defined(slug) && (category._ref == ^._id || ^._id in categories[]._ref)]),',
  'seo { h1, noIndex }, "seoBlockCount": count(seoContent), "hasHelpBlock": defined(helpBlock),',
  'translations {',
  'ru { name, seo { h1, noIndex }, "seoBlockCount": count(seoContent) },',
  'en { name, seo { h1, noIndex }, "seoBlockCount": count(seoContent) }',
  '} }',
].join('\n')
const categories = await sanityFetch(categoryQuery)
assert.ok(Array.isArray(categories) && categories.length > 0, 'Published equipment categories must be discoverable')
const categoryIds = categories.map((category) => category._id)
const productQuery = [
  '*[_type == "product" && isActive != false && defined(slug.current) && references($categoryIds)] {',
  '_id, name, sku, "slug": slug.current, "categoryId": category->_id, "categoryIds": categories[]._ref,',
  'translations { bg { name }, ru { name }, en { name } } }',
].join('\n')
const products = await sanityFetch(productQuery, { categoryIds })
assert.ok(Array.isArray(products), 'Published equipment products must be discoverable')

const visibleIds = visibleCategoryIds(categories)
const cases = categories.flatMap((category) => LOCALES.map((language) => ({ category, language })))
const results = await mapLimit(cases, 10, async ({ category, language }) => {
  const route = '/category/' + encodeURIComponent(category.slug) + (language === 'bg' ? '' : '?lang=' + language)
  const { response, html } = await fetchPage(route)
  assert.match(response.headers.get('content-type') || '', /text\/html/i, route + ': HTML response expected')

  const seo = localizedSeo(category, language)
  const expectedH1 = seo?.h1 || localizedName(category, language)
  assert.ok(html.includes('<h1>' + escapeHtml(expectedH1) + '</h1>'), route + ': localized H1 missing')
  assert.match(html, /<link\b[^>]*rel="canonical"[^>]*>/i, route + ': canonical missing')
  assert.match(html, /name="robots"[^>]*content="(?:index|noindex), follow"/i, route + ': robots directive missing')

  const productSection = html.match(/<section\b[^>]*data-florial-server-catalogue="equipment"[^>]*>([\s\S]*?)<\/section>/i)
  assert.ok(productSection, route + ': equipment product listing missing from first HTTP HTML')
  const productLinks = extractProductLinks(productSection[1])
  const expectedEntries = expectedProductEntries(category, categories, products, language)
  assert.equal(productLinks.length, expectedEntries.length, route + ': unexpected number of SSR product cards')

  const collectionScript = html.match(/<script\b[^>]*data-florial-jsonld="collection-page"[^>]*>([\s\S]*?)<\/script>/i)
  assert.ok(collectionScript, route + ': CollectionPage JSON-LD missing')
  const collection = JSON.parse(collectionScript[1])
  const jsonLdLinks = (collection.mainEntity?.itemListElement || []).map((item) => item.url)
  assert.deepEqual(productLinks.map(normalizedUrl), jsonLdLinks.map(normalizedUrl), route + ': HTML and CollectionPage product order differ')
  assert.deepEqual(
    productLinks.map(normalizedUrl),
    expectedEntries.map((item) => normalizedUrl('/product/' + item.slug + (language === 'bg' ? '' : '?lang=' + language))),
    route + ': product order differs from React catalogue rules',
  )

  const children = categoryChildren(category._id, categories, category.slug === 'vsichko-za-polivane', visibleIds, language)
  if (children.length) {
    const nav = html.match(/<section\b[^>]*data-florial-category-subcategories="true"[^>]*>([\s\S]*?)<\/section>/i)
    assert.ok(nav, route + ': direct subcategory navigation missing')
    const categoryLinks = [...nav[1].matchAll(/href="([^"]*\/category\/[^"]+)"/gi)].map((match) => match[1])
    assert.equal(categoryLinks.length, children.length, route + ': subcategory count mismatch')
    assert.deepEqual(
      categoryLinks.map(normalizedUrl),
      children.map((child) => normalizedUrl('/category/' + child.slug + (language === 'bg' ? '' : '?lang=' + language))),
      route + ': subcategory order mismatch',
    )
  } else {
    assert.doesNotMatch(html, /data-florial-category-subcategories="true"/, route + ': leaf category must not show sibling navigation')
  }

  const expectedBlocks = Number(localizedSeoBlockCount(category, language) || 0)
  if (expectedBlocks > 0) {
    const seoSection = html.match(/<section\b[^>]*data-florial-category-seo-content="true"[^>]*data-block-count="(\d+)"[^>]*>/i)
    assert.ok(seoSection, route + ': localized SEO content missing from first HTTP HTML')
    assert.equal(Number(seoSection[1]), expectedBlocks, route + ': localized SEO block count mismatch')
  } else {
    assert.doesNotMatch(html, /data-florial-category-seo-content="true"/, route + ': empty localized SEO content should not be emitted')
  }

  if (category.hasHelpBlock) assert.match(html, /data-florial-category-help="true"/, route + ': category help block missing')

  if (language !== 'bg') {
    assert.ok(productLinks.every((link) => new URL(link, BASE_URL).searchParams.get('lang') === language), route + ': product links must preserve language')
  }

  return { category: category.slug, language, products: productLinks.length, children: children.length, seoBlocks: expectedBlocks }
})

console.log('PASS equipment category SSR: ' + results.length + ' localized category routes checked (' + categories.length + ' categories × 3 languages)')
console.log('Published category count: ' + categories.length + '; published products linked to equipment categories: ' + products.length)
