import assert from 'node:assert/strict'

const baseUrl = String(process.env.BASE_URL || '').replace(/\/+$/, '')
assert.ok(baseUrl, 'BASE_URL must point to the exact Florial Preview or Production site')

async function fetchHtml(path, label) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })
  const html = await response.text()
  assert.equal(response.status, 200, label + ': HTTP status')
  assert.match(response.headers.get('content-type') || '', /text\/html/i, label + ': content type')
  return html
}

const robotsResponse = await fetch(new URL('/robots.txt', baseUrl), {
  headers: { Accept: 'text/plain' },
  redirect: 'follow',
  signal: AbortSignal.timeout(20000),
})
assert.equal(robotsResponse.status, 200, 'robots.txt HTTP status')
const robots = await robotsResponse.text()
assert.match(robots, /User-agent:\s*\*/i, 'robots.txt global user-agent')
assert.match(robots, /Allow:\s*\//i, 'robots.txt public crawl allowance')
assert.match(robots, /Sitemap:\s*https:\/\/florial-bg\.com\/sitemap\.xml/i, 'robots.txt canonical sitemap reference')
console.log('PASS robots.txt — public crawling and canonical sitemap reference')

const sitemapResponse = await fetch(new URL('/sitemap.xml', baseUrl), {
  headers: { Accept: 'application/xml,text/xml' },
  redirect: 'follow',
  signal: AbortSignal.timeout(30000),
})
assert.equal(sitemapResponse.status, 200, 'sitemap.xml HTTP status')
assert.match(sitemapResponse.headers.get('content-type') || '', /application\/xml|text\/xml/i, 'sitemap XML content type')
const xml = await sitemapResponse.text()
assert.match(xml, /^<\?xml\s+version="1\.0"/i, 'sitemap XML declaration')
assert.match(xml, /<urlset\b/i, 'sitemap urlset root')

const decodeXml = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()))
assert.ok(urls.length > 100, 'sitemap should include the published Florial catalogue and content routes; got ' + urls.length)
assert.equal(new Set(urls).size, urls.length, 'sitemap canonical loc URLs must be unique')
for (const path of ['/', '/contacts', '/about', '/services', '/blog']) {
  assert.ok(urls.includes('https://florial-bg.com' + path), 'sitemap must include ' + path)
}
for (const locale of ['ru', 'en']) {
  for (const path of ['/contacts', '/about', '/services', '/blog']) {
    assert.ok(urls.includes('https://florial-bg.com' + path + '?lang=' + locale), 'sitemap must include ' + locale + ' ' + path)
  }
}
assert.match(xml, /hreflang="bg"/, 'sitemap BG alternates')
assert.match(xml, /hreflang="ru"/, 'sitemap RU alternates')
assert.match(xml, /hreflang="en"/, 'sitemap EN alternates')
assert.match(xml, /hreflang="x-default"/, 'sitemap x-default alternates')
for (const forbidden of ['/cart', '/search', '/manager', '/api/']) {
  assert.ok(!urls.some((url) => new URL(url).pathname.startsWith(forbidden)), 'sitemap must not include ' + forbidden)
}
console.log('PASS sitemap.xml — ' + urls.length + ' unique canonical URLs, localized alternates and no private/noindex routes')

for (const path of ['/cart', '/search', '/withdrawal']) {
  for (const locale of ['', '?lang=ru', '?lang=en']) {
    const html = await fetchHtml(path + locale, path + locale)
    assert.match(html, /<meta\s+name="robots"\s+content="noindex, nofollow"/i, path + locale + ': noindex, nofollow')
  }
  console.log('PASS ' + path + ' — noindex, nofollow in BG/RU/EN')
}

console.log('PASS Florial SEO surface regression — robots, sitemap and non-indexable routes')
