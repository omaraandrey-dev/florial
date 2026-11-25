const SITE_URL = 'https://florial-bg.com'

const COPY = {
  bg: {
    title: 'Блог и портфолио',
    intro: 'В блога на Florial ще откриете нашите реализирани проекти, идеи за градината и полезни практически материали за ландшафтен дизайн, автоматично напояване, рулонен тревен чим и растения. Представяме реални решения, етапи на работа и професионални съвети, които ще ви помогнат да планирате и оформите своето външно пространство.',
    directions: 'Разгледайте по направления',
    latest: 'Последна публикация',
    readMore: 'Прочетете още',
    home: 'Начало',
    publications: 'Публикации',
  },
  ru: {
    title: 'Блог и портфолио',
    intro: 'Здесь собраны проекты Florial, идеи для сада и полезные материалы о ландшафтном дизайне, автоматическом поливе, рулонном газоне и растениях. Показываем реальные решения, этапы работ и практические советы, которые помогут спланировать и обустроить ваш участок.',
    directions: 'Выберите направление',
    latest: 'Новая публикация',
    readMore: 'Подробнее',
    home: 'Главная',
    publications: 'Публикации',
  },
  en: {
    title: 'Blog and portfolio',
    intro: 'Explore Florial projects, garden inspiration and practical guides to landscape design, automatic irrigation, rolled turf and plants. Discover real-world solutions, project stages and useful advice to help you plan and improve your outdoor space.',
    directions: 'Explore by topic',
    latest: 'Latest publication',
    readMore: 'Read more',
    home: 'Home',
    publications: 'Publications',
  },
}

const DIRECTIONS = [
  {
    id: 'landscape',
    tags: ['ландшафтно проектиране', 'озеленяване'],
    slugs: ['podroben-landshaften-proekt-gradina', 'maslina-sredizemnomorie', 'landshaften-dizain-proekt-zasazhdenie', 'landshaften-proekt-zima-burgas', 'landshaften-proekt-nesebar', 'etapi-landshaften-proekt-nesebar'],
    label: { bg: 'Ландшафтен дизайн', ru: 'Ландшафтный дизайн', en: 'Landscape design' },
    description: { bg: 'Идеи, проекти и решения за градината', ru: 'Идеи, проекты и решения для сада', en: 'Garden ideas, projects and solutions' },
  },
  {
    id: 'irrigation',
    tags: ['автоматично напояване', 'автоматично поливане', 'поливни системи'],
    slugs: ['kak-raboti-avtomatichnata-polivna-sistema', 'avtomatika-za-polivane-rain-bird-kontroleri', 'polivane-na-treva-razprskvachi-dyuzhi', 'sravnenie-rotatorni-dyuzi-rain-bird-r-van-hunter-mp-rotator', 'cena-sistema-avtomatichno-napoyavane-burgas', 'etapi-montazh-avtomatichna-polivna-instalatsiya', 'rain-bird-oborudvane', 'podroben-landshaften-proekt-gradina'],
    label: { bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation' },
    description: { bg: 'Проектиране, монтаж и оборудване', ru: 'Проектирование, монтаж и оборудование', en: 'Design, installation and equipment' },
  },
  {
    id: 'lawn',
    tags: ['тревни площи'],
    slugs: ['prodavane-traven-chim', 'kupete-travna-plosht'],
    label: { bg: 'Рулонен тревен чим', ru: 'Рулонный газон', en: 'Rolled turf' },
    description: { bg: 'Подготовка, избор и полагане на тревен чим', ru: 'Подготовка участка, выбор и укладка газона', en: 'Lawn preparation, selection and installation' },
  },
  {
    id: 'planting',
    tags: ['растения'],
    slugs: ['rozi-sympathy', 'nov-vnos-palmi-2025', 'maslina-sredizemnomorie', 'kiparis-totem', 'podroben-landshaften-proekt-gradina'],
    label: { bg: 'Озеленяване и засаждане', ru: 'Озеленение и посадка', en: 'Planting and greenery' },
    description: { bg: 'Растения, дървета и професионално засаждане', ru: 'Растения, деревья и профессиональная посадка', en: 'Plants, trees and professional planting' },
  },
]

const REVIEWED_SLUGS = new Set([
  'kak-raboti-avtomatichnata-polivna-sistema',
  'avtomatika-za-polivane-rain-bird-kontroleri',
  'polivane-na-treva-razprskvachi-dyuzhi',
  'sravnenie-rotatorni-dyuzi-rain-bird-r-van-hunter-mp-rotator',
  'podroben-landshaften-proekt-gradina',
  'cena-sistema-avtomatichno-napoyavane-burgas',
  'sistema-magluvane-terasa-besedka',
  'rozi-sympathy',
  'nov-vnos-palmi-2025',
  'maslina-sredizemnomorie',
  'prodavane-traven-chim',
  'kiparis-totem',
  'kupete-travna-plosht',
  'etapi-montazh-avtomatichna-polivna-instalatsiya',
  'rain-bird-oborudvane',
  'landshaften-dizain-proekt-zasazhdenie',
  'landshaften-proekt-zima-burgas',
  'landshaften-proekt-nesebar',
  'etapi-landshaften-proekt-nesebar',
])

const TAG_TRANSLATIONS = {
  'Разпръсквачи': { bg: 'Разпръсквачи', ru: 'Дождеватели', en: 'Sprinklers' },
  'Капково напояване': { bg: 'Капково напояване', ru: 'Капельный полив', en: 'Drip irrigation' },
  'Контролери': { bg: 'Контролери', ru: 'Контроллеры', en: 'Controllers' },
  'Растения': { bg: 'Растения', ru: 'Растения', en: 'Plants' },
  'Автоматично напояване': { bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation' },
  'Поливни системи': { bg: 'Поливни системи', ru: 'Системы полива', en: 'Irrigation systems' },
  'Тревни площи': { bg: 'Тревни площи', ru: 'Газоны', en: 'Lawns' },
  'Озеленяване': { bg: 'Озеленяване', ru: 'Озеленение', en: 'Landscaping' },
  'Ландшафтно проектиране': { bg: 'Ландшафтно проектиране', ru: 'Ландшафтное проектирование', en: 'Landscape planning' },
  'Проект': { bg: 'Проект', ru: 'Проект', en: 'Project' },
  'автоматично поливане': { bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation' },
  'ротаторни дюзи': { bg: 'Ротаторни дюзи', ru: 'Роторные форсунки', en: 'Rotary nozzles' },
  'Rain Bird R-VAN': { bg: 'Rain Bird R-VAN', ru: 'Rain Bird R-VAN', en: 'Rain Bird R-VAN' },
  'Hunter MP Rotator': { bg: 'Hunter MP Rotator', ru: 'Hunter MP Rotator', en: 'Hunter MP Rotator' },
  'дюзи за тревни площи': { bg: 'Дюзи за тревни площи', ru: 'Форсунки для газона', en: 'Lawn nozzles' },
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeImageUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && url.hostname === 'cdn.sanity.io' && /^\/images\/bxvcy0qs\/production\//.test(url.pathname)) return url
  } catch {}
  return null
}

function responsiveImage(value, options = {}) {
  const source = safeImageUrl(value)
  if (!source) return ''
  const match = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
  const sourceWidth = match ? Number(match[1]) : 0
  const sourceHeight = match ? Number(match[2]) : 0
  const preferredWidth = Number(options.preferredWidth || 800)
  const quality = Number(options.quality || 68)
  const sizes = options.sizes || '100vw'
  const buildUrl = (width) => {
    const image = new URL(source)
    image.searchParams.set('w', String(sourceWidth ? Math.min(width, sourceWidth) : width))
    image.searchParams.set('fit', 'max')
    image.searchParams.set('auto', 'format')
    image.searchParams.set('q', String(quality))
    return image.toString()
  }
  const widths = [240, 320, 480, 640, 800, 960, 1200, 1600]
    .map((width) => sourceWidth ? Math.min(width, sourceWidth) : width)
    .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
    .sort((a, b) => a - b)
  const src = buildUrl(sourceWidth ? Math.min(preferredWidth, sourceWidth) : preferredWidth)
  const srcSet = widths.map((width) => buildUrl(width) + ' ' + width + 'w').join(', ')
  const alt = escapeHtml(options.alt || '')
  const className = options.className || ''
  const loading = options.loading || 'lazy'
  const priority = options.fetchPriority ? ' fetchpriority="' + escapeHtml(options.fetchPriority) + '"' : ''
  const dimensions = sourceWidth && sourceHeight ? ' width="' + sourceWidth + '" height="' + sourceHeight + '"' : ''
  return '<img src="' + escapeHtml(src) + '" srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes) + '"' +
    dimensions + ' alt="' + alt + '" loading="' + loading + '"' + priority +
    ' decoding="async"' + (className ? ' class="' + escapeHtml(className) + '"' : '') + ' />'
}

function slugOf(post) {
  return typeof post?.slug === 'string' ? post.slug : post?.slug?.current || post?._id || ''
}

function translationOf(post, language) {
  const selected = post?.translations?.[language] || post?.translations?.bg || {}
  const bg = post?.translations?.bg || {}
  return {
    title: selected.title || bg.title || '',
    shortDescription: selected.shortDescription || bg.shortDescription || '',
    coverAlt: selected.coverAlt || bg.coverAlt || post?.cover?.alt || selected.title || bg.title || '',
  }
}

function normalizedTag(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

function hasAnyTag(post, tags) {
  const postTags = (post.tags || []).map(normalizedTag)
  return tags.some((tag) => postTags.includes(normalizedTag(tag)))
}

function matchesDirection(post, direction) {
  const slug = slugOf(post)
  return REVIEWED_SLUGS.has(slug)
    ? direction.slugs.includes(slug)
    : hasAnyTag(post, direction.tags)
}

function localizedTag(value, language) {
  const normalized = normalizedTag(value)
  const match = Object.entries(TAG_TRANSLATIONS).find(([source]) => source.toLocaleLowerCase() === normalized)
  return match?.[1]?.[language] || value
}

function formatDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function localizedHref(path, language) {
  return path + (language === 'bg' ? '' : '?lang=' + language)
}

function renderDirection(direction, posts, language) {
  const matching = posts.filter((post) => matchesDirection(post, direction))
  const imagePost = matching.find((post) => safeImageUrl(post.cover?.asset?.url))
  const image = imagePost
    ? responsiveImage(imagePost.cover.asset.url, {
        alt: '',
        sizes: '(min-width: 1280px) 308px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 45vw',
        preferredWidth: 640,
        quality: 68,
        loading: 'lazy',
        className: 'absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-105',
      })
    : ''
  return '<button type="button" aria-pressed="false" data-florial-blog-direction="' + escapeHtml(direction.id) + '" class="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-transparent bg-slate-900 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#647746] md:min-h-52">' +
    (image ? image : '<span class="absolute inset-0 -z-20 bg-[#647746]" aria-hidden="true"></span>') +
    '<span aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-black/5"></span>' +
    '<span class="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800">' + matching.length + '</span>' +
    '<span class="flex min-h-40 flex-col justify-end p-3 text-white md:min-h-52 md:p-5">' +
    '<span class="text-sm font-bold leading-snug md:text-lg">' + escapeHtml(direction.label[language]) + '</span>' +
    '<span class="mt-1 hidden text-xs leading-5 text-white/85 md:block">' + escapeHtml(direction.description[language]) + '</span>' +
    '</span></button>'
}

function renderPost(post, index, language, copy) {
  const slug = slugOf(post)
  if (!slug) return ''
  const content = translationOf(post, language)
  const coverUrl = post.cover?.asset?.url
  const image = safeImageUrl(coverUrl)
    ? responsiveImage(coverUrl, {
        alt: content.coverAlt,
        sizes: index === 0
          ? '(min-width: 1280px) 616px, (min-width: 768px) 50vw, 92vw'
          : '(min-width: 1280px) 397px, (min-width: 1024px) 31vw, (min-width: 640px) 45vw, 92vw',
        preferredWidth: index === 0 ? 1100 : 640,
        quality: 68,
        loading: index === 0 ? 'eager' : 'lazy',
        fetchPriority: index === 0 ? 'high' : undefined,
        className: 'h-56 w-full object-cover' + (index === 0 ? ' md:h-full md:min-h-[20rem]' : ''),
      })
    : '<div class="flex h-56 items-center justify-center bg-[#E9EDDB] text-4xl" aria-hidden="true">🌿</div>'
  const visibleTags = (post.tags || []).filter((tag) => normalizedTag(tag) !== normalizedTag('Проект')).slice(0, 2)
  const tags = visibleTags.length
    ? '<div class="mt-2 flex flex-wrap gap-2">' + visibleTags.map((tag) => '<span class="rounded-full bg-[#F0F3E8] px-2.5 py-1 text-xs font-medium text-[#53643A]">' + escapeHtml(localizedTag(tag, language)) + '</span>').join('') + '</div>'
    : ''
  const date = formatDate(post.publishedAt, language)
  const featured = index === 0
  const path = '/blog/' + encodeURIComponent(slug)
  return '<article data-florial-blog-post="' + escapeHtml(slug) + '" class="overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ' + (featured ? 'sm:col-span-2 lg:col-span-3' : '') + '">' +
    '<a href="' + escapeHtml(localizedHref(path, language)) + '" class="block h-full no-underline' + (featured ? ' md:grid md:grid-cols-2 md:min-h-[20rem]' : '') + '">' +
    (image ? image : '') +
    '<div class="p-5' + (featured ? ' md:flex md:flex-col md:justify-center md:p-8 lg:p-10' : '') + '">' +
    (featured ? '<p class="mb-2 text-xs font-bold uppercase tracking-widest text-[#71824F]">' + escapeHtml(copy.latest) + '</p>' : '') +
    (date ? '<time datetime="' + escapeHtml(post.publishedAt) + '" class="text-xs text-slate-500">' + escapeHtml(date) + '</time>' : '') +
    tags +
    '<h3 class="mt-2 font-bold leading-snug text-slate-900 ' + (featured ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl') + '">' + escapeHtml(content.title) + '</h3>' +
    (content.shortDescription ? '<p class="mt-3 text-sm leading-6 text-slate-600 ' + (featured ? 'md:text-base md:leading-7' : 'line-clamp-3') + '">' + escapeHtml(content.shortDescription) + '</p>' : '') +
    '<span class="mt-4 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.readMore) + ' <span aria-hidden="true" class="ml-1">→</span></span>' +
    '</div></a></article>'
}

export function getBlogIndexMetadata(language = 'bg') {
  const lang = language === 'ru' || language === 'en' ? language : 'bg'
  const metadata = lang === 'ru'
    ? {
        title: 'Блог Florial — сад, растения и автоматический полив',
        description: 'Новости садового центра Florial, выполненные работы, растения и решения для автоматического полива в Болгарии.',
      }
    : lang === 'en'
      ? {
          title: 'Florial Blog — Gardens, Plants & Irrigation',
          description: 'Florial Garden Centre news, recent projects, plants and automatic irrigation solutions in Bulgaria.',
        }
      : {
          title: 'Блог Florial — градини, растения и автоматично напояване',
          description: 'Новини от градински център Florial, текущи проекти, растения и решения за автоматично напояване в България.',
        }
  const base = SITE_URL + '/blog'
  return {
    ...metadata,
    canonical: base + (lang === 'bg' ? '' : '?lang=' + lang),
    alternates: {
      bg: base,
      ru: base + '?lang=ru',
      en: base + '?lang=en',
      'x-default': base,
    },
  }
}

export function renderBlogIndexHtml({ posts = [], language = 'bg' } = {}) {
  const lang = language === 'ru' || language === 'en' ? language : 'bg'
  const copy = COPY[lang]
  const list = Array.isArray(posts) ? posts : []
  const categoryCards = DIRECTIONS.map((direction) => renderDirection(direction, list, lang)).join('')
  const postCards = list.map((post, index) => renderPost(post, index, lang, copy)).filter(Boolean).join('')
  const articleItems = list.flatMap((post, index) => {
    const slug = slugOf(post)
    const title = translationOf(post, lang).title
    return slug ? [{
      '@type': 'ListItem',
      position: index + 1,
      name: title,
      url: SITE_URL + localizedHref('/blog/' + encodeURIComponent(slug), lang),
    }] : []
  })
  const pageUrl = SITE_URL + localizedHref('/blog', lang)
  const body = '<main data-florial-blog-index="v1" data-florial-blog-count="' + list.length + '" class="mx-auto min-h-[100svh] w-full max-w-7xl flex-grow px-4 py-8 md:px-6 md:py-12">' +
    '<nav class="mb-6 text-sm text-slate-500" aria-label="' + escapeHtml(lang === 'ru' ? 'Навигационная цепочка' : lang === 'en' ? 'Breadcrumb' : 'Навигационна пътека') + '">' +
    '<a href="' + escapeHtml(localizedHref('/', lang)) + '" class="text-[#647746] no-underline hover:underline">' + escapeHtml(copy.home) + '</a>' +
    '<span class="mx-2" aria-hidden="true">/</span><span aria-current="page" class="text-slate-700">' + escapeHtml(copy.title) + '</span></nav>' +
    '<header class="mb-10 max-w-4xl"><h1 class="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">' + escapeHtml(copy.title) + '</h1>' +
    '<p class="mt-4 text-base leading-7 text-slate-600 md:text-lg md:leading-8">' + escapeHtml(copy.intro) + '</p></header>' +
    (list.length ? '<section aria-labelledby="blog-directions-heading" class="mb-10"><div class="mb-4 flex flex-wrap items-end justify-between gap-3"><h2 id="blog-directions-heading" class="text-xl font-bold text-slate-900 md:text-2xl">' + escapeHtml(copy.directions) + '</h2></div>' +
      '<div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">' + categoryCards + '</div></section>' : '') +
    '<section aria-labelledby="blog-publications-heading" data-florial-blog-publications="true">' +
    '<div class="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="blog-publications-heading" class="text-xl font-bold text-slate-900 md:text-2xl">' + escapeHtml(copy.publications) + '</h2>' +
    '<p class="text-sm text-slate-600">' + list.length + '</p></div>' +
    (list.length ? '<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">' + postCards + '</div>' :
      '<p class="py-12 text-slate-600">' + escapeHtml(lang === 'ru' ? 'Пока нет опубликованных материалов.' : lang === 'en' ? 'There are no published posts yet.' : 'Все още няма публикувани материали.') + '</p>') +
    '</section></main>'
  return {
    body,
    image: list.length ? (safeImageUrl(list[0].cover?.asset?.url)?.toString() || undefined) : undefined,
    structuredData: [
      {
        id: 'breadcrumbs',
        data: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: copy.home, item: SITE_URL + localizedHref('/', lang) },
            { '@type': 'ListItem', position: 2, name: copy.title, item: pageUrl },
          ],
        },
      },
      {
        id: 'collection-page',
        data: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: copy.title,
          description: copy.intro,
          url: pageUrl,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: articleItems.length,
            itemListOrder: 'https://schema.org/ItemListOrderDescending',
            itemListElement: articleItems,
          },
        },
      },
    ],
  }
}

export function serializeBlogIndexPayload(posts, language = 'bg') {
  return JSON.stringify({ language, posts: Array.isArray(posts) ? posts : [] }).replace(/</g, '\\u003c')
}

export function blogIndexDirectionIds() {
  return DIRECTIONS.map((direction) => direction.id)
}
