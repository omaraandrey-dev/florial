import assert from 'node:assert/strict'

const baseUrl = String(process.env.BASE_URL || '').replace(/\/+$/, '')
assert.ok(baseUrl, 'BASE_URL must point to the exact Florial Preview or Production site')

const locales = [
  { code: 'bg', query: '', canonical: 'https://florial-bg.com/contacts', h1: 'Контакти и локации', nessebar: 'Градински център Несебър', ravda: 'Градински център Равда', days: 'Неделя' },
  { code: 'ru', query: '?lang=ru', canonical: 'https://florial-bg.com/contacts?lang=ru', h1: 'Контакты и адреса', nessebar: 'Садовый центр Несебр', ravda: 'Садовый центр Равда', days: 'Воскресенье' },
  { code: 'en', query: '?lang=en', canonical: 'https://florial-bg.com/contacts?lang=en', h1: 'Contacts & Locations', nessebar: 'Garden Centre Nessebar', ravda: 'Garden Centre Ravda', days: 'Sunday' },
]

function jsonLdEntities(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*data-florial-jsonld="([^"]+)"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(([, id, raw]) => ({ id, data: JSON.parse(raw) }))
}

async function fetchHtml(url, locale) {
  let lastError
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      })
      const html = await response.text()
      if (response.status === 200 && /text\/html/i.test(response.headers.get('content-type') || '')) return { response, html }
      lastError = new Error(locale + ': expected HTTP 200 HTML, received ' + response.status)
    } catch (error) {
      lastError = error
    }
    if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
  }
  throw lastError || new Error(locale + ': contacts page did not return HTML')
}

for (const locale of locales) {
  const url = baseUrl + '/contacts' + locale.query
  const { response, html } = await fetchHtml(url, locale.code)
  assert.match(html, new RegExp('<html[^>]*lang="' + locale.code + '"', 'i'), locale.code + ': html lang')
  assert.match(html, /data-florial-ssr="contacts"/, locale.code + ': contacts SSR marker')
  assert.equal((html.match(/<h1\b/g) || []).length, 1, locale.code + ': exactly one H1')
  assert.ok(html.includes('<h1') && html.includes(locale.h1), locale.code + ': localized H1')
  assert.ok(html.includes('rel="canonical" href="' + locale.canonical + '"'), locale.code + ': canonical')
  assert.match(html, /name="robots"[^>]*content="index, follow"/i, locale.code + ': indexability')
  for (const language of ['bg', 'ru', 'en']) {
    const query = language === 'bg' ? '' : '?lang=' + language
    assert.ok(html.includes('hreflang="' + language + '" href="https://florial-bg.com/contacts' + query + '"'), locale.code + ': hreflang ' + language)
  }
  const headingText = (value) => value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot);/gi, (_, entity) => {
      if (entity[0] === '#') {
        const numeric = entity[1].toLowerCase() === 'x'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10)
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : ''
      }
      return ({ amp: '&', lt: '<', gt: '>', quot: '"' })[entity.toLowerCase()] || ''
    })
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC')
  const locationHeadings = [...html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)]
    .map((match) => headingText(match[1]))
  assert.ok(locationHeadings.includes(locale.nessebar.normalize('NFC')), locale.code + ': Nessebar garden centre; found headings: ' + JSON.stringify(locationHeadings))
  assert.ok(locationHeadings.includes(locale.ravda.normalize('NFC')), locale.code + ': Ravda garden centre; found headings: ' + JSON.stringify(locationHeadings))
  assert.ok(html.includes('pK8qGHh9b1xoCc4P9'), locale.code + ': Nessebar map')
  assert.ok(html.includes('3fiLaRgwSLDTH77U6'), locale.code + ': Ravda map')
  assert.ok(html.includes('+359876777902') && html.includes('+359885834860'), locale.code + ': contact phones')
  assert.equal((html.match(/09:00 – 17:00/g) || []).length, 7, locale.code + ': seven-day opening hours')
  assert.ok(html.includes(locale.days), locale.code + ': localized Sunday label')

  const entities = new Map(jsonLdEntities(html).map((entry) => [entry.id, entry.data]))
  for (const id of ['local-business-nessebar', 'local-business-ravda']) {
    assert.equal(entities.get(id)?.['@type'], 'GardenStore', locale.code + ': ' + id + ' JSON-LD')
  }
  console.log('PASS ' + locale.code + ' ' + url + ' — first-response contacts, two locations, opening hours and GardenStore JSON-LD')
}

console.log('PASS Contacts SSR raw HTTP smoke — 3/3 locales')
