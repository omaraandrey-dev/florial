import assert from 'node:assert/strict'

const base = process.env.PREVIEW_URL || 'https://feat-ssr-services-directory.florial.pages.dev'
const routes = [
  { lang: 'bg', path: '/services', h1: 'Услуги на градински център Florial' },
  { lang: 'ru', path: '/services?lang=ru', h1: 'Услуги садового центра Florial' },
  { lang: 'en', path: '/services?lang=en', h1: 'Florial Garden Centre Services' },
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
      if (response.status === 200 && html.includes('data-florial-services-directory="true"')) {
        return { response, html }
      }
      lastError = new Error('attempt ' + attempt + ': HTTP ' + response.status + '; services directory marker missing')
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
  throw lastError || new Error('Preview did not return server-rendered services directory HTML')
}

for (const route of routes) {
  const { response, html } = await fetchHtml(route)
  assert.match(response.headers.get('content-type') || '', /text\/html/i)
  assert.match(html, /name="robots"[^>]*content="index, follow"/i)
  assert.ok(html.includes(route.h1), route.lang + ': localized H1 missing')
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/florial-bg\.com\/services/i)
  assert.match(html, /data-florial-jsonld="breadcrumbs"/i)
  assert.match(html, /data-florial-jsonld="collection-page"/i)

  const mainMatch = html.match(/<main\b[^>]*data-florial-services-directory="true"[^>]*>([\s\S]*?)<\/main>/i)
  assert.ok(mainMatch, route.lang + ': server-rendered main element missing')
  const cardLinks = [...mainMatch[1].matchAll(/<a\b[^>]*href="([^"]*\/services\/[^"]+)"[^>]*>/gi)]
    .map((match) => match[1])
    .filter((url) => !new URL(url, base).pathname.includes('/services/category/'))
  assert.ok(cardLinks.length > 0, route.lang + ': no service detail links in first response')

  const collectionScript = html.match(/<script\b[^>]*data-florial-jsonld="collection-page"[^>]*>([\s\S]*?)<\/script>/i)
  assert.ok(collectionScript, route.lang + ': CollectionPage JSON-LD missing')
  const collection = JSON.parse(collectionScript[1])
  const jsonLdLinks = (collection.mainEntity?.itemListElement || []).map((item) => item.url)
  const normalize = (url) => new URL(url, base).pathname + new URL(url, base).search
  assert.deepEqual(cardLinks.map(normalize), jsonLdLinks.map(normalize),
    route.lang + ': service card order must match CollectionPage ItemList')

  if (route.lang !== 'bg') {
    assert.ok(cardLinks.every((url) => new URL(url, base).searchParams.get('lang') === route.lang),
      route.lang + ': service links must preserve locale')
  }
  console.log('PASS ' + route.lang + ': raw HTTP response contains ' + cardLinks.length + ' service links and matching CollectionPage/BreadcrumbList')
}
