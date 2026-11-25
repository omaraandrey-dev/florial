import assert from 'node:assert/strict'

const base = process.env.PREVIEW_URL || 'https://feat-ssr-service-details-v1.florial.pages.dev'
const locales = ['bg', 'ru', 'en']

async function fetchHtml(path, label) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const url = new URL(path, base)
      const response = await fetch(url, {
        headers: { accept: 'text/html' },
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      })
      const html = await response.text()
      if (response.status === 200 && /text\/html/i.test(response.headers.get('content-type') || '')) {
        return { response, html, url: response.url || url.toString() }
      }
      lastError = new Error(label + ': HTTP ' + response.status)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
  }
  throw lastError || new Error(label + ': no HTML response')
}

function extractJsonLd(html, id, label) {
  const match = html.match(new RegExp('<script\\b(?=[^>]*data-florial-jsonld="' + id + '")[^>]*>([\\s\\S]*?)<\\/script>', 'i'))
  assert.ok(match, label + ': JSON-LD ' + id + ' missing')
  return JSON.parse(match[1])
}

function extractServiceSlugs(html) {
  const matches = [...html.matchAll(/<a\b[^>]*href="([^"]*\/services\/[^"]+)"[^>]*>/gi)]
  const slugs = new Set()
  for (const match of matches) {
    try {
      const url = new URL(match[1], base)
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length !== 2 || parts[0] !== 'services') continue
      if (parts[1] === 'dostavka-poliv') continue
      slugs.add(decodeURIComponent(parts[1]))
    } catch {
      // Ignore malformed/non-service links; the rendered directory is checked below.
    }
  }
  return [...slugs]
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return results
}

const directory = await fetchHtml('/services', 'BG services directory')
assert.match(directory.html, /data-florial-services-directory="true"/)
const slugs = extractServiceSlugs(directory.html)
assert.ok(slugs.length > 0, 'No active service detail links were found in the directory')
console.log('Found ' + slugs.length + ' active Sanity service detail routes')

for (const language of locales) {
  const paths = slugs.map((slug) => '/services/' + encodeURIComponent(slug) + (language === 'bg' ? '' : '?lang=' + language))
  await mapLimit(paths, 8, async (path) => {
    const label = language + ' ' + path
    const { html } = await fetchHtml(path, label)
    assert.ok(html.includes('<html lang="' + language + '"'), label + ': html lang mismatch')
    assert.match(html, /name="robots"/i, label + ': robots metadata missing')
    assert.match(html, /rel="canonical"/i, label + ': canonical missing')
    assert.match(html, /data-florial-service-detail="true"/i, label + ': service detail first-response marker missing')
    const main = html.match(/<main\b[^>]*data-florial-service-detail="true"[^>]*>([\s\S]*?)<\/main>/i)
    assert.ok(main, label + ': server-rendered service main missing')
    const h1 = main[1].match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    assert.ok(h1 && h1[1].replace(/<[^>]+>/g, '').trim(), label + ': localized H1 missing')
    assert.ok(!main[1].includes('__gallery:'), label + ': raw gallery marker leaked into HTML')

    const service = extractJsonLd(html, 'service', label)
    assert.equal(service['@type'], 'Service', label + ': Service JSON-LD type mismatch')
    assert.ok(service.name && service.description, label + ': Service JSON-LD name/description missing')
    assert.ok(service.url.includes('/services/'), label + ': Service JSON-LD URL missing')
    assert.equal(service.provider?.['@id'], 'https://florial-bg.com/#organization', label + ': provider reference mismatch')
    assert.ok(Array.isArray(service.areaServed) && service.areaServed.length > 0, label + ': areaServed missing')

    const breadcrumb = extractJsonLd(html, 'breadcrumbs', label)
    assert.equal(breadcrumb['@type'], 'BreadcrumbList', label + ': BreadcrumbList type mismatch')
    assert.ok(breadcrumb.itemListElement?.length >= 3, label + ': breadcrumb trail incomplete')
  })
  console.log('PASS ' + language + ': ' + slugs.length + ' service detail pages returned complete first-response HTML and Service/BreadcrumbList JSON-LD')
}

for (const language of locales) {
  const path = '/services/dostavka-poliv' + (language === 'bg' ? '' : '?lang=' + language)
  const { html } = await fetchHtml(path, language + ' legacy delivery page')
  assert.match(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/i, language + ': legacy delivery H1 missing')
  const service = extractJsonLd(html, 'service', language + ' legacy delivery page')
  assert.equal(service['@type'], 'Service')
}
console.log('PASS legacy delivery route preserved in BG/RU/EN')
