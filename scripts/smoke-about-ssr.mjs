import assert from 'node:assert/strict'

const baseUrl = String(process.env.BASE_URL || '').replace(/\/+$/, '')
assert.ok(baseUrl, 'BASE_URL must point to the Cloudflare Pages Preview or Production site')

const locales = [
  {
    code: 'bg',
    query: '',
    canonical: 'https://florial-bg.com/about',
    title: 'Градински център Florial в Несебър',
    seoTitle: 'За нас | Градински център Florial — ландшафтен дизайн и напояване',
    team: 'Нашият екип',
    centre: 'Градински център Несебър',
    category: '/category/rastenia',
    map: 'pK8qGHh9b1xoCc4P9',
  },
  {
    code: 'ru',
    query: '?lang=ru',
    canonical: 'https://florial-bg.com/about?lang=ru',
    title: 'Садовый центр Florial в Несебре',
    seoTitle: 'О нас | Садовый центр Florial — ландшафтный дизайн и автополив в Болгарии',
    team: 'Наша команда',
    centre: 'Садовый центр Несебр',
    category: '/category/rastenia?lang=ru',
    map: 'pK8qGHh9b1xoCc4P9',
  },
  {
    code: 'en',
    query: '?lang=en',
    canonical: 'https://florial-bg.com/about?lang=en',
    title: 'Florial Garden Centre in Nessebar',
    seoTitle: 'About Florial | Landscape Design and Irrigation in Bulgaria',
    team: 'Our team',
    centre: 'Florial Garden Centre Nessebar',
    category: '/category/rastenia?lang=en',
    map: 'pK8qGHh9b1xoCc4P9',
  },
]

function jsonLdEntities(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*data-florial-jsonld="([^"]+)"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(([, id, raw]) => ({ id, data: JSON.parse(raw) }))
}

async function fetchPreviewHtml(url, locale) {
  let lastStatus = 0
  let lastError = null
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' },
        redirect: 'follow',
      })
      if (response.status === 200) return response
      lastStatus = response.status
      if (![404, 502, 503, 504].includes(response.status)) {
        assert.equal(response.status, 200, locale + ' /about HTTP status')
      }
    } catch (error) {
      lastError = error
    }
    if (attempt < 10) await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  throw new Error(locale + ' /about did not become available after deployment propagation; last status=' + lastStatus + ', error=' + String(lastError || 'none'))
}

for (const locale of locales) {
  const url = baseUrl + '/about' + locale.query
  const response = await fetchPreviewHtml(url, locale.code)
  const html = await response.text()
  assert.match(response.headers.get('content-type') || '', /text\/html/i, locale.code + ' content type')
  assert.match(html, new RegExp('<html[^>]*lang="' + locale.code + '"', 'i'), locale.code + ' html lang')
  assert.match(html, /data-florial-ssr="about"/, locale.code + ' SSR marker')
  assert.ok(html.includes('<h1') && html.includes(locale.title), locale.code + ' localized H1')
  assert.equal((html.match(/<h1\b/g) || []).length, 1, locale.code + ' exactly one H1')
  assert.ok(html.includes('<title>' + locale.seoTitle + '</title>'), locale.code + ' SEO title')
  assert.match(html, /<meta name="description" content="[^"]+"/i, locale.code + ' meta description')
  assert.match(html, /<meta name="robots" content="index, follow"/i, locale.code + ' indexability')
  assert.ok(html.includes('<link rel="canonical" href="' + locale.canonical + '"'), locale.code + ' canonical')
  assert.match(html, /hreflang="bg" href="https:\/\/florial-bg\.com\/about"/, locale.code + ' BG alternate')
  assert.match(html, /hreflang="ru" href="https:\/\/florial-bg\.com\/about\?lang=ru"/, locale.code + ' RU alternate')
  assert.match(html, /hreflang="en" href="https:\/\/florial-bg\.com\/about\?lang=en"/, locale.code + ' EN alternate')

  assert.ok(html.includes(locale.team), locale.code + ' team section')
  assert.ok(html.includes(locale.centre), locale.code + ' garden-centre card')
  assert.ok(html.includes('206978288'), locale.code + ' company UIC')
  assert.ok(html.includes('BG206978288'), locale.code + ' VAT number')
  assert.ok(html.includes('BG88STSA93000029605234'), locale.code + ' company IBAN')
  assert.ok(html.includes('STSABGSF'), locale.code + ' company BIC')
  assert.ok(html.includes('barakov1971@abv.bg'), locale.code + ' company email')
  assert.ok(html.includes('href="' + locale.category + '"'), locale.code + ' plant-category link')
  assert.ok(html.includes(locale.map), locale.code + ' Nessebar map link')
  assert.ok(html.includes('3fiLaRgwSLDTH77U6'), locale.code + ' Ravda map link')

  const imageCount = (html.match(/<img\b[^>]*src="https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\//gi) || []).length
  assert.ok(imageCount >= 8, locale.code + ' expected 8 Sanity images, got ' + imageCount)
  assert.match(html, /srcset="https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\//i, locale.code + ' responsive image srcset')

  const entities = jsonLdEntities(html)
  const byId = new Map(entities.map((entry) => [entry.id, entry.data]))
  const about = byId.get('about-page')
  assert.equal(about?.['@type'], 'AboutPage', locale.code + ' AboutPage JSON-LD')
  assert.equal(about?.mainEntity?.['@id'], 'https://florial-bg.com/#organization', locale.code + ' AboutPage -> Organization')
  assert.ok(byId.has('organization'), locale.code + ' Organization JSON-LD')
  assert.ok(byId.has('website'), locale.code + ' WebSite JSON-LD')
  for (const storeId of ['local-business-nessebar', 'local-business-ravda']) {
    assert.equal(byId.get(storeId)?.['@type'], 'GardenStore', locale.code + ' ' + storeId)
    assert.equal(byId.get(storeId)?.parentOrganization?.['@id'], 'https://florial-bg.com/#organization', locale.code + ' ' + storeId + ' -> Organization')
  }

  console.log('PASS ' + locale.code + ' ' + url + ' — ' + imageCount + ' Sanity images, AboutPage/Organization/GardenStore JSON-LD')
}

console.log('PASS About SSR raw HTTP smoke — 3/3 locales')
