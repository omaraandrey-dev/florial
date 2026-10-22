type SitemapDocument = {
  _id: string
  path?: string | null
  noIndex?: boolean | null
  hasEnglishSeo?: boolean | null
  hasRussianSeo?: boolean | null
  _updatedAt?: string | null
}

type SanityQueryResponse = {
  result?: SitemapDocument[]
}

const SITE_URL = 'https://florial-bg.com'
const SANITY_PROJECT_ID = 'bxvcy0qs'
const SANITY_API_VERSION = '2024-01-01'

const queries = {
  categories: '*[_type == "category"] { _id, "path": coalesce(slug.current, slug, _id), "noIndex": seo.noIndex, _updatedAt }',
  products: '*[_type == "product" && isActive != false] { _id, "path": coalesce(slug.current, slug, _id), "noIndex": seo.noIndex, _updatedAt }',
  services: '*[_type == "service" && isActive != false] { _id, "path": coalesce(slug.current, slug, _id), "noIndex": seo.noIndex, "hasEnglishSeo": defined(translations.en.seo.metaTitle) && defined(translations.en.seo.metaDescription), "hasRussianSeo": defined(translations.ru.seo.metaTitle) && defined(translations.ru.seo.metaDescription), _updatedAt }',
  plantCategories: '*[_type == "category"] { _id, "path": coalesce(slug.current, slug, _id), _updatedAt }',
  plantProducts: '*[_type == "product" && productType == "plant" && isActive != false] { _id, "path": coalesce(slug.current, slug, _id), _updatedAt }',
}

async function querySanity(dataset: string, query: string): Promise<SitemapDocument[]> {
  const url = new URL(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${dataset}`,
  )
  url.searchParams.set('query', query)

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Sanity query failed for dataset ${dataset}: ${response.status}`)
  }

  const body = (await response.json()) as SanityQueryResponse
  if (!Array.isArray(body.result)) {
    throw new Error(`Sanity returned an invalid result for dataset ${dataset}`)
  }

  return body.result
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] || character)
}

function addUrl(
  urls: Map<string, string | undefined>,
  path: string,
  updatedAt?: string | null,
) {
  const normalizedPath = path.replace(/^\/+/, '')
  const url = normalizedPath ? `${SITE_URL}/${normalizedPath}` : `${SITE_URL}/`
  const lastmod = updatedAt && !Number.isNaN(Date.parse(updatedAt))
    ? new Date(updatedAt).toISOString()
    : undefined

  const previous = urls.get(url)
  if (!previous || (lastmod && lastmod > previous)) urls.set(url, lastmod)
}

function xmlResponse(urls: Map<string, string | undefined>): Response {
  const entries = Array.from(urls.entries()).map(([url, lastmod]) => {
    const modified = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
    return `  <url>\n    <loc>${escapeXml(url)}</loc>${modified}\n  </url>`
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function onRequestGet(): Promise<Response> {
  try {
    const [
      equipmentCategories,
      equipmentProducts,
      services,
      plantCategories,
      plantProducts,
    ] = await Promise.all([
      querySanity('production', queries.categories),
      querySanity('production', queries.products),
      querySanity('production', queries.services),
      querySanity('plants', queries.plantCategories),
      querySanity('plants', queries.plantProducts),
    ])

    const urls = new Map<string, string | undefined>()
    addUrl(urls, '')
    addUrl(urls, 'contacts')

    for (const document of services) {
      if (!document.noIndex && document.path) {
        const servicePath = `services/${encodeURIComponent(document.path)}`
        addUrl(urls, servicePath, document._updatedAt)
        if (document.hasRussianSeo) addUrl(urls, `${servicePath}?lang=ru`, document._updatedAt)
        if (document.hasEnglishSeo) addUrl(urls, `${servicePath}?lang=en`, document._updatedAt)
      }
    }

    for (const document of [...equipmentCategories, ...plantCategories]) {
      if (!document.noIndex && document.path) {
        addUrl(urls, `category/${encodeURIComponent(document.path)}`, document._updatedAt)
      }
    }

    for (const document of [...equipmentProducts, ...plantProducts]) {
      if (!document.noIndex && document.path) {
        addUrl(urls, `product/${encodeURIComponent(document.path)}`, document._updatedAt)
      }
    }

    return xmlResponse(urls)
  } catch {
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
      },
    })
  }
}
