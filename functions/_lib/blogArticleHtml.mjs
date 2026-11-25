const SITE_URL = 'https://florial-bg.com'
const SANITY_IMAGE_PREFIX = '/images/bxvcy0qs/production/'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function textValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugValue(post) {
  return textValue(typeof post?.slug === 'string' ? post.slug : post?.slug?.current) || textValue(post?._id)
}

function localizedHref(path, language) {
  const url = new URL(path, SITE_URL)
  url.searchParams.delete('lang')
  if (language !== 'bg') url.searchParams.set('lang', language)
  return url.pathname + url.search + url.hash
}

function safeHref(value, language) {
  const href = textValue(value)
  if (!href || href.startsWith('//')) return ''
  if (href.startsWith('/')) return localizedHref(href, language)
  if (href.startsWith('#') || href.startsWith('?')) return href
  try {
    const url = new URL(href)
    if (url.username || url.password) return ''
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') return url.toString()
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    if (url.hostname === 'florial-bg.com' || url.hostname === 'www.florial-bg.com') {
      return localizedHref(url.pathname + url.search + url.hash, language)
    }
    return url.toString()
  } catch {
    return ''
  }
}

function safeImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cdn.sanity.io' &&
      url.pathname.startsWith(SANITY_IMAGE_PREFIX) ? url.toString() : ''
  } catch {
    return ''
  }
}

function responsiveImage(value, alt, sizes, className, loading = 'lazy', priority = false) {
  const sourceUrl = safeImageUrl(value)
  if (!sourceUrl) return ''
  let src = sourceUrl
  let srcSet = ''
  let dimensions = ''
  const source = new URL(sourceUrl)
  const match = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
  if (match) {
    const sourceWidth = Number(match[1])
    const sourceHeight = Number(match[2])
    const widths = [160, 240, 320, 480, 640, 800, 960, 1200, 1600]
      .map((width) => Math.min(width, sourceWidth))
      .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
      .sort((a, b) => a - b)
    const build = (width) => {
      const image = new URL(sourceUrl)
      image.searchParams.set('w', String(Math.min(width, sourceWidth)))
      image.searchParams.set('fit', 'max')
      image.searchParams.set('auto', 'format')
      image.searchParams.set('q', '72')
      return image.toString()
    }
    src = build(Math.min(960, sourceWidth))
    srcSet = widths.map((width) => build(width) + ' ' + width + 'w').join(', ')
    dimensions = ' width="' + sourceWidth + '" height="' + sourceHeight + '"'
  }
  return '<img src="' + escapeHtml(src) + '"' +
    (srcSet ? ' srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes || '100vw') + '"' : '') +
    dimensions + ' alt="' + escapeHtml(alt || '') + '" loading="' + loading + '"' +
    (priority ? ' fetchpriority="high"' : '') +
    ' decoding="async"' + (className ? ' class="' + className + '"' : '') + ' />'
}

function localizedTranslation(post, language) {
  const selected = post?.translations?.[language] || {}
  const bg = post?.translations?.bg || {}
  return {
    ...bg,
    ...selected,
    title: textValue(selected.title || bg.title),
    shortDescription: textValue(selected.shortDescription || bg.shortDescription),
    body: Array.isArray(selected.body) && selected.body.length ? selected.body : (Array.isArray(bg.body) ? bg.body : []),
    seoTitle: textValue(selected.seoTitle || bg.seoTitle),
    seoDescription: textValue(selected.seoDescription || bg.seoDescription || selected.shortDescription || bg.shortDescription),
    coverAlt: textValue(selected.coverAlt || bg.coverAlt || post?.cover?.alt || selected.title || bg.title),
  }
}

function localizedImageAlt(image, language, fallback = '') {
  const localized = language === 'ru' ? image?.altRu : language === 'en' ? image?.altEn : image?.alt
  return textValue(localized || image?.alt || image?.altRu || image?.altEn || fallback)
}

function formatDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

function blockText(block) {
  return (block?.children || []).map((child) => child?.text || '').join(' ').trim()
}

function isContactOrLegacyLink(value) {
  if (!value) return false
  return /(?:drop\.od\.ua|mailto:|tel:|wa\.me\/|@gmail\.com|@outlook\.|@yahoo\.|\+359[\s()-]*\d|\+380[\s()-]*\d)/i.test(value)
}

function isContactCta(block) {
  const text = blockText(block)
  if (!text) return false
  const hasContactLink = (block.markDefs || []).some((mark) => isContactOrLegacyLink(mark.href))
  const hasContactDetails = isContactOrLegacyLink(text)
  const isCta = /(?:свържете се с нас|свяжитесь с нами|contact us|get in touch|направете запитване|send us a message|обадете се|позвоните|call us|пишете ни|напишете ни|написать нам)/i.test(text)
  return hasContactDetails || (hasContactLink && isCta)
}

function renderInline(block, language) {
  const definitions = new Map((block.markDefs || []).map((mark) => [mark._key || '', mark]))
  return (block.children || []).map((child) => {
    let content = escapeHtml(child?.text || '')
    for (const mark of child?.marks || []) {
      if (mark === 'strong') content = '<strong>' + content + '</strong>'
      else if (mark === 'em') content = '<em>' + content + '</em>'
      else if (mark === 'underline') content = '<u>' + content + '</u>'
      else {
        const definition = definitions.get(mark)
        const href = safeHref(definition?.href, language)
        if (definition?._type === 'link' && href && !isContactOrLegacyLink(href)) {
          content = '<a href="' + escapeHtml(href) + '"' +
            (definition.blank ? ' target="_blank" rel="noopener noreferrer"' : '') +
            ' class="text-emerald-800 underline underline-offset-4">' + content + '</a>'
        }
      }
    }
    return content
  }).join('')
}

function youtubeEmbedId(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || ''
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) return ''
    if (url.pathname === '/watch') return url.searchParams.get('v') || ''
    return url.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1] || ''
  } catch {
    return ''
  }
}

function renderBodyBlock(block, language, index) {
  if (!block || isContactCta(block)) return ''
  const key = escapeHtml(block._key || index)
  if (block._type === 'youtubeEmbed') {
    const id = youtubeEmbedId(block.url)
    if (!id) return ''
    return '<figure data-florial-blog-youtube="' + key + '" class="my-8">' +
      '<div class="aspect-video overflow-hidden rounded-xl bg-slate-100">' +
      '<iframe src="https://www.youtube-nocookie.com/embed/' + escapeHtml(id) + '" title="' + escapeHtml(block.title || 'Florial video') +
      '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" class="h-full w-full"></iframe>' +
      '</div>' + (block.caption ? '<figcaption class="mt-2 text-center text-sm text-slate-500">' + escapeHtml(block.caption) + '</figcaption>' : '') +
      '</figure>'
  }
  if (block._type === 'image') {
    const image = responsiveImage(block.assetUrl, localizedImageAlt(block, language), '(min-width: 896px) 864px, calc(100vw - 2rem)', 'mx-auto max-h-[680px] w-auto max-w-full rounded-xl object-contain')
    return image ? '<figure data-florial-blog-inline-image="' + key + '" class="my-8">' + image +
      (block.caption ? '<figcaption class="mt-2 text-center text-sm text-slate-500">' + escapeHtml(block.caption) + '</figcaption>' : '') +
      '</figure>' : ''
  }
  const text = renderInline(block, language)
  if (!text) return ''
  if (block.listItem) {
    const tag = block.listItem === 'number' ? 'ol' : 'ul'
    const listClass = block.listItem === 'number' ? 'list-decimal' : 'list-disc'
    return '<div data-florial-blog-list="' + key + '" class="pl-5"><' + tag + ' class="' + listClass + '"><li>' + text + '</li></' + tag + '></div>'
  }
  if (block.style === 'h2') return '<h2 data-florial-blog-heading="' + key + '" class="pt-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">' + text + '</h2>'
  if (block.style === 'h3') return '<h3 data-florial-blog-heading="' + key + '" class="pt-4 text-xl font-bold text-slate-900 md:text-2xl">' + text + '</h3>'
  if (block.style === 'h4') return '<h4 data-florial-blog-heading="' + key + '" class="pt-3 text-lg font-bold text-slate-900">' + text + '</h4>'
  if (block.style === 'blockquote') return '<blockquote data-florial-blog-quote="' + key + '" class="border-l-4 border-[#A5B483] pl-5 italic text-slate-600">' + text + '</blockquote>'
  return '<p data-florial-blog-paragraph="' + key + '">' + text + '</p>'
}

function renderGallery(images, language, fallback) {
  const items = Array.isArray(images) ? images : []
  const rendered = items.map((image, index) => {
    const url = image?.asset?.url
    const img = responsiveImage(url, localizedImageAlt(image, language, fallback), '(min-width: 640px) 50vw, 100vw', 'w-full rounded-xl object-cover')
    if (!img) return ''
    return '<figure data-florial-blog-gallery-image="' + index + '">' + img +
      (image.caption ? '<figcaption class="mt-2 text-sm text-slate-500">' + escapeHtml(image.caption) + '</figcaption>' : '') +
      '</figure>'
  }).filter(Boolean)
  return rendered.length ? '<div data-florial-blog-gallery="true" class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">' + rendered.join('') + '</div>' : ''
}

function renderRelated(posts, language) {
  const items = Array.isArray(posts) ? posts : []
  if (!items.length) return ''
  const title = language === 'ru' ? 'Читайте также' : language === 'en' ? 'Related articles' : 'Още полезни статии'
  const cards = items.map((post) => {
    const slug = slugValue(post)
    const content = localizedTranslation(post, language)
    if (!slug || !content.title) return ''
    const href = localizedHref('/blog/' + encodeURIComponent(slug), language)
    const image = responsiveImage(post?.cover?.asset?.url, content.coverAlt, '(min-width: 896px) 288px, (min-width: 640px) 33vw, calc(100vw - 2rem)', 'h-36 w-full object-cover')
    return '<article data-florial-blog-related="' + escapeHtml(slug) + '" class="overflow-hidden rounded-xl border border-[#E1E6D7] bg-white transition hover:shadow-sm">' +
      '<a href="' + escapeHtml(href) + '" class="block h-full no-underline">' +
      (image || '<div class="flex h-36 items-center justify-center bg-[#E9EDDB] text-3xl" aria-hidden="true">🌿</div>') +
      '<div class="p-4"><h3 class="text-base font-bold leading-snug text-slate-900">' + escapeHtml(content.title) + '</h3>' +
      '<span class="mt-3 inline-flex text-sm font-semibold text-[#647746]">' +
      (language === 'ru' ? 'Читать статью' : language === 'en' ? 'Read article' : 'Прочетете статията') + ' →</span></div></a></article>'
  }).filter(Boolean)
  return cards.length ? '<section data-florial-blog-related-section="true" class="mt-14 border-t border-[#E1E6D7] pt-8" aria-labelledby="related-blog-title">' +
    '<h2 id="related-blog-title" class="mb-5 text-2xl font-bold tracking-tight text-slate-900">' + title + '</h2>' +
    '<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">' + cards.join('') + '</div></section>' : ''
}

export function getBlogArticleMetadata(post, language) {
  const slug = slugValue(post)
  const content = localizedTranslation(post, language)
  const path = '/blog/' + encodeURIComponent(slug)
  const canonical = SITE_URL + localizedHref(path, language)
  const alternates = {
    bg: SITE_URL + localizedHref(path, 'bg'),
    ru: SITE_URL + localizedHref(path, 'ru'),
    en: SITE_URL + localizedHref(path, 'en'),
    'x-default': SITE_URL + localizedHref(path, 'bg'),
  }
  return {
    title: content.seoTitle || (content.title + ' | Florial'),
    description: content.seoDescription || content.shortDescription || content.title,
    canonical,
    alternates,
    image: safeImageUrl(post?.cover?.asset?.url) || undefined,
  }
}

export function buildBlogArticleStructuredData(post, language) {
  const slug = slugValue(post)
  const content = localizedTranslation(post, language)
  const articleUrl = SITE_URL + localizedHref('/blog/' + encodeURIComponent(slug), language)
  const homeLabel = language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'
  const blogLabel = language === 'ru' ? 'Блог' : language === 'en' ? 'Blog' : 'Блог'
  const image = safeImageUrl(post?.cover?.asset?.url)
  return [
    {
      id: 'blog-posting',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: content.title,
        description: content.seoDescription || content.shortDescription || content.title,
        url: articleUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
        ...(post?.publishedAt ? { datePublished: post.publishedAt } : {}),
        ...(post?._updatedAt ? { dateModified: post._updatedAt } : {}),
        ...(image ? { image: [image] } : {}),
        author: { '@id': SITE_URL + '/#organization' },
        publisher: { '@id': SITE_URL + '/#organization' },
        inLanguage: language,
      },
    },
    {
      id: 'breadcrumbs',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: homeLabel, item: SITE_URL + localizedHref('/', language) },
          { '@type': 'ListItem', position: 2, name: blogLabel, item: SITE_URL + localizedHref('/blog', language) },
          { '@type': 'ListItem', position: 3, name: content.title, item: articleUrl },
        ],
      },
    },
  ]
}

export function renderBlogArticleHtml({ post, relatedPosts = [], language }) {
  const content = localizedTranslation(post, language)
  const slug = slugValue(post)
  const title = escapeHtml(content.title)
  const description = escapeHtml(content.shortDescription)
  const date = formatDate(post?.publishedAt, language)
  const cover = responsiveImage(post?.cover?.asset?.url, content.coverAlt, '(min-width: 896px) 864px, calc(100vw - 2rem)', 'max-h-[620px] w-full rounded-2xl object-cover', 'eager', true)
  const body = (content.body || []).map((block, index) => renderBodyBlock(block, language, index)).join('')
  const gallery = renderGallery(post?.gallery, language, content.coverAlt)
  const back = language === 'ru' ? 'Обратно к блогу' : language === 'en' ? 'Back to the blog' : 'Обратно към блога'
  const home = language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'
  const blog = language === 'ru' ? 'Блог' : language === 'en' ? 'Blog' : 'Блог'
  const coverHtml = cover ? '<figure class="mb-9" data-florial-blog-cover="true">' + cover +
    (post?.cover?.caption ? '<figcaption class="mt-2 text-center text-sm text-slate-500">' + escapeHtml(post.cover.caption) + '</figcaption>' : '') +
    '</figure>' : ''
  const renderedRelated = renderRelated(relatedPosts, language)
  const articlePath = '/blog/' + encodeURIComponent(slug)
  const articleBody = '<main data-florial-blog-article="v1" data-florial-blog-slug="' + escapeHtml(slug) +
    '" data-florial-blog-block-count="' + (content.body || []).length + '" data-florial-blog-related-count="' + (relatedPosts || []).length +
    '" class="mx-auto w-full max-w-4xl flex-grow px-4 py-8 md:py-12">' +
    '<nav class="mb-6 text-sm text-slate-500"><a href="' + escapeHtml(localizedHref('/', language)) + '" class="text-[#647746] no-underline">' + home +
    '</a><span class="mx-2">/</span><a href="' + escapeHtml(localizedHref('/blog', language)) + '" class="text-[#647746] no-underline">' + blog +
    '</a><span class="mx-2">/</span><span class="line-clamp-1">' + title + '</span></nav>' +
    '<article><header class="mb-8"><time datetime="' + escapeHtml(post?.publishedAt || '') + '" class="text-sm text-slate-500">' + escapeHtml(date) +
    '</time><h1 class="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">' + title + '</h1>' +
    (description ? '<p class="mt-5 text-lg leading-8 text-slate-600">' + description + '</p>' : '') +
    '</header>' + coverHtml + '<div class="blog-content space-y-5 text-base leading-8 text-slate-700">' + body + '</div>' + gallery +
    '</article>' + renderedRelated +
    '<a href="' + escapeHtml(localizedHref('/blog', language)) + '" class="mt-8 inline-flex rounded-lg border border-[#B9C79C] bg-white px-4 py-3 text-sm font-semibold text-[#53643A] no-underline hover:bg-[#F0F3E8]">← ' + back + '</a>' +
    '</main>'
  return {
    body: articleBody,
    image: safeImageUrl(post?.cover?.asset?.url) || undefined,
    structuredData: buildBlogArticleStructuredData(post, language),
  }
}

export function serializeBlogArticlePayload(post, relatedPosts, language) {
  return JSON.stringify({ slug: slugValue(post), language, post, relatedPosts }).replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}
