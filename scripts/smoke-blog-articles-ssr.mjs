import assert from 'node:assert/strict'

const base = process.env.PREVIEW_URL || 'https://feat-ssr-blog-articles-v1.florial.pages.dev'
const locales = ['bg', 'ru', 'en']

async function fetchHtml(path, label, expectedStatus = 200) {
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
      if (response.status === expectedStatus && /text\/html/i.test(response.headers.get('content-type') || '')) {
        return { response, html, url: response.url || url.toString() }
      }
      lastError = new Error(label + ': expected HTTP ' + expectedStatus + ', received ' + response.status)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 1200 * attempt))
  }
  throw lastError || new Error(label + ': no HTML response')
}

function extractJsonLd(html, id, label) {
  const match = html.match(new RegExp('<script\\b(?=[^>]*data-florial-jsonld="' + id + '")[^>]*>([\\s\\S]*?)<\\/script>', 'i'))
  assert.ok(match, label + ': JSON-LD ' + id + ' missing')
  return JSON.parse(match[1])
}

function extractArticleSlugs(html) {
  const matches = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)]
  const slugs = new Set()
  for (const match of matches) {
    try {
      const url = new URL(match[1], base)
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length !== 2 || parts[0] !== 'blog') continue
      slugs.add(decodeURIComponent(parts[1]))
    } catch {
      // Ignore malformed/non-article links.
    }
  }
  return [...slugs]
}

function extractSeed(html, label) {
  const match = html.match(/<script\b[^>]*id="florial-blog-article-data"[^>]*>([\s\S]*?)<\/script>/i)
  assert.ok(match, label + ': serialized article seed missing')
  return JSON.parse(match[1])
}

async function mapLimit(items, limit, worker) {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

const directory = await fetchHtml('/blog', 'BG blog index')
assert.match(directory.html, /data-florial-blog-index="v1"/)
const slugs = extractArticleSlugs(directory.html)
assert.equal(slugs.length, 19, 'Published blog index should expose all 19 article links')
console.log('Found ' + slugs.length + ' published blog article routes')

for (const language of locales) {
  const paths = slugs.map((slug) => '/blog/' + encodeURIComponent(slug) + (language === 'bg' ? '' : '?lang=' + language))
  await mapLimit(paths, 6, async (path) => {
    const label = language + ' ' + path
    const { html, response } = await fetchHtml(path, label)
    assert.ok(html.includes('<html lang="' + language + '"'), label + ': html lang mismatch')
    assert.match(html, /name="robots"[^>]*content="index, follow"/i, label + ': robots metadata missing')
    assert.match(html, /rel="canonical"/i, label + ': canonical missing')
    assert.match(html, /hreflang="bg"/i, label + ': BG alternate missing')
    assert.match(html, /hreflang="ru"/i, label + ': RU alternate missing')
    assert.match(html, /hreflang="en"/i, label + ': EN alternate missing')
    assert.match(html, /data-florial-blog-article="v1"/i, label + ': article first-response marker missing')
    const main = html.match(/<main\b[^>]*data-florial-blog-article="v1"[^>]*>([\s\S]*?)<\/main>/i)
    assert.ok(main, label + ': server-rendered article main missing')
    const h1 = main[1].match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    assert.ok(h1 && h1[1].replace(/<[^>]+>/g, '').trim(), label + ': localized H1 missing')
    assert.match(main[1], /data-florial-blog-(?:paragraph|heading|inline-image|list)=/, label + ': rendered Portable Text body missing')

    const seed = extractSeed(html, label)
    assert.equal(seed.language, language, label + ': hydration seed locale mismatch')
    assert.equal(seed.slug, decodeURIComponent(new URL(response.url).pathname.split('/').pop()), label + ': hydration seed slug mismatch')
    assert.ok(seed.post && seed.post._id, label + ': full article missing from seed')
    const selected = seed.post.translations?.[language]
    assert.ok(selected?.title, label + ': localized title missing from seed')
    assert.ok(Array.isArray(selected?.body) && selected.body.length > 0, label + ': full Portable Text body missing from seed')
    assert.equal(Number(main[0].match(/data-florial-blog-block-count="(\d+)"/)?.[1]), selected.body.length, label + ': rendered body block count differs from seed')
    assert.match(main[1], /data-florial-blog-cover="true"/, label + ': cover image missing from article HTML')
    assert.match(main[1], /srcset=/, label + ': responsive article images missing')

    const article = extractJsonLd(html, 'blog-posting', label)
    assert.equal(article['@type'], 'BlogPosting', label + ': BlogPosting JSON-LD type mismatch')
    assert.equal(article.inLanguage, language, label + ': BlogPosting language mismatch')
    assert.ok(article.headline && article.description && article.url, label + ': BlogPosting fields missing')
    const breadcrumb = extractJsonLd(html, 'breadcrumbs', label)
    assert.equal(breadcrumb['@type'], 'BreadcrumbList', label + ': BreadcrumbList type mismatch')
    assert.equal(breadcrumb.itemListElement?.length, 3, label + ': breadcrumb trail incomplete')
    const relatedCount = Number(main[0].match(/data-florial-blog-related-count="(\d+)"/)?.[1] || 0)
    assert.equal(seed.relatedPosts.length, relatedCount, label + ': related-card seed mismatch')
    if (relatedCount) assert.match(main[1], /data-florial-blog-related-section="true"/, label + ': related cards missing')
    assert.ok(!main[1].includes('__gallery:'), label + ': raw gallery marker leaked into HTML')
  })
  console.log('PASS ' + language + ': ' + slugs.length + ' article pages returned full first-response HTML, body, images, seed and BlogPosting/BreadcrumbList JSON-LD')
}

const missing = await fetchHtml('/blog/florial-ssr-missing-article-check-404', 'missing article', 404)
assert.match(missing.html, /name="robots"[^>]*noindex/i)
console.log('PASS unpublished/missing article returns 404 noindex')
