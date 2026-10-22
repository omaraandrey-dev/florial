const SITE_NAME = 'Florial'
const SITE_URL = 'https://florial-bg.com'
const SANITY_PROJECT_ID = 'bxvcy0qs'
const SANITY_API_VERSION = '2024-01-01'

type PagesContext = {
  request: Request
  next: () => Promise<Response>
}

function notFoundResponse(language: string | null): Response {
  const lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const copy = lang === 'ru'
    ? { title: 'Страница не найдена', body: 'Запрошенная страница не существует или была перемещена.', home: 'На главную' }
    : lang === 'en'
      ? { title: 'Page not found', body: 'The requested page does not exist or has been moved.', home: 'Go to homepage' }
      : { title: 'Страницата не е намерена', body: 'Тази страница не съществува или е преместена.', home: 'Към началната страница' }

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${copy.title} | ${SITE_NAME}</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="${copy.body}">
  <link rel="canonical" href="${SITE_URL}/404">
  <meta name="theme-color" content="#53643a">
</head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f7f8f1;color:#263323">
  <main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center">
    <section style="max-width:560px;background:#fff;border:1px solid #e5e8db;border-radius:18px;padding:40px 28px;box-shadow:0 8px 30px #26332312">
      <p style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#71824f;font-weight:700">${SITE_NAME}</p>
      <h1 style="font-size:30px;margin:12px 0">${copy.title}</h1>
      <p style="line-height:1.65;color:#647067">${copy.body}</p>
      <a href="/" style="display:inline-block;margin-top:16px;padding:12px 20px;background:#53643a;color:white;border-radius:9px;text-decoration:none;font-weight:700">${copy.home}</a>
    </section>
  </main>
</body>
</html>`

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function documentExists(dataset: string, type: string, slug: string): Promise<boolean> {
  const query = '*[_type == $type && (slug.current == $slug || slug == $slug || _id == $slug) && (!defined(isActive) || isActive != false)][0]._id'
  const url = new URL(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${dataset}`)
  url.searchParams.set('query', query)
  url.searchParams.set('$type', JSON.stringify(type))
  url.searchParams.set('$slug', JSON.stringify(slug))

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Sanity lookup failed: ${response.status}`)
  const result = (await response.json()) as { result?: string | null }
  return Boolean(result.result)
}

function decodeSlug(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const locale = url.searchParams.get('lang')

  // API and known public/static endpoints must keep their own handlers.
  if (
    path.startsWith('/api/') ||
    path === '/sitemap.xml' ||
    path === '/robots.txt' ||
    path === '/favicon.png' ||
    path === '/index.html'
  ) {
    return context.next()
  }

  if (path === '/' || path === '/contacts' || path === '/cart' || path === '/search') {
    return context.next()
  }

  const parts = path.split('/').filter(Boolean)
  const route = parts[0]
  const rawSlug = parts[1]
  const slug = rawSlug ? decodeSlug(rawSlug) : null

  // Validate dynamic content URLs against the same public Sanity datasets used by the shop.
  if (
    parts.length === 2 &&
    slug &&
    (route === 'product' || route === 'products' || route === 'category' || route === 'services')
  ) {
    try {
      let exists = false
      if (route === 'services') {
        exists = await documentExists('production', 'service', slug)
      } else if (route === 'category') {
        const matches = await Promise.all([
          documentExists('production', 'category', slug),
          documentExists('plants', 'category', slug),
        ])
        exists = matches.some(Boolean)
      } else {
        const matches = await Promise.all([
          documentExists('production', 'product', slug),
          documentExists('plants', 'product', slug),
        ])
        exists = matches.some(Boolean)
      }

      return exists ? context.next() : notFoundResponse(locale)
    } catch {
      // Keep the storefront available if the public Sanity API is temporarily unavailable.
      return context.next()
    }
  }

  // Let existing assets pass through, but do not let the SPA rewrite turn a missing file into HTTP 200.
  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  const lastSegment = path.split('/').pop() || ''
  const looksLikeFile = /\.[a-zA-Z0-9]{1,8}$/.test(lastSegment)
  if (looksLikeFile) {
    return contentType.includes('text/html') ? notFoundResponse(locale) : response
  }

  return notFoundResponse(locale)
}
