import assert from 'node:assert/strict'

const base = process.env.PREVIEW_URL || 'https://feat-ssr-blog-index-v1.florial.pages.dev'
const routes = [
  { lang: 'bg', path: '/blog', h1: 'Блог и портфолио' },
  { lang: 'ru', path: '/blog?lang=ru', h1: 'Блог и портфолио' },
  { lang: 'en', path: '/blog?lang=en', h1: 'Blog and portfolio' },
]

async function fetchHtml(route) {
  let lastError
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await fetch(new URL(route.path, base), {
        headers: { accept: 'text/html' },
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      })
      const html = await response.text()
      if (response.status === 200 && html.includes('data-florial-blog-index="v1"')) return { response, html }
      lastError = new Error('attempt ' + attempt + ': HTTP ' + response.status + '; blog index marker missing')
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
  throw lastError || new Error('Endpoint did not return server-rendered blog index HTML')
}

function parseJsonLd(html, id, language) {
  const match = html.match(new RegExp('<script\\\\b[^>]*data-florial-jsonld="' + id + '"[^>]*>([\\\\s\\\\S]*?)<\\\\/script>', 'i'))
  assert.ok(match, language + ': ' + id + ' JSON-LD missing')
  return JSON.parse(match[1])
}

for (const route of routes) {
  const { response, html } = await fetchHtml(route)
  assert.match(response.headers.get('content-type') || '', /text\/html/i)
  assert.match(html, /name="robots"[^>]*content="index, follow"/i)
  assert.ok(html.includes(route.h1), route.lang + ': localized H1 missing')
  assert.match(html, /data-florial-jsonld="breadcrumbs"/i)
  assert.match(html, /data-florial-jsonld="collection-page"/i)
  assert.match(html, /id="florial-blog-ssr-data" type="application\/json"/i)

  const mainMatch = html.match(/<main\b[^>]*data-florial-blog-index="v1"[^>]*>([\s\S]*?)<\/main>/i)
  assert.ok(mainMatch, route.lang + ': server-rendered main element missing')
  const countMatch = mainMatch[0].match(/data-florial-blog-count="(\d+)"/)
  assert.ok(countMatch, route.lang + ': published post count missing')
  const postLinks = [...mainMatch[1].matchAll(/<article\b[^>]*data-florial-blog-post="([^"]+)"[^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"/gi)]
  assert.ok(postLinks.length > 0, route.lang + ': no published article links in first response')
  assert.equal(postLinks.length, Number(countMatch[1]), route.lang + ': card count does not match rendered article count')
  assert.equal((mainMatch[1].match(/data-florial-blog-direction=/g) || []).length, 4,
    route.lang + ': all four curated topic cards must be present')

  const collection = parseJsonLd(html, 'collection-page', route.lang)
  const jsonLdLinks = (collection.mainEntity?.itemListElement || []).map((item) => item.url)
  const normalize = (value) => new URL(value, base).pathname + new URL(value, base).search
  assert.deepEqual(postLinks.map((item) => normalize(item[2])), jsonLdLinks.map(normalize),
    route.lang + ': article card order must match CollectionPage ItemList')
  assert.equal(collection.mainEntity?.numberOfItems, postLinks.length,
    route.lang + ': ItemList numberOfItems does not match HTML cards')

  const seedMatch = html.match(/<script\b[^>]*id="florial-blog-ssr-data"[^>]*>([\s\S]*?)<\/script>/i)
  assert.ok(seedMatch, route.lang + ': client hydration seed missing')
  const seed = JSON.parse(seedMatch[1])
  assert.equal(seed.language, route.lang, route.lang + ': SSR seed locale mismatch')
  assert.equal(seed.posts.length, postLinks.length, route.lang + ': SSR seed does not match visible cards')
  assert.deepEqual(seed.posts.map((post) => typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id),
    postLinks.map((item) => item[1]), route.lang + ': SSR seed order differs from HTML card order')

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]
  assert.equal(canonical, 'https://florial-bg.com/blog' + (route.lang === 'bg' ? '' : '?lang=' + route.lang),
    route.lang + ': canonical URL mismatch')
  if (route.lang !== 'bg') {
    assert.ok(postLinks.every((item) => new URL(item[2], base).searchParams.get('lang') === route.lang),
      route.lang + ': article links must preserve locale')
  }
  console.log('PASS ' + route.lang + ': raw HTTP HTML contains ' + postLinks.length + ' articles, four directions, matching ItemList and hydration seed')
}
