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
    why: 'Предимствата на Florial',
    years: '25+ години опит',
    yearsDetail: 'Професионализъм и опит',
    plantsDetailTitle: 'Растения и поливно оборудване',
    plantsDetail: 'За градината на едно място',
    region: 'Несебър и региона',
    regionDetail: 'Местно обслужване',
    design: 'Проектиране и монтаж',
    designDetail: 'От идеята до реализацията',
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
    deliveryTitle: 'Доставка на оборудване и консултация с инженер',
    deliveryAlt: 'Доставка на оборудване и консултация с инженер',
    deliveryText: 'Доставка на оборудване и консултация с инженер.',
  },
  ru: {
    why: 'Преимущества Florial',
    years: 'Более 25 лет опыта',
    yearsDetail: 'Опыт и профессионализм',
    plantsDetailTitle: 'Растения и оборудование для полива',
    plantsDetail: 'Всё для сада в одном месте',
    region: 'Несебр и регион',
    regionDetail: 'Местное обслуживание',
    design: 'Проектирование и монтаж',
    designDetail: 'От идеи до реализации',
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
    deliveryTitle: 'Доставка оборудования и консультация инженера',
    deliveryAlt: 'Доставка оборудования и консультация инженера',
    deliveryText: 'Доставка оборудования и консультация инженера.',
  },
  en: {
    why: 'Why choose Florial',
    years: '25+ years of experience',
    yearsDetail: 'Experience and professionalism',
    plantsDetailTitle: 'Plants and irrigation equipment',
    plantsDetail: 'Everything for your garden in one place',
    region: 'Nessebar and the surrounding area',
    regionDetail: 'Local service',
    design: 'Design and installation',
    designDetail: 'From idea to completion',
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
    deliveryTitle: 'Equipment delivery & engineer consultation',
    deliveryAlt: 'Equipment delivery and engineer consultation',
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

function responsiveImage(value, options = {}) {
  const imageUrl = safeImageUrl(value)
  if (!imageUrl) return ''
  const {
    alt = '',
    title = '',
    sizes = '',
    preferredWidth = 640,
    quality = 75,
    width,
    height,
    className = '',
    loading = 'lazy',
    fetchPriority = '',
    ariaHidden = false,
  } = options
  let src = imageUrl
  let srcSet = ''
  let intrinsicWidth
  let intrinsicHeight

  try {
    const source = new URL(imageUrl)
    const dimensions = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (
      source.protocol === 'https:' &&
      source.hostname === 'cdn.sanity.io' &&
      /^\/images\/[^/]+\/[^/]+\//.test(source.pathname)
    ) {
      intrinsicWidth = dimensions ? Number(dimensions[1]) : undefined
      intrinsicHeight = dimensions ? Number(dimensions[2]) : undefined
      const buildUrl = (candidateWidth) => {
        const image = new URL(source)
        image.searchParams.set('w', String(intrinsicWidth ? Math.min(candidateWidth, intrinsicWidth) : candidateWidth))
        image.searchParams.set('fit', 'max')
        image.searchParams.set('auto', 'format')
        image.searchParams.set('q', String(Math.min(100, Math.max(1, Math.round(quality)))))
        return image.toString()
      }
      const candidates = [160, 240, 320, 480, 640, 720, 800, 960, 1200, 1600]
        .map((candidateWidth) => intrinsicWidth ? Math.min(candidateWidth, intrinsicWidth) : candidateWidth)
        .filter((candidateWidth, index, all) => candidateWidth > 0 && all.indexOf(candidateWidth) === index)
        .sort((a, b) => a - b)
      src = buildUrl(preferredWidth)
      srcSet = candidates.map((candidateWidth) => buildUrl(candidateWidth) + ' ' + candidateWidth + 'w').join(', ')
    }
  } catch {
    // Keep the original safe HTTPS URL for non-Sanity images.
  }

  const attributes = [
    'src="' + escapeHtml(src) + '"',
    srcSet ? 'srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes) + '"' : '',
    'alt="' + escapeHtml(alt) + '"',
    title ? 'title="' + escapeHtml(title) + '"' : '',
    width || intrinsicWidth ? 'width="' + escapeHtml(width || intrinsicWidth) + '"' : '',
    height || intrinsicHeight ? 'height="' + escapeHtml(height || intrinsicHeight) + '"' : '',
    'loading="' + escapeHtml(loading) + '"',
    fetchPriority ? 'fetchpriority="' + escapeHtml(fetchPriority) + '"' : '',
    'decoding="async"',
    className ? 'class="' + escapeHtml(className) + '"' : '',
    ariaHidden ? 'aria-hidden="true"' : '',
  ].filter(Boolean).join(' ')
  return '<img ' + attributes + ' />'
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



function selectVisibleEquipmentCategories(categories) {
  const items = Array.isArray(categories) ? categories : []
  const byId = new Map(items.map((item) => [item._id, item]))
  const visibleIds = new Set()

  items.forEach((category) => {
    if ((category.productCount || 0) <= 0) return
    let current = category
    const visited = new Set()
    while (current && !visited.has(current._id)) {
      visited.add(current._id)
      visibleIds.add(current._id)
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
  })

  const visible = items.filter((category) =>
    !String(category._id || '').startsWith('plants-') &&
    category.slug?.current !== 'electromagnetic-valves' &&
    visibleIds.has(category._id)
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

function plantDisplayName(product, language) {
  const localizedName = String(localize(product, 'name', language) || '').trim()
  if (localizedName) return localizedName
  const localizedH1 = language === 'bg' ? '' : product?.translations?.[language]?.seo?.h1
  return String(localizedH1 || product?.name || product?.seo?.h1 || '').trim()
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

function renderCategoryCard(category, language, equipment = false, index = 0) {
  const name = localize(category, 'name', language) || category.name || ''
  const slug = category.slug?.current || category._id
  const imageUrl = safeImageUrl(category.imageUrl)
  const alt = categoryImageText(category, language, 'alt')
  const title = categoryImageText(category, language, 'title')
  const sizes = equipment
    ? '(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 33vw'
    : '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'
  const image = imageUrl
    ? responsiveImage(imageUrl, {
        alt,
        title,
        sizes,
        width: 800,
        height: 600,
        className: equipment
          ? 'h-full w-full object-contain'
          : 'h-full w-full object-cover transition duration-300 group-hover:scale-105',
      })
    : ''
  if (equipment) {
    const isMainCategory = slug === 'vsichko-za-polivane' || index === 0
    const cardClass = 'overflow-hidden rounded-xl border transition cursor-pointer flex flex-col items-center text-center group no-underline ' +
      (isMainCategory
        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm hover:shadow-md'
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md')
    return '<li><a class="' + cardClass + '" href="' + escapeHtml(href('/category/' + encodeURIComponent(slug), language)) + '">' +
      '<div class="h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-white flex items-center justify-center">' +
      (image || '<span class="text-xs text-slate-400">' + escapeHtml(copyNoImage(language)) + '</span>') +
      '</div><div class="w-full p-3 text-center md:p-4"><h4 class="font-bold text-xs sm:text-sm md:text-base group-hover:text-emerald-700 transition line-clamp-2 ' +
      (isMainCategory ? 'text-emerald-900 font-extrabold' : 'text-slate-800') + '">' + escapeHtml(name) + '</h4></div></a></li>'
  }
  const fallbackEmojis = ['🌴', '🫒', '🍋', '🌲', '🌹', '🌵', '🌳']
  return '<li><a class="group overflow-hidden rounded-xl border border-[#E2E6D8] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#B9C79C] hover:shadow-md no-underline" href="' +
    escapeHtml(href('/category/' + encodeURIComponent(slug), language)) + '">' +
    '<div class="relative h-28 sm:h-36 md:h-44 overflow-hidden bg-gradient-to-br from-[#EEF1E4] via-[#F7F7F1] to-[#E7EBD9] flex items-center justify-center">' +
    (image || '<span aria-hidden="true" class="text-5xl">' + fallbackEmojis[index % fallbackEmojis.length] + '</span>') +
    '</div><div class="p-3 md:p-4"><h4 class="font-bold text-sm md:text-base text-slate-900 group-hover:text-[#647746]">' +
    escapeHtml(name) + '</h4><span class="mt-2 inline-block text-xs font-semibold text-[#71814F]">' +
    escapeHtml(language === 'ru' ? 'Посмотреть' : language === 'en' ? 'Explore' : 'Разгледайте') + ' →</span></div></a></li>'
}

function copyNoImage(language) {
  return language === 'ru' ? 'Нет изображения' : language === 'en' ? 'No image' : 'Няма снимка'
}

function renderPlantCard(product, language, copy) {
  const name = plantDisplayName(product, language)
  const slug = product.slug?.current || product._id
  const plantPrice = getPlantPrice(product)
  if (!plantPrice) return ''
  const status = plantStatus(product)
  const imageUrl = safeImageUrl(product.imageUrl)
  const image = imageUrl
    ? responsiveImage(imageUrl, {
        alt: imageText(name, language, 'alt'),
        sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw',
        className: 'h-full w-full object-contain p-2 transition duration-300 hover:scale-[1.02] sm:p-4',
      })
    : '<span class="text-sm text-slate-400">' + escapeHtml(copy.noImage) + '</span>'
  return '<li><article class="overflow-hidden rounded-xl border border-[#E2E6D8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">' +
    '<a class="block text-left no-underline" href="' + escapeHtml(href('/product/' + encodeURIComponent(slug), language)) + '">' +
    '<div class="flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#F7F8F1]">' + image + '</div>' +
    '<div class="p-3 sm:p-4"><h4 class="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 sm:text-base">' + escapeHtml(name) + '</h4>' +
    (product.scientificName ? '<p class="mt-1 line-clamp-1 text-xs italic text-slate-500">' + escapeHtml(product.scientificName) + '</p>' : '') +
    '<p class="mt-3 text-base font-extrabold text-[#34452D] sm:text-lg">' + (plantPrice.from ? escapeHtml(copy.from) + ' ' : '') + plantPrice.price.toFixed(2) + ' €</p>' +
    (product.vatIncluded === true ? '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(copy.vat) + '</p>' : '') +
    '<p class="mt-2 text-xs font-semibold ' + (status === 'inStock' ? 'text-emerald-700' : 'text-amber-700') + '">' + escapeHtml(availabilityLabel(status, copy)) + '</p>' +
    '<span class="mt-3 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.viewPlant) + ' →</span></div></a></article></li>'
}

function renderEquipmentCard(product, language, copy) {
  const name = localize(product, 'name', language) || product.name || ''
  const slug = product.slug?.current || product._id
  const imageUrl = safeImageUrl(product.imageUrl)
  const image = imageUrl
    ? responsiveImage(imageUrl, {
        alt: imageText(name, language, 'alt'),
        sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw',
        className: 'h-full w-full object-contain p-2 transition duration-300 hover:scale-[1.02] sm:p-4',
      })
    : '<span class="text-sm text-slate-400">' + escapeHtml(copy.noImage) + '</span>'
  return '<li><article class="overflow-hidden rounded-xl border border-[#E2E6D8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">' +
    '<a class="block text-left no-underline" href="' + escapeHtml(href('/product/' + encodeURIComponent(slug), language)) + '">' +
    '<div class="flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#F7F8F1]">' + image + '</div>' +
    '<div class="p-3 sm:p-4"><h4 class="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 sm:text-base">' + escapeHtml(name) + '</h4>' +
    '<p class="mt-3 text-base font-extrabold text-[#34452D] sm:text-lg">' + Number(product.priceEUR).toFixed(2) + ' €</p>' +
    (product.vatIncluded === true ? '<p class="mt-1 text-xs text-slate-500">' + escapeHtml(copy.vat) + '</p>' : '') +
    '<p class="mt-2 text-xs font-semibold ' + (product.stockStatus === 'inStock' ? 'text-emerald-700' : 'text-amber-700') + '">' +
    escapeHtml(availabilityLabel(product.stockStatus === 'inStock' ? 'inStock' : product.stockStatus === 'outOfStock' ? 'outOfStock' : 'onRequest', copy)) + '</p>' +
    '<span class="mt-3 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.viewKit) + ' →</span></div></a></article></li>'
}

function renderServiceCard(entry, language, copy) {
  const imageSizes = '(min-width: 768px) 33vw, 50vw'
  if (entry.kind === 'delivery') {
    const image = responsiveImage(DELIVERY_IMAGE, {
      alt: copy.deliveryAlt,
      sizes: imageSizes,
      width: 800,
      height: 600,
      className: 'h-full w-full object-cover',
    })
    return '<li><a class="overflow-hidden rounded-xl border border-[#DDE3D0] bg-white/85 shadow-sm backdrop-blur-md flex flex-col justify-between hover:bg-white hover:border-[#B9C79C] hover:shadow-md transition cursor-pointer text-slate-800 no-underline" href="' +
      escapeHtml(href('/services/dostavka-poliv', language)) + '"><div><div class="h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-[#E9EDDB]">' + image +
      '</div><div class="p-3 md:p-4"><h4 class="text-sm md:text-xl font-bold mb-1 leading-snug">' + escapeHtml(copy.deliveryTitle) +
      '</h4><p class="text-xs leading-relaxed text-slate-600 md:text-sm">' + escapeHtml(copy.deliveryText) +
      '</p><span class="mt-3 inline-flex text-xs font-bold text-[#647746]">' + escapeHtml(copy.learnMore) + ' →</span></div></div></a></li>'
  }
  const service = entry.service || {}
  const name = localize(service, 'name', language) || service.name || ''
  const slug = service.slug?.current || service._id
  const imageUrl = safeImageUrl(service.imageUrl)
  const image = imageUrl
    ? responsiveImage(imageUrl, {
        alt: name,
        sizes: imageSizes,
        width: 800,
        height: 600,
        className: 'h-full w-full object-cover',
      })
    : '<div class="flex h-full items-center justify-center p-2 text-center"><span class="font-bold text-slate-800 text-xs md:text-base block">' + escapeHtml(name) + '</span></div>'
  const summary = serviceSummary(service, language)
  return '<li><a class="overflow-hidden rounded-xl border border-[#DDE3D0] bg-white/85 shadow-sm backdrop-blur-md flex flex-col justify-between hover:bg-white hover:border-[#B9C79C] hover:shadow-md transition cursor-pointer text-slate-800 no-underline" href="' +
    escapeHtml(href('/services/' + encodeURIComponent(slug), language)) + '"><div><div class="h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-[#E9EDDB]">' + image +
    '</div><div class="p-3 md:p-4"><h4 class="text-sm md:text-xl font-bold mb-1 leading-snug">' + escapeHtml(name) +
    '</h4>' + (summary ? '<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 md:text-sm">' + escapeHtml(summary) + '</p>' : '') +
    '<span class="mt-3 inline-flex text-xs font-bold text-[#647746]">' + escapeHtml(copy.learnMore) + ' →</span></div></div></a></li>'
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
  const image = imageUrl
    ? responsiveImage(imageUrl, {
        alt,
        sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
        className: 'h-52 w-full object-cover',
      })
    : '<div class="flex h-52 items-center justify-center bg-[#E9EDDB] text-4xl" aria-hidden="true">🌿</div>'
  return '<li><article class="overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><a class="block no-underline" href="' +
    escapeHtml(href('/blog/' + encodeURIComponent(slug), language)) + '">' + image +
    '<div class="p-5">' + (post.publishedAt ? '<time datetime="' + escapeHtml(post.publishedAt) + '" class="text-xs font-medium text-slate-500">' + escapeHtml(formatDate(post.publishedAt, language)) + '</time>' : '') +
    '<h4 class="mt-2 text-lg font-bold leading-snug text-slate-900">' + escapeHtml(title) + '</h4>' +
    (description ? '<p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">' + escapeHtml(description) + '</p>' : '') +
    '<span class="mt-4 inline-flex text-sm font-bold text-[#647746]">' + escapeHtml(copy.readMore) + ' →</span></div></a></article></li>'
}

export function renderHomepageHtml(data, language = 'bg') {
  const lang = language === 'ru' || language === 'en' ? language : 'bg'
  const copy = COPY[lang]
  const heroImage = safeImageUrl(data.heroImageUrl) || HERO_FALLBACK
  const plantCategories = selectVisiblePlantCategories(data.plantCategories)
  const equipmentCategories = selectVisibleEquipmentCategories(data.equipmentCategories)
  const plantRootCategory = plantCategories.find((category) => category._id === 'plants-root' || category.slug?.current === 'rastenia')
  const readyKitsCategory = equipmentCategories.find((category) => category.slug?.current === 'gotovi-komplekti-za-polivane')
  const plants = selectVisiblePlants(data.featuredPlants)
  const equipment = selectVisibleEquipment(data.featuredEquipment)
  const serviceEntries = (data.serviceEntries || []).slice(0, 6)
  const pinned = Array.isArray(data.pinnedPosts) ? data.pinnedPosts : []
  const pinnedSlugs = new Set(pinned.map((post) => typeof post.slug === 'string' ? post.slug : post.slug?.current).filter(Boolean))
  const latest = (Array.isArray(data.latestPosts) ? data.latestPosts : [])
    .filter((post) => !pinnedSlugs.has(typeof post.slug === 'string' ? post.slug : post.slug?.current))
    .slice(0, 1)
  const blogPosts = [...pinned, ...latest]

  const serviceCards = serviceEntries.map((entry) => renderServiceCard(entry, lang, copy)).join('')
  const plantCategoryCards = plantCategories.map((category, index) => renderCategoryCard(category, lang, false, index)).join('')
  const plantCards = plants.map((product) => renderPlantCard(product, lang, copy)).join('')
  const equipmentCategoryCards = equipmentCategories.map((category, index) => renderCategoryCard(category, lang, true, index)).join('')
  const equipmentCards = equipment.map((product) => renderEquipmentCard(product, lang, copy)).join('')
  const blogCards = blogPosts.map((post) => renderBlogCard(post, lang, copy)).join('')

  return '<main data-florial-ssr-homepage="v1">' +
    '<section class="relative isolate overflow-hidden bg-[#F7F8F1] px-4 py-12 text-slate-800 md:py-16">' +
      responsiveImage(heroImage, { alt: '', sizes: '100vw', preferredWidth: 1600, loading: 'eager', fetchPriority: 'high', ariaHidden: true, className: 'absolute inset-0 h-full w-full object-cover object-center' }) +
      '<div aria-hidden="true" class="absolute inset-0" style="background-color:rgba(247,248,241,0.68)"></div>' +
      '<div class="relative z-10 mx-auto max-w-5xl text-center">' +
        '<h1 class="mb-3 text-4xl font-extrabold tracking-tight text-[#263323] md:text-6xl">' + escapeHtml(copy.heroTitle) + '</h1>' +
        '<h2 class="mb-5 text-xl font-bold tracking-tight text-[#263323] md:text-3xl">' + escapeHtml(copy.heroSubtitle) + '</h2>' +
        '<p class="mx-auto max-w-4xl text-sm font-semibold leading-relaxed text-[#11150F] md:text-lg">' + escapeHtml(copy.heroText) + '</p>' +
        '<div class="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">' +
          '<a href="' + escapeHtml(href('/category/rastenia', lang)) + '" class="inline-flex w-4/5 max-w-[208px] items-center justify-start gap-3 rounded-xl bg-[#647746] px-3 py-3 text-left text-base font-bold text-white shadow-lg shadow-[#647746]/20 transition hover:-translate-y-0.5 hover:bg-[#53643A] hover:shadow-xl no-underline sm:w-[208px]">' +
            (plantRootCategory?.imageUrl ? responsiveImage(plantRootCategory.imageUrl, { alt: '', sizes: '48px', className: 'h-12 w-12 shrink-0 rounded-lg object-cover', ariaHidden: true }) : '') +
            '<span class="flex-1">' + escapeHtml(copy.plantsCta) + '</span><span aria-hidden="true">→</span></a>' +
          '<a href="' + escapeHtml(href('/category/vsichko-za-polivane', lang)) + '" class="inline-flex w-4/5 max-w-[208px] items-center justify-start gap-3 rounded-xl border-2 border-[#647746] bg-white/95 px-3 py-[10px] text-left text-base font-bold text-[#34452D] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F3F5EC] no-underline sm:w-[208px]">' +
            (readyKitsCategory?.imageUrl ? responsiveImage(readyKitsCategory.imageUrl, { alt: '', sizes: '48px', className: 'h-12 w-12 shrink-0 rounded-lg object-cover', ariaHidden: true }) : '') +
            '<span class="flex-1">' + escapeHtml(copy.equipmentCta) + '</span><span aria-hidden="true">→</span></a>' +
        '</div><a href="' + escapeHtml(href('/about', lang)) + '" class="mt-4 inline-flex text-sm font-semibold text-[#34452D] underline decoration-[#B9C79C] underline-offset-4 transition hover:text-[#263323]">' + escapeHtml(copy.aboutCta) + '</a>' +
        '</div></section>' +
    '<section aria-label="' + escapeHtml(copy.why) + '" class="border-b border-[#E4E8DA] bg-white px-4 py-5 md:py-6">' +
      '<div class="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">' +
        [['25+', copy.years, copy.yearsDetail], ['🌿', copy.plantsDetailTitle, copy.plantsDetail], ['⌖', copy.region, copy.regionDetail], ['✓', copy.design, copy.designDetail]].map(([mark, title, detail]) => 
          '<div class="flex items-center gap-3"><span aria-hidden="true" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DDE3D0] bg-[#F3F5EC] text-base font-extrabold text-[#647746]">' + mark + '</span><div class="min-w-0"><p class="text-sm font-bold leading-snug text-[#34452D]">' + escapeHtml(title) + '</p><p class="mt-0.5 text-xs leading-snug text-slate-500">' + escapeHtml(detail) + '</p></div></div>'
        ).join('') +
      '</div></section>' +
    '<section class="bg-[#EEF1E4] text-slate-800 py-5 md:py-6 px-4"><div class="max-w-7xl mx-auto text-center"><div class="mt-1 text-left"><div class="mb-5">' +
      '<div class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 md:grid-cols-[1fr_auto_1fr] md:gap-6">' +
        '<span class="order-1 block text-[10px] font-bold uppercase tracking-widest text-left text-[#697A49] md:text-xs">' + escapeHtml(copy.serviceEyebrow) + '</span>' +
        '<h3 class="order-3 col-span-2 mt-0 text-center text-xl font-bold text-slate-900 md:order-2 md:col-span-1 md:whitespace-nowrap md:text-2xl">' + escapeHtml(copy.services) + '</h3>' +
        '<a href="' + escapeHtml(href('/services', lang)) + '" class="order-2 inline-flex shrink-0 items-center justify-self-end rounded-lg border border-[#B9C79C] bg-white px-3 py-2 text-sm font-bold text-[#34452D] shadow-sm transition hover:border-[#8E9F6C] hover:bg-[#F3F5EC] md:order-3 md:justify-self-end md:px-4 md:font-semibold">' + escapeHtml(copy.allServices) + ' →</a>' +
      '</div></div><ul class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">' + serviceCards + '</ul></div></div></section>' +
    '<section class="border-y border-[#E7EBDD] bg-[#F7F8F1]"><div class="mx-auto max-w-7xl px-4 py-10">' +
      '<div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between"><h3 class="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">' + escapeHtml(copy.plants) + '</h3><p class="mt-0 max-w-2xl text-sm md:text-base text-slate-600 sm:max-w-[48%] sm:text-right">' + escapeHtml(copy.plantsIntro) + '</p></div>' +
      (plantCategoryCards ? '<ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">' + plantCategoryCards + '</ul>' : '') +
      '<div class="mt-6 text-center"><a href="' + escapeHtml(href('/category/rastenia', lang)) + '" class="inline-flex items-center justify-center rounded-lg bg-[#647746] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#53643A] no-underline">' + escapeHtml(lang === 'ru' ? 'Перейти в каталог растений' : lang === 'en' ? 'View all plants' : 'Към каталога с растения') + ' →</a></div>' +
      '</div></section>' +
      (plants.length ? '<section class="border-b border-[#E7EBDD] bg-white px-4 py-10 md:py-12"><div class="mx-auto max-w-7xl">' +
        '<div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 class="text-2xl font-extrabold text-slate-900 md:text-3xl">' + escapeHtml(copy.featuredPlants) + '</h3><p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">' + escapeHtml(copy.featuredPlantsIntro) + '</p></div><a href="' + escapeHtml(href('/category/rastenia', lang)) + '" class="inline-flex w-fit items-center text-sm font-bold text-[#647746] no-underline hover:text-[#34452D]">' + escapeHtml(copy.allPlants) + ' →</a></div>' +
        '<ul class="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">' + plantCards + '</ul></div></section>' : '') +
    '<section class="max-w-7xl mx-auto px-4 pt-10 pb-5 flex-grow w-full bg-[#EEF1E4]">' +
      '<div class="relative mb-4 flex flex-col items-center gap-3 md:block"><h3 class="text-2xl md:text-3xl font-bold text-slate-900 text-center">' + escapeHtml(copy.irrigation) + '</h3></div>' +
      (equipmentCategoryCards ? '<div class="mb-6"><ul class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">' + equipmentCategoryCards + '</ul><div class="mt-6 text-center"><a href="' + escapeHtml(href('/category/vsichko-za-polivane', lang)) + '" class="inline-flex items-center justify-center rounded-lg bg-[#647746] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#53643A] no-underline">' + escapeHtml(copy.allEquipment) + ' →</a></div></div>' : '') +
      (equipment.length ? '<section class="mt-10 border-t border-[#DDE3D0] pt-8 pb-3"><div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 class="text-2xl font-extrabold text-slate-900 md:text-3xl">' + escapeHtml(copy.featuredEquipment) + '</h3><p class="mt-1 text-sm text-slate-600">' + escapeHtml(copy.equipmentIntro) + '</p></div><a href="' + escapeHtml(href('/category/gotovi-komplekti-za-polivane', lang)) + '" class="inline-flex w-fit items-center text-sm font-bold text-[#53643A] underline decoration-[#B9C79C] underline-offset-4 hover:text-[#34452D]">' + escapeHtml(copy.allKits) + ' →</a></div>' +
        '<ul class="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">' + equipmentCards + '</ul></section>' : '') +
    '</section>' +
    '<section class="border-t border-[#E4E8DA] bg-[#F7F8F1] px-4 py-10 md:py-14"><div class="mx-auto max-w-7xl">' +
      '<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><h3 class="mt-1 text-2xl font-extrabold text-slate-900 md:text-3xl">' + escapeHtml(copy.blog) + '</h3><a href="' + escapeHtml(href('/blog', lang)) + '" class="inline-flex w-fit items-center rounded-lg border border-[#B9C79C] bg-white px-4 py-2.5 text-sm font-semibold text-[#53643A] no-underline transition hover:bg-[#F0F3E8]">' + escapeHtml(copy.allArticles) + ' →</a></div>' +
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
