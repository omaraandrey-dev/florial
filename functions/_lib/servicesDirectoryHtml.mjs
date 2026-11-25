const SITE_URL = 'https://florial-bg.com'

const COPY = {
  bg: {
    title: 'Услуги на градински център Florial — създаваме градините на вашите мечти',
    intro: 'Професионален ландшафтен дизайн, озеленяване и системи за автоматично напояване по българското Черноморие — в Поморие, Равда, Несебър, Слънчев бряг и Свети Влас.',
    body: 'Превръщаме обикновените дворове в живи оазиси, където е приятно да си почивате, да прекарвате време със семейството и да се наслаждавате на природата всеки ден. Градински център Florial поема целия процес — от създаването на индивидуален ландшафтен проект и избора на подходящи растения до професионалното им засаждане и монтажа на съвременни системи за напояване. Нашият опит, вниманието към детайла и любовта към растенията ни помагат да създаваме хармонични, устойчиви и лесни за поддръжка градини, които изглеждат прекрасно през всеки сезон.',
    all: 'Всички услуги', directions: 'Нашите професионални направления',
    directionsHint: 'Изберете едно или повече направления, за да видите съответните услуги.',
    titleTag: 'Ландшафтен дизайн и автоматично напояване в Несебър, Слънчев бряг и Свети Влас | Florial',
    description: 'Услуги на градински център Florial: ландшафтен дизайн, монтаж и поддръжка на системи за автоматично напояване, полагане на тревен чим и озеленяване в Несебър, Свети Влас, Равда и Слънчев бряг.',
    home: 'Начало', more: 'Научете повече →', delivery: 'Доставка на оборудване и консултация с инженер',
    deliveryText: 'Безплатна доставка в Слънчев бряг, ясни цени за района, консултация на място и ремонт от 30 €.',
    directionsNames: ['Ландшафтен архитект', 'Инженер по поливни системи', 'Градинар', 'Специалист по тревни площи'],
  },
  ru: {
    title: 'Услуги садового центра Florial — создаём сады вашей мечты',
    intro: 'Профессиональный ландшафтный дизайн, озеленение и системы автоматического полива на побережье Болгарии: Поморие, Равда, Несебр, Солнечный Берег и Святой Влас.',
    body: 'Мы превращаем обычные участки в живые оазисы, где приятно отдыхать, проводить время с семьёй и наслаждаться природой каждый день. Садовый центр Florial берёт на себя полный цикл работ: от разработки уникального ландшафтного проекта и подбора подходящих растений до профессиональной посадки и монтажа современных систем полива. Наш опыт, внимание к деталям и любовь к растениям помогают создавать гармоничные, долговечные и простые в уходе сады, которые прекрасно выглядят в любой сезон.',
    all: 'Все услуги', directions: 'Направления специалистов',
    directionsHint: 'Выберите одно или несколько направлений, чтобы увидеть соответствующие услуги.',
    titleTag: 'Ландшафтный дизайн и автополив в Несебре, Солнечном Берегу, Святом Власе | Florial',
    description: 'Услуги садового центра Florial: ландшафтный дизайн, монтаж и обслуживание систем автополива, укладка газона и озеленение в Несебре, Святом Власе, Равде и Солнечном Берегу.',
    home: 'Главная', more: 'Подробнее →', delivery: 'Доставка оборудования и консультация инженера',
    deliveryText: 'Бесплатная доставка в Солнечном Береге, понятные тарифы по региону, консультация на объекте и ремонт от 30 €.',
    directionsNames: ['Ландшафтный архитектор', 'Инженер систем полива', 'Садовник', 'Специалист по газонам'],
  },
  en: {
    title: 'Florial Garden Centre Services — Creating the Garden of Your Dreams',
    intro: 'Professional landscape design, planting and automatic irrigation systems along the Bulgarian coast, including Pomorie, Ravda, Nessebar, Sunny Beach and Sveti Vlas.',
    body: 'We transform ordinary plots into living oases where you can relax, spend time with your family and enjoy nature every day. Florial Garden Centre manages the entire process, from a unique landscape plan and carefully selected plants to professional planting and installation of modern irrigation systems. Our experience, attention to detail and love of plants help us create harmonious, long-lasting, easy-care gardens that look their best in every season.',
    all: 'All services', directions: 'Our specialist teams',
    directionsHint: 'Choose one or more directions to see the related services.',
    titleTag: 'Landscape Design & Irrigation in Nessebar, Sunny Beach and Sveti Vlas | Florial',
    description: 'Florial Garden Centre services: landscape design, installation and maintenance of automatic irrigation, turf laying and planting in Nessebar, Sveti Vlas, Ravda and Sunny Beach.',
    home: 'Home', more: 'Learn more →', delivery: 'Equipment delivery & engineer consultation',
    deliveryText: 'Free delivery in Sunny Beach, clear local delivery rates, an on-site consultation and repairs from €30.',
    directionsNames: ['Landscape architect', 'Irrigation systems engineer', 'Gardener', 'Lawn specialist'],
  },
}

const DIRECTIONS = [
  { slug: 'landshaften-arhitekt', categories: ['landscaping'] },
  { slug: 'inzhener-polivni-sistemi', categories: ['irrigation', 'maintenance', 'delivery'] },
  { slug: 'gardinar', categories: ['planting'] },
  { slug: 'specialist-trevni-ploshti', categories: ['lawn'] },
]

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function safeImageUrl(value) {
  if (typeof value !== 'string') return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? value : ''
  } catch {
    return ''
  }
}

function href(path, language) {
  return path + (language === 'bg' ? '' : '?lang=' + language)
}

function localize(item, field, language) {
  const translated = item?.translations?.[language]?.[field]
  if (typeof translated === 'string' && translated.trim()) return translated.trim()
  const base = item?.[field]
  return typeof base === 'string' ? base.trim() : ''
}

function responsiveImage(value, alt, sizes, className = '') {
  const imageUrl = safeImageUrl(value)
  if (!imageUrl) return ''
  let src = imageUrl
  let srcSet = ''
  let dimensions = ''
  try {
    const source = new URL(imageUrl)
    const match = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (source.hostname === 'cdn.sanity.io' && match) {
      const sourceWidth = Number(match[1])
      const sourceHeight = Number(match[2])
      const buildUrl = (width) => {
        const image = new URL(source)
        image.searchParams.set('w', String(Math.min(width, sourceWidth)))
        image.searchParams.set('fit', 'max')
        image.searchParams.set('auto', 'format')
        image.searchParams.set('q', '68')
        return image.toString()
      }
      const candidates = [160, 240, 320, 480, 640, 720, 800, 960, 1200, 1600]
        .map((width) => Math.min(width, sourceWidth))
        .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
        .sort((a, b) => a - b)
      src = buildUrl(640)
      srcSet = candidates.map((width) => buildUrl(width) + ' ' + width + 'w').join(', ')
      dimensions = ' width="' + sourceWidth + '" height="' + sourceHeight + '"'
    }
  } catch {}
  return '<img src="' + escapeHtml(src) + '"' +
    (srcSet ? ' srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes) + '"' : '') +
    dimensions + ' alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async"' +
    (className ? ' class="' + escapeHtml(className) + '"' : '') + ' />'
}

function renderDirection(direction, index, photos, copy, language) {
  const photo = photos.find((item) => item.slug === direction.slug)
  const title = copy.directionsNames[index]
  const alt = language === 'ru' ? photo?.imageAltRu || title
    : language === 'en' ? photo?.imageAltEn || title
      : photo?.imageAlt || title
  const image = photo?.imageUrl
    ? responsiveImage(photo.imageUrl, alt, '(min-width: 640px) 25vw, 25vw', 'h-full w-full object-cover')
    : ''
  return '<div class="min-w-0 overflow-hidden rounded-xl border border-emerald-700 bg-white p-1.5 text-center shadow-sm sm:rounded-2xl sm:p-3">' +
    '<div class="block aspect-square overflow-hidden rounded-lg bg-[#E9EDDB] sm:rounded-xl">' +
    (image || '<span class="flex h-full items-center justify-center p-2 text-xs font-semibold text-slate-700">' + escapeHtml(title) + '</span>') +
    '</div><span class="mt-2 block text-[10px] font-bold leading-tight text-slate-800 sm:text-sm">' + escapeHtml(title) + '</span></div>'
}

function renderServiceCard(entry, copy, language) {
  if (entry.kind === 'delivery') {
    const image = responsiveImage('https://cdn.sanity.io/images/bxvcy0qs/production/97ebd01d7dc8a7e709720377e58cee7662223b26-1536x1024.jpg',
      copy.delivery, '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', 'h-full w-full object-cover')
    return '<li><a class="flex h-full flex-col overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white shadow-sm no-underline" href="' +
      escapeHtml(href('/services/dostavka-poliv', language)) + '">' +
      '<div class="flex h-52 items-center justify-center overflow-hidden bg-[#E9EDDB]">' + image + '</div>' +
      '<div class="flex flex-1 flex-col p-5"><h2 class="mb-2 text-xl font-bold text-slate-900">' + escapeHtml(copy.delivery) + '</h2>' +
      '<p class="flex-1 text-sm leading-6 text-slate-600">' + escapeHtml(copy.deliveryText) + '</p>' +
      '<span class="mt-4 font-semibold text-emerald-800">' + escapeHtml(copy.more) + '</span></div></a></li>'
  }
  const service = entry.service
  const name = localize(service, 'name', language)
  const slug = service.slug?.current || (typeof service.slug === 'string' ? service.slug : service._id)
  const image = service.imageUrl
    ? responsiveImage(service.imageUrl, name, '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', 'h-full w-full object-cover')
    : '<span class="p-4 text-center font-semibold text-slate-700">' + escapeHtml(name) + '</span>'
  const summary = localize(service, 'shortDescription', language)
  return '<li><a class="flex h-full flex-col overflow-hidden rounded-2xl border border-[#DDE3D0] bg-white shadow-sm no-underline" href="' +
    escapeHtml(href('/services/' + encodeURIComponent(slug), language)) + '">' +
    '<div class="flex h-52 items-center justify-center overflow-hidden bg-[#E9EDDB]">' + image + '</div>' +
    '<div class="flex flex-1 flex-col p-5"><h2 class="mb-2 text-xl font-bold text-slate-900">' + escapeHtml(name) + '</h2>' +
    (summary ? '<p class="flex-1 text-sm leading-6 text-slate-600">' + escapeHtml(summary) + '</p>' : '<span class="flex-1"></span>') +
    '<span class="mt-4 font-semibold text-emerald-800">' + escapeHtml(copy.more) + '</span></div></a></li>'
}

export function getServicesDirectoryMetadata(language = 'bg') {
  const copy = COPY[language] || COPY.bg
  return {
    title: copy.titleTag,
    description: copy.description,
    canonical: SITE_URL + '/services' + (language === 'bg' ? '' : '?lang=' + language),
    alternates: {
      bg: SITE_URL + '/services',
      ru: SITE_URL + '/services?lang=ru',
      en: SITE_URL + '/services?lang=en',
      'x-default': SITE_URL + '/services',
    },
    structuredData: [
      {
        id: 'breadcrumbs',
        data: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: copy.home, item: SITE_URL + (language === 'bg' ? '/' : '/?lang=' + language) },
            { '@type': 'ListItem', position: 2, name: copy.all, item: SITE_URL + '/services' + (language === 'bg' ? '' : '?lang=' + language) },
          ],
        },
      },
    ],
  }
}

export function renderServicesDirectoryHtml({ entries = [], rolePhotos = [], language = 'bg' } = {}) {
  const lang = ['bg', 'ru', 'en'].includes(language) ? language : 'bg'
  const copy = COPY[lang]
  const services = entries.slice(0, 50)
  const itemList = services.flatMap((entry, index) => {
    if (entry.kind === 'delivery') return [{
      '@type': 'ListItem', position: index + 1, name: copy.delivery,
      url: SITE_URL + href('/services/dostavka-poliv', lang),
    }]
    const service = entry.service
    const slug = service.slug?.current || (typeof service.slug === 'string' ? service.slug : '')
    if (!slug) return []
    return [{
      '@type': 'ListItem', position: index + 1,
      name: localize(service, 'name', lang) || service.name,
      url: SITE_URL + href('/services/' + encodeURIComponent(slug), lang),
    }]
  })
  const body = '<main class="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">' +
    '<nav aria-label="Breadcrumb" class="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">' +
    '<a href="' + escapeHtml(href('/', lang)) + '" class="no-underline">' + escapeHtml(copy.home) + '</a><span aria-hidden="true">/</span>' +
    '<span aria-current="page" class="font-medium text-slate-700">' + escapeHtml(copy.all) + '</span></nav>' +
    '<header class="mx-auto max-w-4xl pb-8 pt-2 text-center md:pb-12">' +
    '<h1 class="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">' + escapeHtml(copy.title) + '</h1>' +
    '<p class="mb-4 text-lg leading-8 text-slate-600">' + escapeHtml(copy.intro) + '</p>' +
    '<p class="text-base leading-8 text-slate-600">' + escapeHtml(copy.body) + '</p></header>' +
    '<section aria-labelledby="service-directions-heading" class="mb-8">' +
    '<div class="mb-4 text-center"><h2 id="service-directions-heading" class="mb-2 text-2xl font-bold text-slate-900">' + escapeHtml(copy.directions) + '</h2>' +
    '<p class="text-sm leading-6 text-slate-600">' + escapeHtml(copy.directionsHint) + '</p></div>' +
    '<div class="grid grid-cols-4 gap-2 sm:gap-4">' + DIRECTIONS.map((direction, index) =>
      renderDirection(direction, index, rolePhotos, copy, lang)).join('') + '</div></section>' +
    '<section aria-label="' + escapeHtml(copy.all) + '">' +
    '<ul class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">' +
    services.map((entry) => renderServiceCard(entry, copy, lang)).join('') +
    '</ul></section></main>'
  return {
    body,
    structuredData: [{
      id: 'collection-page',
      data: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: copy.titleTag,
        description: copy.description,
        url: SITE_URL + '/services' + (lang === 'bg' ? '' : '?lang=' + lang),
        ...(itemList.length ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: itemList.length,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            itemListElement: itemList,
          },
        } : {}),
      },
    }],
  }
}

export { COPY as servicesDirectoryCopy }
