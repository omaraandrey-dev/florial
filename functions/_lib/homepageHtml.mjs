import { getPlantPrice, selectFeaturedEquipment } from '../../src/lib/homepageFeatured.mjs'

const PLANT_CATEGORY_IDS = [
  'plants-root',
  'plants-palms',
  'plants-olives',
  'plants-trees-shrubs',
  'plants-solitaires',
  'plants-flowers',
]

const EQUIPMENT_CATEGORY_ORDER = [
  'vsichko-za-polivane',
  'gotovi-komplekti-za-polivane',
  'controllers',
  'sprinklers',
  'nozzles',
  'klapani',
  'shahti',
  'kapkovo-napoyavane',
  'filtri-regulatori-nalyagane',
  'trabi-fitingi-aksesoari',
  'drugi-komponenti-za-polivane',
]

const IMAGE_LOCATIONS = {
  bg: 'Несебър',
  ru: 'Несебре',
  en: 'Nessebar',
}

const COPY = {
  bg: {
    heroTitle: 'Градински център Флориал',
    heroSubtitle: 'Професионален ландшафтен дизайн, продажба на растения и поливна техника в Несебър, Равда, Слънчев бряг, Бургас',
    heroText: 'Флориал е вашият доверен партньор с над 25 години опит в ландшафтния дизайн, озеленяването и автоматизираните системи за поливане. Проектираме и реализираме уникални градини за частни и обществени обекти „под ключ“ — с внимание към детайла и климатичните особености на региона.',
    plantsCta: 'Разгледайте растенията',
    equipmentCta: 'Поливно оборудване',
    aboutCta: 'Повече за нас',
    serviceEyebrow: 'Извършваме дейности',
    services: 'Професионални решения за градината',
    allServices: 'Всички услуги',
    learnMore: 'Научете повече',
    plants: 'Растения за вашата градина',
    plantsIntro: 'Палми, маслини, цитруси, декоративни дървета и цветя — избор за частни градини, хотели и професионално озеленяване.',
    featuredPlants: 'Избрани растения',
    featuredPlantsIntro: 'Подбрани растения от нашия каталог с актуални цени и наличност.',
    allPlants: 'Разгледайте всички растения',
    irrigation: 'Продажба на поливно оборудване',
    featuredEquipment: 'Избрано оборудване за поливане',
    equipmentIntro: 'Комплекти за поливане с актуални цени и наличност.',
    allEquipment: 'Към каталога с поливно оборудване',
    allKits: 'Разгледайте всички готови комплекти',
    from: 'Цена от',
    vat: 'Цената е с включен ДДС.',
    inStock: 'В наличност',
    onRequest: 'По заявка',
    outOfStock: 'Изчерпан',
    checkAvailability: 'Проверете наличността',
    noImage: 'Няма снимка',
    viewPlant: 'Виж растението',
    viewKit: 'Виж комплекта',
    blog: 'Блог и портфолио',
    allArticles: 'Всички статии',
    readMore: 'Прочетете още',
    noArticles: 'Няма публикувани статии.',
    deliveryTitle: 'Доставка на оборудване',
    deliveryAlt: 'Доставка на оборудване и консултация с инженер',
    deliveryText: 'Доставка на оборудване и консултация с инженер.',
  },
  ru: {
    heroTitle: 'Садовый центр Florial',
    heroSubtitle: 'Профессиональный ландшафтный дизайн, продажа растений и оборудования для полива в Несебре, Равде, Солнечном Береге и Бургасе',
    heroText: 'Florial — ваш надёжный партнёр с более чем 25-летним опытом в ландшафтном дизайне, озеленении и автоматических системах полива. Мы проектируем и создаём уникальные сады под ключ для частных и общественных объектов, уделяя внимание деталям и климатическим особенностям региона.',
    plantsCta: 'Посмотреть растения',
    equipmentCta: 'Оборудование для полива',
    aboutCta: 'Подробнее о нас',
    serviceEyebrow: 'Выполняем работы',
    services: 'Профессиональные решения для сада',
    allServices: 'Все услуги',
    learnMore: 'Подробнее',
    plants: 'Растения для вашего сада',
    plantsIntro: 'Пальмы, оливковые деревья, цитрусовые, декоративные деревья и цветы для частных садов, отелей и профессионального озеленения.',
    featuredPlants: 'Рекомендуемые растения',
    featuredPlantsIntro: 'Подборка растений из нашего каталога с актуальными ценами и наличием.',
    allPlants: 'Посмотреть все растения',
    irrigation: 'Продажа оборудования для полива',
    featuredEquipment: 'Подобранное оборудование для полива',
    equipmentIntro: 'Готовые комплекты для полива с актуальными ценами и наличием.',
    allEquipment: 'Перейти в каталог оборудования',
    allKits: 'Посмотреть все готовые комплекты',
    from: 'Цена от',
    vat: 'Цена включает НДС.',
    inStock: 'В наличии',
    onRequest: 'Под заказ',
    outOfStock: 'Нет в наличии',
    checkAvailability: 'Уточните наличие',
    noImage: 'Нет изображения',
    viewPlant: 'Посмотреть растение',
    viewKit: 'Посмотреть комплект',
    blog: 'Блог и портфолио',
    allArticles: 'Все статьи',
    readMore: 'Читать далее',
    noArticles: 'Пока нет опубликованных статей.',
    deliveryTitle: 'Доставка оборудования',
    deliveryAlt: 'Доставка оборудования и консультация инженера',
    deliveryText: 'Доставка оборудования и консультация инженера.',
  },
  en: {
    heroTitle: 'Florial Garden Centre',
    heroSubtitle: 'Professional landscape design, plant sales and irrigation equipment in Nessebar, Ravda, Sunny Beach and Burgas',
    heroText: 'Florial is your trusted partner with over 25 years of experience in landscape design, landscaping and automated irrigation systems. We design and create unique turnkey gardens for private and public spaces, paying close attention to detail and the region’s climate.',
    plantsCta: 'Explore plants',
    equipmentCta: 'Irrigation equipment',
    aboutCta: 'About us',
    serviceEyebrow: 'Our services',
    services: 'Professional garden solutions',
    allServices: 'All services',
    learnMore: 'Learn more',
    plants: 'Plants for your garden',
    plantsIntro: 'Palms, olive trees, citrus, ornamental trees and flowers for private gardens, hotels and professional landscaping.',
    featuredPlants: 'Featured plants',
    featuredPlantsIntro: 'A selection of plants from our catalogue with current prices and availability.',
    allPlants: 'Browse all plants',
    irrigation: 'Irrigation Equipment Sales',
    featuredEquipment: 'Featured irrigation equipment',
    equipmentIntro: 'Ready-made irrigation kits with current prices and availability.',
    allEquipment: 'View all irrigation equipment',
    allKits: 'View all ready-made kits',
    from: 'From',
    vat: 'Price includes VAT.',
    inStock: 'In stock',
    onRequest: 'Available on request',
    outOfStock: 'Out of stock',
    checkAvailability: 'Check availability',
    noImage: 'No image',
    viewPlant: 'View plant',
    viewKit: 'View kit',
    blog: 'Blog & Portfolio',
    allArticles: 'All articles',
    readMore: 'Read more',
    noArticles: 'No articles have been published yet.',
    deliveryTitle: 'Equipment delivery',
    deliveryAlt: 'Equipment delivery and irrigation engineer consultation',
    deliveryText: 'Equipment delivery and consultation with an irrigation engineer.',
  },
}

const DELIVERY_IMAGE = 'https://cdn.sanity.io/images/bxvcy0qs/production/97ebd01d7dc8a7e709720377e58cee7662223b26-1536x1024.jpg'
const HERO_FALLBACK = 'https://cdn.sanity.io/images/bxvcy0qs/production/460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957.png'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
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

function localize(item, field, language) {
  const translated = item?.translations?.[language]?.[field]
  if (typeof translated === 'string' && translated.trim()) return translated.trim()
  const base = item?.[field]
  return typeof base === 'string' ? base.trim() : ''
}

function href(path, language) {
  return path + (language === 'bg' ? '' : (path.includes('?') ? '&' : '?') + 'lang=' + language)
}

function imageText(name, language, kind) {
  const location = IMAGE_LOCATIONS[language] || IMAGE_LOCATIONS.bg
  if (language === 'ru') return kind === 'title' ? 'Продажа ' + name + ' в ' + location : 'Купить ' + name + ' в ' + location
  if (language === 'en') return kind === 'title' ? name + ' for sale in ' + location : 'Buy ' + name + ' in ' + location
  return kind === 'title' ? 'Продажба на ' + name + ' в ' + location : 'Купете ' + name + ' в ' + location
}

function categoryImageText(category, language, kind) {
  const name = localize(category, 'name', language) || category.name || ''
  const field = kind === 'alt'
    ? language === 'ru' ? 'imageAltRu' : language === 'en' ? 'imageAltEn' : 'imageAlt'
    : language === 'ru' ? 'imageTitleRu' : language === 'en' ? 'imageTitleEn' : 'imageTitle'
  const value = typeof category[field] === 'string' ? category[field].trim() : ''
  return value || (kind === 'alt' ? name : '')
}

function plantStatus(product) {
  const statuses = (product.saleVariants || [])
    .map((variant) => variant?.stockStatus)
    .filter((status) => status === 'inStock' || status === 'onRequest' || status === 'outOfStock')
  if (statuses.includes('inStock')) return 'inStock'
  if (statuses.includes('onRequest')) return 'onRequest'
  if (statuses.length) return 'outOfStock'
  return product.stockStatus === 'inStock' || product.stockStatus === 'onRequest' || product.stockStatus === 'outOfStock'
    ? product.stockStatus
    : null
}

function availabilityLabel(status, copy) {
  if (status === 'inStock') return copy.inStock
  if (status === 'outOfStock') return copy.outOfStock
  if (status === 'onRequest') return copy.onRequest
  return copy.checkAvailability
}

function priceMarkup(price, language) {
  return Number.isFinite(price) && price > 0
    ? '<p class="mt-3 text-base font-extrabold text-[#34452D] sm:text-lg">' + price.toFixed(2) + ' €</p>'
    : ''
}

function selectVisibleEquipmentCategories(categories) {
  const byId = new Map((categories || []).map((item) => [item._id, item]))
  const visibleIds = new Set()
  ;(categories || []).forEach((category) => {
    if ((category.productCount || 0) <= 0) return
    let current = category
    const visited = new Set()
    while (current && !visited.has(current._id)) {
      visited.add(current._id)
      visibleIds.add(current._id)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
  })
  const visible = (categories || []).filter((category) =>
    category.slug?.current !== 'electromagnetic-valves' && visibleIds.has(category._id)
  )
  const rootId = visible.find((category) => category.slug?.current === 'vsichko-za-polivane')?._id
  const roots = visible.filter((category) => !category.parentId || category.parentId === rootId)
  return roots.slice().sort((a, b) => {
    const aIndex = EQUIPMENT_CATEGORY_ORDER.indexOf(a.slug?.current || '')
    const bIndex = EQUIPMENT_CATEGORY_ORDER.indexOf(b.slug?.current || '')
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return (a.sortOrder || 999) - (b.sortOrder || 999) || String(a.name || '').localeCompare(String(b.name || ''), 'bg')
  }).slice(0, 6)
}

function selectVisiblePlantCategories(categories) {
  return PLANT_CATEGORY_IDS
    .map((id) => (categories || []).find((category) => category._id === id))
    .filter(Boolean)
}

function selectVisiblePlants(products) {
  return (products || [])
    .filter((product) => plantStatus(product) !== 'outOfStock')
    .filter((product) => getPlantPrice(product) !== null)
    .slice(0, 4)
}

function selectVisibleEquipment(products) {
  return selectFeaturedEquipment(products)
    .filter((product) => product.stockStatus !== 'outOfStock')
    .filter((product) => Number.isFinite(product.priceEUR) && product.priceEUR > 0 && Boolean(product.imageUrl))
    .slice(0, 4)
}

function serviceSummary(service, language) {
  const summary = localize(service, 'shortDescription', language)
  if (summary) return summary
  const summaries = {
    landscaping: {
      bg: 'Индивидуални проекти и цялостно оформление на красиви градини.',
      ru: 'Индивидуальные проекты и комплексное оформление красивых садов.',
      en: 'Tailored designs and complete planning for beautiful gardens.',
    },
    planting: {
      bg: 'Професионално засаждане на растения и озеленяване на терени.',
      ru: 'Профессиональная посадка растений и озеленение участков.',
      en: 'Professional planting and landscaping for outdoor spaces.',
    },
    irrigation: {
      bg: 'Проектиране, монтаж и настройка на автоматизирани системи.',
      ru: 'Проектирование, монтаж и настройка автоматических систем.',
      en: 'Design, installation and setup of automatic irrigation systems.',
    },
    lawn: {
      bg: 'Подготовка на терена и полагане на естествен тревен чим.',
      ru: 'Подготовка участка и укладка натурального рулонного газона.',
      en: 'Ground preparation and installation of natural turf.',
    },
    maintenance: {
      bg: 'Грижа за растенията и сезонна поддръжка на градината.',
      ru: 'Уход за растениями и сезонное обслуживание сада.',
      en: 'Plant care and seasonal garden maintenance.',
    },
    delivery: {
      bg: 'Доставка на оборудване и консултация с инженер.',
      ru: 'Доставка оборудования и консультация инженера.',
      en: 'Equipment delivery and consultation with an irrigation engineer.',
    },
  }
  return summaries[service.serviceCategory || '']?.[language] || ''
}

function renderCategoryCard(category, language, equipment = false) {
  const name = localize(category, 'name', language) || category.name || ''
  const slug = category.slug?.current || category._id
  const imageUrl = safeImageUrl(category.imageUrl)
  const alt = categoryImageText(category, language, 'alt')
  const title = categoryImageText(category, language, 'title')
  return '<li><a class="group block overflow-hidden rounded-xl border border-[#E2E6D8] bg-white no-underline" href="' + escapeHtml(href('/category/' + encodeURIComponent(slug), language)) + '">' +
    (imageUrl
      ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(alt) + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') + ' width="800" height="600" loading="lazy" decoding="async" class="h-36 w-full object-' + (equipment ? 'contain' : 'cover') + '" />'
      : '') +
    '<h4 class="p-3 text-sm font-bold text-slate-800">' + escapeHtml(name) + '</h4></a></li>'
}

function renderPlantCard(product, language, copy) {
  const name = localize(product, 'name', language) || product.name || ''
  const slug = product.slug?.current || product._id
  const plantPrice = getPlantPrice(product)
  if (!plantPrice) return ''
  const status = plantStatus(product)
  const imageUrl = safeImageUrl(product.imageUrl)
  return '<li><article class="overflow-hidden rounded-xl border border-[#E2E6D8] bg-white shadow-sm">' +
    '<a class="block text-left no-underline" href="' + escapeHtml(href('/product/' + encodeURIComponent(slug), language)) + '">' +
    (imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(imageText(name, language, 'alt')) + '" loading="lazy" decoding="async" class="h-48 w-full object-contain p-3" />' : '') +
    '<div class="p-4"><h4 class="font-bold text-slate-900">' + escapeHtml(name) + '</h4>' +
    (product.scientificName ? '<p class="mt-1 text-xs italic text-slate-500">' + escapeHtml(product.scientificName) + '</p>' : '') +
    '<p class="mt-3 text-base font-extrabold text-[#34452D]">' + (plantPrice.from ? escapeHtml(copy.from) + ' ' : '') + plantPrice.price.toFixed(2) + ' €</p>' +
    (product.vatIncluded === true ? '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(copy.vat) + '</p>' : '') +
    '<p class="mt-2 text-xs font-semibold">' + escapeHtml(availabilityLabel(status, copy)) + '</p>' +
    '<span class="mt-3 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.viewPlant) + ' →</span></div></a></article></li>'
}

function renderEquipmentCard(product, language, copy) {
  const name = localize(product, 'name', language) || product.name || ''
  const slug = product.slug?.current || product._id
  const imageUrl = safeImageUrl(product.imageUrl)
  return '<li><article class="overflow-hidden rounded-xl border border-[#E2E6D8] bg-white shadow-sm">' +
    '<a class="block text-left no-underline" href="' + escapeHtml(href('/product/' + encodeURIComponent(slug), language)) + '">' +
    (imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(imageText(name, language, 'alt')) + '" loading="lazy" decoding="async" class="h-48 w-full object-contain p-3" />' : '') +
    '<div class="p-4"><h4 class="font-bold text-slate-900">' + escapeHtml(name) + '</h4>' +
    priceMarkup(product.priceEUR, language) +
    (product.vatIncluded === true ? '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(copy.vat) + '</p>' : '') +
    '<p class="mt-2 text-xs font-semibold">' + escapeHtml(availabilityLabel(product.stockStatus, copy)) + '</p>' +
    '<span class="mt-3 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.viewKit) + ' →</span></div></a></article></li>'
}

function renderServiceCard(entry, language, copy) {
  if (entry.kind === 'delivery') {
    return '<li><a class="block overflow-hidden rounded-xl border border-[#DDE3D0] bg-white/85 text-slate-800 no-underline" href="' + escapeHtml(href('/services/dostavka-poliv', language)) + '">' +
      '<img src="' + DELIVERY_IMAGE + '" alt="' + escapeHtml(copy.deliveryAlt) + '" loading="lazy" decoding="async" class="h-36 w-full object-cover" />' +
      '<div class="p-4"><h4 class="font-bold">' + escapeHtml(copy.deliveryTitle) + '</h4><p class="mt-2 text-sm">' + escapeHtml(copy.deliveryText) + '</p><span class="mt-3 inline-flex text-xs font-bold">' + escapeHtml(copy.learnMore) + ' →</span></div></a></li>'
  }
  const service = entry.service || {}
  const name = localize(service, 'name', language) || service.name || ''
  const slug = service.slug?.current || service._id
  const imageUrl = safeImageUrl(service.imageUrl)
  return '<li><a class="block overflow-hidden rounded-xl border border-[#DDE3D0] bg-white/85 text-slate-800 no-underline" href="' + escapeHtml(href('/services/' + encodeURIComponent(slug), language)) + '">' +
    (imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(name) + '" loading="lazy" decoding="async" class="h-36 w-full object-cover" />' : '') +
    '<div class="p-4"><h4 class="font-bold">' + escapeHtml(name) + '</h4><p class="mt-2 text-sm">' + escapeHtml(serviceSummary(service, language)) + '</p><span class="mt-3 inline-flex text-xs font-bold">' + escapeHtml(copy.learnMore) + ' →</span></div></a></li>'
}

function formatDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function renderBlogCard(post, language, copy) {
  const translations = post.translations?.[language] || post.translations?.bg || {}
  const title = translations.title || post.title || ''
  const description = translations.shortDescription || post.shortDescription || ''
  const slug = typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id
  const imageUrl = safeImageUrl(post.cover?.asset?.url)
  const alt = translations.coverAlt || post.cover?.alt || title
  return '<li><article class="overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm"><a class="block no-underline" href="' + escapeHtml(href('/blog/' + encodeURIComponent(slug), language)) + '">' +
    (imageUrl ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async" class="h-52 w-full object-cover" />' : '') +
    '<div class="p-5">' + (post.publishedAt ? '<time datetime="' + escapeHtml(post.publishedAt) + '" class="text-xs text-slate-500">' + escapeHtml(formatDate(post.publishedAt, language)) + '</time>' : '') +
    '<h4 class="mt-2 text-lg font-bold text-slate-900">' + escapeHtml(title) + '</h4>' +
    (description ? '<p class="mt-2 text-sm leading-6 text-slate-600">' + escapeHtml(description) + '</p>' : '') +
    '<span class="mt-4 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.readMore) + ' →</span></div></a></article></li>'
}

export function renderHomepageHtml(data, language = 'bg', siteUrl = 'https://florial-bg.com') {
  const lang = language === 'ru' || language === 'en' ? language : 'bg'
  const copy = COPY[lang]
  const heroImage = safeImageUrl(data.heroImageUrl) || HERO_FALLBACK
  const plantCategories = selectVisiblePlantCategories(data.plantCategories)
  const equipmentCategories = selectVisibleEquipmentCategories(data.equipmentCategories)
  const plants = selectVisiblePlants(data.featuredPlants)
  const equipment = selectVisibleEquipment(data.featuredEquipment)
  const serviceEntries = (data.serviceEntries || []).slice(0, 6)
  const pinned = Array.isArray(data.pinnedPosts) ? data.pinnedPosts : []
  const pinnedSlugs = new Set(pinned.map((post) => typeof post.slug === 'string' ? post.slug : post.slug?.current).filter(Boolean))
  const latest = (Array.isArray(data.latestPosts) ? data.latestPosts : [])
    .filter((post) => !pinnedSlugs.has(typeof post.slug === 'string' ? post.slug : post.slug?.current))
    .slice(0, 1)
  const blogPosts = [...pinned, ...latest]
  const plantsRoot = plantCategories.find((category) => category._id === 'plants-root') || plantCategories[0]
  const equipmentRoot = equipmentCategories.find((category) => category.slug?.current === 'vsichko-za-polivane') || equipmentCategories[0]

  const serviceCards = serviceEntries.map((entry) => renderServiceCard(entry, lang, copy)).join('')
  const plantCategoryCards = plantCategories.map((category) => renderCategoryCard(category, lang)).join('')
  const plantCards = plants.map((product) => renderPlantCard(product, lang, copy)).join('')
  const equipmentCategoryCards = equipmentCategories.map((category) => renderCategoryCard(category, lang, true)).join('')
  const equipmentCards = equipment.map((product) => renderEquipmentCard(product, lang, copy)).join('')
  const blogCards = blogPosts.map((post) => renderBlogCard(post, lang, copy)).join('')

  return '<main data-florial-ssr-homepage="v1">' +
    '<section class="relative isolate overflow-hidden bg-[#F7F8F1] px-4 py-12 text-slate-800 md:py-16">' +
      '<img src="' + escapeHtml(heroImage) + '" alt="" aria-hidden="true" fetchpriority="high" decoding="async" class="absolute inset-0 h-full w-full object-cover" />' +
      '<div class="relative z-10 mx-auto max-w-5xl text-center">' +
        '<h1 class="mb-3 text-4xl font-extrabold tracking-tight text-[#263323] md:text-6xl">' + escapeHtml(copy.heroTitle) + '</h1>' +
        '<h2 class="mb-5 text-xl font-bold tracking-tight text-[#263323] md:text-3xl">' + escapeHtml(copy.heroSubtitle) + '</h2>' +
        '<p class="mx-auto max-w-4xl text-sm font-semibold leading-relaxed text-[#11150F] md:text-lg">' + escapeHtml(copy.heroText) + '</p>' +
        '<div class="mt-7 flex flex-wrap items-center justify-center gap-3">' +
          '<a href="' + escapeHtml(href('/category/rastenia', lang)) + '">' + escapeHtml(copy.plantsCta) + '</a>' +
          '<a href="' + escapeHtml(href('/category/vsichko-za-polivane', lang)) + '">' + escapeHtml(copy.equipmentCta) + '</a>' +
          '<a href="' + escapeHtml(href('/about', lang)) + '">' + escapeHtml(copy.aboutCta) + '</a>' +
        '</div></div></section>' +
    '<section class="mx-auto w-full max-w-7xl px-4 py-10">' +
      '<div class="mb-6 flex items-center justify-between gap-3"><p>' + escapeHtml(copy.serviceEyebrow) + '</p><h3>' + escapeHtml(copy.services) + '</h3><a href="' + escapeHtml(href('/services', lang)) + '">' + escapeHtml(copy.allServices) + ' →</a></div>' +
      (serviceCards ? '<ul class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">' + serviceCards + '</ul>' : '') +
    '</section>' +
    '<section class="border-y border-[#E7EBDD] bg-[#F7F8F1]"><div class="mx-auto max-w-7xl px-4 py-10">' +
      '<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3>' + escapeHtml(copy.plants) + '</h3><p>' + escapeHtml(copy.plantsIntro) + '</p></div>' +
      (plantCategoryCards ? '<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-5">' + plantCategoryCards + '</ul>' : '') +
      (plants.length ? '<section class="border-b border-[#E7EBDD] bg-white px-4 py-10"><div class="mx-auto max-w-7xl">' +
        '<div class="mb-6 flex items-end justify-between gap-3"><div><h3>' + escapeHtml(copy.featuredPlants) + '</h3><p>' + escapeHtml(copy.featuredPlantsIntro) + '</p></div><a href="' + escapeHtml(href('/category/rastenia', lang)) + '">' + escapeHtml(copy.allPlants) + ' →</a></div>' +
        '<ul class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">' + plantCards + '</ul></div></section>' : '') +
    '</div></section>' +
    '<section class="mx-auto w-full max-w-7xl bg-[#EEF1E4] px-4 pb-5 pt-10">' +
      '<h3 class="mb-6 text-center">' + escapeHtml(copy.irrigation) + '</h3>' +
      (equipmentCategoryCards ? '<ul class="mb-6 grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6">' + equipmentCategoryCards + '</ul>' : '') +
      '<p class="my-6 text-center"><a href="' + escapeHtml(href('/category/vsichko-za-polivane', lang)) + '">' + escapeHtml(copy.allEquipment) + ' →</a></p>' +
      (equipment.length ? '<section class="mt-10 border-t border-[#DDE3D0] pt-8 pb-3"><div class="mb-5 flex items-end justify-between gap-3"><div><h3>' + escapeHtml(copy.featuredEquipment) + '</h3><p>' + escapeHtml(copy.equipmentIntro) + '</p></div><a href="' + escapeHtml(href('/category/gotovi-komplekti-za-polivane', lang)) + '">' + escapeHtml(copy.allKits) + ' →</a></div>' +
        '<ul class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">' + equipmentCards + '</ul></section>' : '') +
    '</section>' +
    '<section class="border-t border-[#E4E8DA] bg-[#F7F8F1] px-4 py-10 md:py-14"><div class="mx-auto max-w-7xl">' +
      '<div class="mb-6 flex items-end justify-between gap-3"><h3>' + escapeHtml(copy.blog) + '</h3><a href="' + escapeHtml(href('/blog', lang)) + '">' + escapeHtml(copy.allArticles) + ' →</a></div>' +
      (blogCards ? '<ul class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">' + blogCards + '</ul>' : '<p>' + escapeHtml(copy.noArticles) + '</p>') +
    '</div></section>' +
  '</main>'
}

export function homepageSelectionForTest(data) {
  return {
    plantCategories: selectVisiblePlantCategories(data.plantCategories).map((item) => item._id),
    equipmentCategories: selectVisibleEquipmentCategories(data.equipmentCategories).map((item) => item.slug?.current),
    plants: selectVisiblePlants(data.featuredPlants).map((item) => item.slug?.current),
    equipment: selectVisibleEquipment(data.featuredEquipment).map((item) => item.slug?.current),
  }
}
