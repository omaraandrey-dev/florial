const SITE_NAME = 'Florial'
const SITE_URL = 'https://florial-bg.com'
const SANITY_PROJECT_ID = 'bxvcy0qs'
const SANITY_API_VERSION = '2024-01-01'

type PagesContext = {
  request: Request
  next: () => Promise<Response>
}

type SeoDocument = {
  _id: string
  name?: string
  slugValue?: string
  shortDescription?: string
  description?: unknown
  priceEUR?: number
  sku?: string
  stockStatus?: string
  imageUrl?: string
  seo?: Record<string, unknown> | null
  translations?: Record<string, Record<string, any>>
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
}

function plainText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''
  return value.map((block: any) => {
    if (typeof block === 'string') return block
    if (Array.isArray(block?.children)) return block.children.map((child: any) => child?.text || '').join('')
    return ''
  }).filter(Boolean).join(' ').trim()
}

function notFoundResponse(language: string | null): Response {
  const lang = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const copy = lang === 'ru'
    ? { title: 'Страница не найдена', body: 'Запрошенная страница не существует или была перемещена.', home: 'На главную' }
    : lang === 'en'
      ? { title: 'Page not found', body: 'The requested page does not exist or has been moved.', home: 'Go to homepage' }
      : { title: 'Страницата не е намерена', body: 'Тази страница не съществува или е преместена.', home: 'Към началната страница' }

  const html = '<!doctype html>' +
    '<html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + copy.title + ' | ' + SITE_NAME + '</title>' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta name="description" content="' + escapeHtml(copy.body) + '">' +
    '<meta property="og:title" content="' + copy.title + ' | ' + SITE_NAME + '">' +
    '<meta property="og:description" content="' + escapeHtml(copy.body) + '">' +
    '<meta property="og:image" content="https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '</head><body style="margin:0;font-family:Arial,sans-serif;background:#f7f8f1;color:#263323">' +
    '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center">' +
    '<section style="max-width:560px;background:#fff;border:1px solid #e5e8db;border-radius:18px;padding:40px 28px;box-shadow:0 8px 30px #26332312">' +
    '<p style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#71824f;font-weight:700">Florial</p>' +
    '<h1 style="font-size:30px;margin:12px 0">' + copy.title + '</h1>' +
    '<p style="line-height:1.65;color:#647067">' + escapeHtml(copy.body) + '</p>' +
    '<a href="/" style="display:inline-block;margin-top:16px;padding:12px 20px;background:#53643a;color:white;border-radius:9px;text-decoration:none;font-weight:700">' + copy.home + '</a>' +
    '</section></main></body></html>'

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

async function queryDocument(dataset: string, type: string, slug: string): Promise<SeoDocument | null> {
  const query = '*[_type == $type && (slug.current == $slug || slug == $slug || _id == $slug) && (!defined(isActive) || isActive != false)][0]{_id,name,"slugValue":coalesce(slug.current,slug,_id),shortDescription,description,priceEUR,sku,stockStatus,"imageUrl":coalesce(mainImage.asset->url,image.asset->url,imageUrl,externalImageUrl),seo,translations}'
  const url = new URL('https://' + SANITY_PROJECT_ID + '.api.sanity.io/v' + SANITY_API_VERSION + '/data/query/' + dataset)
  url.searchParams.set('query', query)
  url.searchParams.set('$type', JSON.stringify(type))
  url.searchParams.set('$slug', JSON.stringify(slug))

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Sanity lookup failed: ' + response.status)
  const body = (await response.json()) as { result?: SeoDocument | null }
  return body.result || null
}

function hasTranslation(doc: SeoDocument, type: string, language: string): boolean {
  if (language === 'bg') return true
  const translated = doc.translations?.[language]
  if (!translated?.name) return false
  if (type === 'category') return Boolean(translated.description)
  if (type === 'product') {
    return Boolean(translated.shortDescription && translated.seo?.metaTitle && translated.seo?.metaDescription)
  }
  return Boolean(translated.seo?.metaTitle && translated.seo?.metaDescription)
}

function setMetaTag(html: string, attribute: string, name: string, content: string): string {
  let found = false
  const next = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (tag.includes(attribute + '="' + name + '"') || tag.includes(attribute + "='" + name + "'")) {
      found = true
      return '<meta ' + attribute + '="' + name + '" content="' + escapeHtml(content) + '" />'
    }
    return tag
  })
  if (found) return next
  return next.replace(/<\/head>/i, '<meta ' + attribute + '="' + name + '" content="' + escapeHtml(content) + '" />\n</head>')
}

function setCanonical(html: string, canonical: string): string {
  const tag = '<link rel="canonical" href="' + escapeHtml(canonical) + '" />'
  if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag)
  }
  return html.replace(/<\/head>/i, tag + '\n</head>')
}

function setPageHead(
  sourceHtml: string,
  options: {
    language: string
    title: string
    description: string
    canonical: string
    image?: string
    noIndex?: boolean
    alternates?: Record<string, string>
    structuredData?: Array<{ id: string; data: Record<string, unknown> }>
    pageType?: string
  },
): string {
  let html = sourceHtml
  html = html.replace(/<html\b[^>]*>/i, (tag) => {
    if (/\blang=["'][^"']*["']/i.test(tag)) return tag.replace(/\blang=["'][^"']*["']/i, 'lang="' + options.language + '"')
    return tag.replace(/>$/, ' lang="' + options.language + '">')
  })
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(options.title) + '</title>')
  html = setMetaTag(html, 'name', 'description', options.description)
  html = setMetaTag(html, 'name', 'robots', options.noIndex ? 'noindex, nofollow' : 'index, follow')
  html = setMetaTag(html, 'property', 'og:title', options.title)
  html = setMetaTag(html, 'property', 'og:description', options.description)
  html = setMetaTag(html, 'property', 'og:type', options.pageType || 'website')
  html = setMetaTag(html, 'property', 'og:url', options.canonical)
  html = setMetaTag(html, 'property', 'og:locale', options.language === 'ru' ? 'ru_RU' : options.language === 'en' ? 'en_US' : 'bg_BG')
  html = setMetaTag(html, 'property', 'og:image', options.image || 'https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png')
  html = setMetaTag(html, 'property', 'og:image:alt', options.title)
  html = setMetaTag(html, 'name', 'twitter:card', 'summary_large_image')
  html = setMetaTag(html, 'name', 'twitter:image', options.image || 'https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png')
  html = setMetaTag(html, 'name', 'twitter:title', options.title)
  html = setMetaTag(html, 'name', 'twitter:description', options.description)
  html = setCanonical(html, options.canonical)
  html = html.replace(/<link\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=)[^>]*>/gi, '')
  html = html.replace(/<script\b(?=[^>]*data-florial-jsonld=)[^>]*>[\s\S]*?<\/script>/gi, '')

  const additions: string[] = []
  Object.entries(options.alternates || {}).forEach(([language, href]) => {
    additions.push('<link rel="alternate" hreflang="' + escapeHtml(language) + '" href="' + escapeHtml(href) + '" />')
  })
  ;(options.structuredData || []).forEach((entry) => {
    const json = JSON.stringify(entry.data).replace(/</g, '\\u003c')
    additions.push('<script type="application/ld+json" data-florial-jsonld="' + escapeHtml(entry.id) + '">' + json + '</script>')
  })
  if (additions.length) html = html.replace(/<\/head>/i, additions.join('\n') + '\n</head>')
  return html
}

function renderRoot(html: string, body: string): string {
  return html.replace(/<div id="root"><\/div>/i, '<div id="root">' + body + '</div>')
}

async function transformHtmlResponse(response: Response, transform: (html: string) => string): Promise<Response> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') || response.status !== 200) return response
  const html = transform(await response.text())
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.delete('content-encoding')
  headers.delete('etag')
  headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600')
  return new Response(html, { status: response.status, statusText: response.statusText, headers })
}

function staticPageMetadata(path: string, language: string) {
  if (path === '/contacts') {
    if (language === 'ru') return {
      title: 'Контакты Florial — садовые центры в Несебре и Равде',
      description: 'Адреса и контакты садовых центров Florial в Несебре и Равде, Болгария. Растения, оборудование для полива и услуги по озеленению.',
      body: '<main><h1>Контакты Florial</h1><p>Свяжитесь с нами по вопросам растений, оборудования для автоматического полива и ландшафтных услуг в Болгарии.</p></main>',
    }
    if (language === 'en') return {
      title: 'Contact Florial — Garden Centres in Nessebar & Ravda',
      description: 'Find Florial garden centre locations in Nessebar and Ravda, Bulgaria. Contact us about plants, irrigation equipment and landscaping services.',
      body: '<main><h1>Contact Florial</h1><p>Contact us about plants, automatic irrigation equipment and landscaping services in Bulgaria.</p></main>',
    }
    return {
      title: 'Контакти Florial — градински центрове в Несебър и Равда',
      description: 'Адреси и контакти на градинските центрове Florial в Несебър и Равда. Растения, оборудване за напояване и услуги по озеленяване.',
      body: '<main><h1>Контакти Florial</h1><p>Свържете се с нас за растения, оборудване за автоматично напояване и услуги по озеленяване в България.</p></main>',
    }
  }
  if (language === 'ru') return {
    title: 'Florial — садовый центр и магазин систем автополива в Болгарии',
    description: 'Растения, оборудование для автоматического полива, ландшафтный дизайн и озеленение в Несебре, Равде, Солнечном Береге и Бургасе.',
    body: '<main><h1>Florial — садовый центр и магазин автополива</h1><p>Растения, оборудование для автоматического полива и услуги по озеленению в Болгарии.</p></main>',
  }
  if (language === 'en') return {
    title: 'Florial — Garden Centre & Irrigation Shop in Bulgaria',
    description: 'Plants, automatic irrigation equipment, landscape design and gardening services in Nessebar, Ravda, Sunny Beach and Burgas.',
    body: '<main><h1>Florial — Garden Centre & Irrigation Shop</h1><p>Plants, automatic irrigation equipment, landscape design and gardening services in Bulgaria.</p></main>',
  }
  return {
    title: 'Florial — градински център и системи за напояване',
    description: 'Растения, оборудване за автоматично напояване, ландшафтен дизайн и озеленяване в Несебър, Равда, Слънчев бряг и Бургас.',
    body: '<main><h1>Градински център Флориал</h1><p>Растения, оборудване за автоматично напояване, ландшафтен дизайн и озеленяване в България.</p></main>',
  }
}

function localizedRouteUrl(path: string, language: string): string {
  return SITE_URL + path + (language === 'ru' || language === 'en' ? '?lang=' + language : '')
}

function documentBody(doc: SeoDocument, type: string, name: string, description: string, language: string): string {
  const image = doc.imageUrl
    ? '<img src="' + escapeHtml(doc.imageUrl) + '" alt="' + escapeHtml(name) + '" style="max-width:100%;height:auto;max-height:360px;object-fit:contain" />'
    : ''
  let extra = ''
  if (type === 'product') {
    const price = typeof doc.priceEUR === 'number' && doc.priceEUR > 0
      ? '<p><strong>' + (language === 'ru' ? 'Цена' : language === 'en' ? 'Price' : 'Цена') + ': ' + doc.priceEUR.toFixed(2) + ' EUR</strong></p>'
      : ''
    const sku = doc.sku ? '<p>SKU: ' + escapeHtml(doc.sku) + '</p>' : ''
    const stockLabel = doc.stockStatus === 'inStock'
      ? (language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност')
      : doc.stockStatus === 'outOfStock'
        ? (language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Изчерпан')
        : (language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка')
    extra = price + sku + '<p>' + stockLabel + '</p>'
  }
  return '<main style="max-width:1100px;margin:0 auto;padding:24px;color:#263323;font-family:Arial,sans-serif">' +
    '<h1>' + escapeHtml(name) + '</h1>' + image +
    (description ? '<p style="line-height:1.7">' + escapeHtml(description) + '</p>' : '') +
    extra + '<p><a href="/">Florial</a></p></main>'
}

function makeBreadcrumb(path: string, name: string, language: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало', item: localizedRouteUrl('/', language) },
      { '@type': 'ListItem', position: 2, name, item: localizedRouteUrl(path, language) },
    ],
  }
}

function makeProductJsonLd(doc: SeoDocument, name: string, description: string, url: string): Record<string, unknown> {
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    priceCurrency: 'EUR',
    url,
    itemCondition: 'https://schema.org/NewCondition',
  }
  if (typeof doc.priceEUR === 'number' && doc.priceEUR > 0) offer.price = doc.priceEUR.toFixed(2)
  if (doc.stockStatus === 'inStock') offer.availability = 'https://schema.org/InStock'
  if (doc.stockStatus === 'outOfStock') offer.availability = 'https://schema.org/OutOfStock'
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    ...(doc.imageUrl ? { image: [doc.imageUrl] } : {}),
    ...(doc.sku ? { sku: doc.sku } : {}),
    offers: offer,
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const languageParam = url.searchParams.get('lang')
  const language = languageParam === 'ru' || languageParam === 'en' ? languageParam : 'bg'

  if (
    path.startsWith('/api/') ||
    path === '/sitemap.xml' ||
    path === '/robots.txt' ||
    path === '/favicon.png' ||
    path === '/index.html'
  ) return context.next()

  if (path === '/' || path === '/contacts') {
    const meta = staticPageMetadata(path, language)
    const canonical = localizedRouteUrl(path === '/' ? '/' : '/contacts', language)
    const alternates = {
      bg: SITE_URL + (path === '/' ? '/' : '/contacts'),
      ru: SITE_URL + (path === '/' ? '/' : '/contacts') + '?lang=ru',
      en: SITE_URL + (path === '/' ? '/' : '/contacts') + '?lang=en',
      'x-default': SITE_URL + (path === '/' ? '/' : '/contacts'),
    }
    return transformHtmlResponse(await context.next(), (html) => {
      const root = renderRoot(html, meta.body)
      return setPageHead(root, {
        language,
        title: meta.title,
        description: meta.description,
        canonical,
        alternates,
        pageType: 'website',
      })
    })
  }

  if (path === '/cart' || path === '/search') {
    const meta = path === '/cart'
      ? language === 'ru'
        ? { title: 'Корзина | Florial', description: 'Содержимое корзины интернет-магазина Florial.' }
        : language === 'en'
          ? { title: 'Shopping Cart | Florial', description: 'Your Florial online shop shopping cart.' }
          : { title: 'Количка | Florial', description: 'Съдържание на количката в онлайн магазина Florial.' }
      : language === 'ru'
        ? { title: 'Поиск товаров | Florial', description: 'Поиск оборудования для полива и растений в магазине Florial.' }
        : language === 'en'
          ? { title: 'Product Search | Florial', description: 'Search irrigation equipment and plants in the Florial shop.' }
          : { title: 'Търсене на продукти | Florial', description: 'Търсете оборудване за напояване и растения в магазина Florial.' }
    return transformHtmlResponse(await context.next(), (html) => setPageHead(html, {
      language,
      title: meta.title,
      description: meta.description,
      canonical: SITE_URL + path,
      noIndex: true,
      pageType: 'website',
    }))
  }

  const parts = path.split('/').filter(Boolean)
  const route = parts[0]
  const rawSlug = parts[1]
  let slug: string | null = null
  try {
    slug = rawSlug ? decodeURIComponent(rawSlug) : null
  } catch {
    return notFoundResponse(language)
  }

  if (
    parts.length === 2 &&
    slug &&
    (route === 'product' || route === 'products' || route === 'category' || route === 'services')
  ) {
    try {
      let doc: SeoDocument | null = null
      let type = route === 'services' ? 'service' : route === 'category' ? 'category' : 'product'
      if (route === 'services') {
        doc = await queryDocument('production', type, slug)
      } else if (route === 'category') {
        doc = await queryDocument('production', type, slug) || await queryDocument('plants', type, slug)
      } else {
        doc = await queryDocument('production', type, slug) || await queryDocument('plants', type, slug)
      }
      if (!doc) return notFoundResponse(language)

      const localized = language === 'bg' ? null : doc.translations?.[language]
      const translatedIsComplete = hasTranslation(doc, type, language)
      const name = String(localized?.name || doc.name || slug)
      const translatedDescription = localized?.shortDescription || localized?.description
      const description = plainText(translatedDescription || doc.shortDescription || doc.description)
      const seo = (language === 'bg' ? doc.seo : localized?.seo) as Record<string, any> | null | undefined
      const title = String(seo?.metaTitle || seo?.title || (name + ' | Florial'))
      const metaDescription = String(seo?.metaDescription || seo?.description || description || (name + ' — Florial'))
      const noIndex = seo?.noIndex === true || (language !== 'bg' && !translatedIsComplete)
      const alternates: Record<string, string> = {}
      if (hasTranslation(doc, type, 'bg')) alternates.bg = localizedRouteUrl('/' + route + '/' + encodeURIComponent(doc.slugValue || slug), 'bg')
      if (hasTranslation(doc, type, 'ru')) alternates.ru = localizedRouteUrl('/' + route + '/' + encodeURIComponent(doc.slugValue || slug), 'ru')
      if (hasTranslation(doc, type, 'en')) alternates.en = localizedRouteUrl('/' + route + '/' + encodeURIComponent(doc.slugValue || slug), 'en')
      alternates['x-default'] = localizedRouteUrl('/' + route + '/' + encodeURIComponent(doc.slugValue || slug), 'bg')

      const canonicalRoute = route === 'products' ? 'product' : route
      const pagePath = '/' + canonicalRoute + '/' + encodeURIComponent(doc.slugValue || slug)
      const canonicalUrl = localizedRouteUrl(pagePath, noIndex ? 'bg' : language)
      const structuredData: Array<{ id: string; data: Record<string, unknown> }> = [
        { id: 'breadcrumbs', data: makeBreadcrumb(pagePath, name, noIndex ? 'bg' : language) },
      ]
      if (type === 'product') {
        structuredData.push({ id: 'product', data: makeProductJsonLd(doc, name, metaDescription, canonicalUrl) })
      }
      const body = documentBody(doc, type, name, description, language)
      return transformHtmlResponse(await context.next(), (html) => {
        const root = renderRoot(html, body)
        return setPageHead(root, {
          language,
          title,
          description: metaDescription,
          canonical: canonicalUrl,
          image: doc?.imageUrl,
          noIndex,
          alternates,
          structuredData,
          pageType: type === 'product' ? 'product' : 'website',
        })
      })
    } catch {
      // Keep the storefront available if the public Sanity API is temporarily unavailable.
      return context.next()
    }
  }

  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  const lastSegment = path.split('/').pop() || ''
  const looksLikeFile = /\.[a-zA-Z0-9]{1,8}$/.test(lastSegment)
  if (looksLikeFile) return contentType.includes('text/html') ? notFoundResponse(language) : response
  return notFoundResponse(language)
}
