import { buildServicesRssXml } from '../_lib/servicesRss.mjs'

const SANITY_PROJECT_ID = 'bxvcy0qs'
const SANITY_API_VERSION = '2024-01-01'
const SITE_URL = 'https://florial-bg.com'
const FEED_PATH = '/feeds/services-bg.xml'
const edgeCache = (caches as unknown as { default: Cache }).default

const SERVICES_QUERY = `
  *[
    _type == "service" &&
    isActive != false &&
    seo.noIndex != true &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ] | order(_updatedAt desc) {
    _id,
    name,
    "slug": slug.current,
    shortDescription,
    "seoDescription": seo.metaDescription,
    "updatedAt": _updatedAt
  }
`

type SanityService = {
  _id: string
  name?: string
  slug?: string
  shortDescription?: string
  seoDescription?: string
  updatedAt?: string
}

type SanityQueryResponse = {
  result?: SanityService[]
}

export async function onRequestGet({ request }: { request: Request }): Promise<Response> {
  const cacheKey = new Request(request.url, { method: 'GET' })
  try {
    const cached = await edgeCache.match(cacheKey)
    if (cached) return cached
  } catch {
    // Cache API is an optimization; a cache miss/failure must not block the feed.
  }

  try {
    const sanityUrl = new URL(
      `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/production`,
    )
    sanityUrl.searchParams.set('query', SERVICES_QUERY)
    sanityUrl.searchParams.set('perspective', 'published')
    sanityUrl.searchParams.set('tag', 'florial.ssr.services-feed')

    const sanityResponse = await fetch(sanityUrl.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!sanityResponse.ok) {
      throw new Error(`Sanity query failed: ${sanityResponse.status}`)
    }

    const body = (await sanityResponse.json()) as SanityQueryResponse
    if (!Array.isArray(body.result)) {
      throw new Error('Sanity returned an invalid services result')
    }

    const xml = buildServicesRssXml({
      items: body.result,
      feedUrl: SITE_URL + FEED_PATH,
    })

    const response = new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
    try {
      await edgeCache.put(cacheKey, response.clone())
    } catch {
      // The response remains valid even if this edge location cannot cache it.
    }
    return response
  } catch {
    return new Response('Services RSS feed temporarily unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
}
