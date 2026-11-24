import assert from 'node:assert/strict'

const base = process.env.BASE_URL
if (!base) throw new Error('BASE_URL must point to the exact Florial Preview or Production deployment')

const routes = [
  { language: 'bg', path: '/' },
  { language: 'ru', path: '/?lang=ru' },
  { language: 'en', path: '/?lang=en' },
]

async function fetchInitialHtml(route) {
  let lastError
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await fetch(new URL(route.path, base), {
        headers: { accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      })
      const html = await response.text()
      if (response.status === 200 && html.includes('data-florial-ssr-homepage="v1"')) {
        return { response, html }
      }
      lastError = new Error(route.language + ': attempt ' + attempt + ' returned HTTP ' + response.status + ' without homepage SSR marker')
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
  throw lastError || new Error(route.language + ': homepage SSR response was not available')
}

for (const route of routes) {
  const { response, html } = await fetchInitialHtml(route)
  assert.match(response.headers.get('content-type') || '', /text\/html/i)
  assert.match(response.headers.get('cache-control') || '', /s-maxage=/i)
  assert.match(html, new RegExp('<html[^>]*lang="' + route.language + '"', 'i'))
  assert.match(html, /name="robots"[^>]*content="index, follow"/i)
  assert.equal((html.match(/data-florial-ssr-homepage="v1"/g) || []).length, 1)
  assert.equal((html.match(/<h1\b/gi) || []).length, 1)
  assert.match(html, /href="\/category\/rastenia(?:\?lang=(?:ru|en))?"/)
  assert.match(html, /href="\/category\/vsichko-za-polivane(?:\?lang=(?:ru|en))?"/)
  assert.match(html, /href="\/services(?:\?lang=(?:ru|en))?"/)
  assert.match(html, /href="\/blog(?:\?lang=(?:ru|en))?"/)
  assert.match(html, /href="\/product\//)
  assert.match(html, /data-florial-jsonld="organization"/)
  assert.match(html, /data-florial-jsonld="website"/)
  assert.match(html, /data-florial-jsonld="local-business-nessebar"/)
  assert.match(html, /data-florial-jsonld="local-business-ravda"/)
  assert.ok(Buffer.byteLength(html, 'utf8') < 350_000, route.language + ': homepage initial HTML exceeded 350 KB')
  if (route.language !== 'bg') {
    assert.match(html, new RegExp('href="[^"]+\\?lang=' + route.language + '"'))
  }
  console.log('PASS ' + route.language + ': raw HTTP first response contains homepage sections, catalogue/product links and localized metadata')
}
