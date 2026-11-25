import {
  classifyRichTextHref,
  formatKitQuantity,
  getKitComponentDisplayRows,
  isKitComponentLinkable,
  preferFormattedDescription,
  toPlainText,
} from '../../src/lib/richTextUtils.mjs'

const IMAGE_LOCATIONS = {
  bg: ['Несебър', 'Равда', 'Слънчев бряг', 'Свети Влас', 'Поморие'],
  ru: ['Несебре', 'Равде', 'Солнечном Берегу', 'Свети-Власе', 'Поморие'],
  en: ['Nessebar', 'Ravda', 'Sunny Beach', 'Sveti Vlas', 'Pomorie'],
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function localizedHref(href, language, siteUrl) {
  const kind = classifyRichTextHref(href)
  if (kind === 'unsafe') return ''
  if (kind === 'anchor' || kind === 'contact' || kind === 'external') return href.trim()
  try {
    const url = new URL(href, siteUrl)
    url.searchParams.delete('lang')
    if (language === 'ru' || language === 'en') url.searchParams.set('lang', language)
    return url.origin + url.pathname + url.search + url.hash
  } catch {
    return ''
  }
}

function localizedValue(document, field, language) {
  const translated = document?.translations?.[language]?.[field]
  if (translated !== undefined && translated !== null && translated !== '') return translated
  const fallback = document?.translations?.bg?.[field]
  if (fallback !== undefined && fallback !== null && fallback !== '') return fallback
  return document?.[field]
}

function productImageText(productName, language, imageIndex, kind) {
  const locale = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const locations = IMAGE_LOCATIONS[locale]
  const location = locations[Math.max(0, imageIndex) % locations.length]
  if (locale === 'ru') return kind === 'title' ? 'Продажа ' + productName + ' в ' + location : 'Купить ' + productName + ' в ' + location
  if (locale === 'en') return kind === 'title' ? productName + ' for sale in ' + location : 'Buy ' + productName + ' in ' + location
  return kind === 'title' ? 'Продажба на ' + productName + ' в ' + location : 'Купете ' + productName + ' в ' + location
}

function imageCandidates(product, language, siteUrl) {
  const name = text(localizedValue(product, 'name', language)) || text(product?.name)
  const candidates = [{
    url: product?.imageUrl,
    alt: language === 'ru' ? product?.imageAltRu || product?.imageAlt : language === 'en' ? product?.imageAltEn || product?.imageAlt : product?.imageAlt,
  }]
  for (const image of Array.isArray(product?.galleryImages) ? product.galleryImages : []) {
    if (typeof image === 'string') {
      candidates.push({ url: image, alt: name })
    } else if (image && typeof image === 'object') {
      candidates.push({
        url: image.url,
        alt: language === 'ru' ? image.altRu || image.alt : language === 'en' ? image.altEn || image.alt : image.alt,
      })
    }
  }
  const seen = new Set()
  return candidates.filter((candidate) => {
    const url = safeHttpUrl(candidate.url)
    if (!url || seen.has(url)) return false
    seen.add(url)
    candidate.url = url
    return true
  }).map((candidate, index) => ({
    ...candidate,
    alt: text(candidate.alt) || productImageText(name, language, index, 'alt'),
    title: productImageText(name, language, index, 'title'),
  }))
}

function responsiveImage(url, alt, title, options = {}) {
  const safeUrl = safeHttpUrl(url)
  if (!safeUrl) return ''
  let src = safeUrl
  let srcSet = ''
  let dimensions = ''
  const preferredWidth = options.preferredWidth || 1200
  const sizes = options.sizes || '(min-width: 1024px) 50vw, 100vw'
  try {
    const source = new URL(safeUrl)
    const dimensionsMatch = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (source.protocol === 'https:' && source.hostname === 'cdn.sanity.io' &&
      /^\/images\/[^/]+\/[^/]+\//.test(source.pathname) && dimensionsMatch) {
      const sourceWidth = Number(dimensionsMatch[1])
      const sourceHeight = Number(dimensionsMatch[2])
      const buildUrl = (width) => {
        const image = new URL(source)
        image.searchParams.set('w', String(Math.min(width, sourceWidth)))
        image.searchParams.set('fit', 'max')
        image.searchParams.set('auto', 'format')
        image.searchParams.set('q', '75')
        return image.toString()
      }
      const candidates = [160, 240, 320, 480, 640, 800, 960, 1200, 1600]
        .map((width) => Math.min(width, sourceWidth))
        .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
        .sort((a, b) => a - b)
      src = buildUrl(preferredWidth)
      srcSet = candidates.map((width) => buildUrl(width) + ' ' + width + 'w').join(', ')
      dimensions = ' width="' + sourceWidth + '" height="' + sourceHeight + '"'
    }
  } catch {
    // Keep the validated original HTTP(S) URL.
  }
  const responsive = srcSet
    ? ' srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes) + '"'
    : ''
  const loading = options.priority ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"'
  return '<img src="' + escapeHtml(src) + '"' + responsive + dimensions +
    ' alt="' + escapeHtml(alt) + '" title="' + escapeHtml(title || alt) + '"' +
    loading + ' decoding="async" class="' + escapeHtml(options.className || 'h-full w-full object-contain') + '" />'
}

function renderInline(block, language, siteUrl) {
  if (!Array.isArray(block?.children)) return ''
  return block.children.map((child) => {
    let output = escapeHtml(typeof child?.text === 'string' ? child.text : '')
    const marks = Array.isArray(child?.marks) ? child.marks : []
    if (marks.includes('strong')) output = '<strong>' + output + '</strong>'
    if (marks.includes('em')) output = '<em>' + output + '</em>'
    if (marks.includes('underline')) output = '<u>' + output + '</u>'
    const link = (Array.isArray(block.markDefs) ? block.markDefs : []).find((definition) =>
      definition?._type === 'link' && definition?._key && marks.includes(definition._key)
    )
    if (link?.href) {
      const kind = classifyRichTextHref(link.href)
      const href = localizedHref(link.href, language, siteUrl)
      if (href) {
        const target = kind === 'external' ? ' target="_blank" rel="noopener noreferrer"' : ''
        output = '<a href="' + escapeHtml(href) + '"' + target + ' class="font-medium text-emerald-700 underline underline-offset-2">' + output + '</a>'
      }
    }
    return output
  }).join('')
}

export function renderEquipmentProductRichText(value, language, siteUrl) {
  if (typeof value === 'string') {
    return value.trim()
      ? '<p class="whitespace-pre-line leading-relaxed">' + escapeHtml(value) + '</p>'
      : ''
  }
  if (!Array.isArray(value) || value.length === 0) return ''
  const output = []
  let index = 0
  while (index < value.length) {
    const block = value[index]
    if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
      index += 1
      continue
    }
    if (block.listItem === 'bullet' || block.listItem === 'number') {
      const listType = block.listItem
      const list = []
      while (index < value.length && value[index]?._type === 'block' &&
        value[index]?.listItem === listType && Array.isArray(value[index]?.children)) {
        list.push(value[index])
        index += 1
      }
      const tag = listType === 'number' ? 'ol' : 'ul'
      const classes = listType === 'number' ? 'list-decimal space-y-1 pl-6' : 'list-disc space-y-1 pl-6'
      output.push('<' + tag + ' class="' + classes + '">' +
        list.map((item) => '<li class="pl-1">' + renderInline(item, language, siteUrl) + '</li>').join('') +
        '</' + tag + '>')
      continue
    }
    const content = renderInline(block, language, siteUrl)
    if (block.style === 'h2') output.push('<h2 class="mt-6 mb-3 text-xl font-bold text-slate-900">' + content + '</h2>')
    else if (block.style === 'h3') output.push('<h3 class="mt-5 mb-2 text-lg font-semibold text-slate-800">' + content + '</h3>')
    else if (block.style === 'blockquote') output.push('<blockquote class="border-l-4 border-slate-200 pl-4 italic text-slate-600">' + content + '</blockquote>')
    else output.push('<p class="leading-relaxed">' + content + '</p>')
    index += 1
  }
  return '<div class="space-y-3">' + output.join('') + '</div>'
}

function categoryTrail(product, categories) {
  const all = Array.isArray(categories) ? categories : []
  const root = all.find((item) => item.slugValue === 'vsichko-za-polivane')
  const byId = new Map(all.map((item) => [item._id, item]))
  const assigned = (Array.isArray(product?.categories) ? product.categories : [])
    .map((item) => byId.get(item?._id) || item)
    .filter((item) => item && item._id !== root?._id && item.slugValue !== 'vsichko-za-polivane')
  const depth = (candidate) => {
    let current = candidate
    let result = 0
    const seen = new Set()
    while (current?.parentId && !seen.has(current._id)) {
      seen.add(current._id)
      current = byId.get(current.parentId)
      result += 1
    }
    return result
  }
  const primary = assigned.slice().sort((a, b) => depth(b) - depth(a))[0]
    || (product?.categoryId ? byId.get(product.categoryId) : undefined)
  const trail = []
  let current = primary
  const seen = new Set()
  while (current && !seen.has(current._id)) {
    seen.add(current._id)
    if (current._id !== root?._id && current.slugValue !== 'vsichko-za-polivane') trail.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return trail
}

function renderBreadcrumbs(product, categories, language, siteUrl, productName) {
  const rootLabel = language === 'ru' ? 'Каталог' : language === 'en' ? 'Catalogue' : 'Каталог'
  const rootUrl = localizedHref('/category/vsichko-za-polivane', language, siteUrl)
  const trail = categoryTrail(product, categories)
  const links = [
    '<a href="' + escapeHtml(localizedHref('/', language, siteUrl)) + '" class="hover:text-emerald-700"> ' +
      (language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало') + '</a>',
    '<a href="' + escapeHtml(rootUrl) + '" class="hover:text-emerald-700">' + rootLabel + '</a>',
    ...trail.map((item) => {
      const label = text(item.translations?.[language]?.name) || text(item.name)
      const path = '/category/' + encodeURIComponent(item.slugValue || item._id)
      return '<a href="' + escapeHtml(localizedHref(path, language, siteUrl)) + '" class="hover:text-emerald-700">' + escapeHtml(label) + '</a>'
    }),
  ]
  return '<nav aria-label="Breadcrumb" class="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">' +
    links.join('<span aria-hidden="true">/</span>') +
    '<span aria-hidden="true">/</span><span class="font-medium text-slate-800">' + escapeHtml(productName) + '</span></nav>'
}

function renderPriceAndStock(product, language) {
  const price = typeof product?.priceEUR === 'number' && Number.isFinite(product.priceEUR) && product.priceEUR > 0
    ? product.priceEUR
    : null
  const oldPrice = typeof product?.oldPriceEUR === 'number' && Number.isFinite(product.oldPriceEUR) && product.oldPriceEUR > (price || 0)
    ? product.oldPriceEUR
    : null
  const discount = price && oldPrice ? Math.round((oldPrice - price) / oldPrice * 100) : 0
  const stock = product?.stockStatus
  const stockLabel = stock === 'inStock'
    ? (language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност')
    : stock === 'outOfStock'
      ? (language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Изчерпан')
      : stock === 'onRequest'
        ? (language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка')
        : ''
  const priceLabel = price === null
    ? (language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване')
    : price.toFixed(2) + ' €'
  return '<div class="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-4 shadow-sm sm:p-5">' +
    '<div class="flex flex-wrap items-baseline gap-3"><span class="text-3xl font-extrabold tracking-tight text-emerald-900">' + priceLabel + '</span>' +
    (oldPrice && price ? '<span class="text-lg text-slate-400 line-through">' + oldPrice.toFixed(2) + ' €</span>' +
      '<span class="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">−' + discount + '%</span>' : '') +
    '</div>' +
    (price && oldPrice ? '<p class="mt-1 text-sm font-semibold text-emerald-800">' +
      (language === 'ru' ? 'Экономия: ' : language === 'en' ? 'You save: ' : 'Спестявате: ') + (oldPrice - price).toFixed(2) + ' €</p>' : '') +
    '<p class="mt-1 text-sm text-slate-600">' +
      (language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.') + '</p>' +
    (stockLabel ? '<div class="mt-4 border-t border-emerald-100 pt-3"><span class="inline-flex rounded-full px-3 py-1.5 text-xs font-bold ' +
      (stock === 'outOfStock' ? 'bg-rose-100 text-rose-800' : stock === 'onRequest' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') +
      '">' + stockLabel + '</span></div>' : '') +
    '</div>'
}

function renderSpecifications(specifications, language, featuredOnly = false) {
  const items = (Array.isArray(specifications) ? specifications : []).filter((spec) =>
    text(spec?.name) && text(spec?.value)
  )
  const visible = featuredOnly ? items.slice(0, 3) : items
  if (!visible.length) return ''
  return '<div class="' + (featuredOnly ? 'mt-4 grid grid-cols-1 gap-2 border-t border-emerald-100 pt-4 sm:grid-cols-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2') + '">' +
    visible.map((spec) => {
      const name = text(spec.translations?.[language]?.name) || text(spec.name)
      const value = text(spec.translations?.[language]?.value) || text(spec.value)
      const unit = text(spec.unit)
      if (featuredOnly) {
        return '<div class="rounded-lg border border-white/80 bg-white/80 px-3 py-2.5"><p class="text-xs font-medium text-slate-500">' +
          escapeHtml(name) + '</p><p class="mt-1 text-sm font-bold text-slate-900">' + escapeHtml(value + (unit ? ' ' + unit : '')) + '</p></div>'
      }
      return '<div class="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"><span class="text-sm font-medium text-slate-600">' +
        escapeHtml(name) + '</span><span class="text-right text-sm font-bold text-slate-900">' + escapeHtml(value + (unit ? ' ' + unit : '')) + '</span></div>'
    }).join('') + '</div>'
}

function renderKitComponents(items, language, siteUrl) {
  const rows = getKitComponentDisplayRows(items)
  if (!rows.length) return ''
  const unitLabel = (unit) => unit === 'm' ? 'm' : language === 'en' ? 'pcs' : language === 'ru' ? 'шт.' : 'бр.'
  return '<section class="mb-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">' +
    '<h2 class="mb-5 text-xl font-bold text-slate-900">' + (language === 'ru' ? 'Состав комплекта' : language === 'en' ? 'Kit contents' : 'Състав на комплекта') + '</h2>' +
    '<div class="grid grid-cols-1 gap-3 md:grid-cols-2">' +
    rows.map((item) => {
      const product = item.product
      const name = text(product.translations?.[language]?.name) || text(product.name)
      const slug = typeof product.slug === 'string' ? product.slug : product.slug?.current || ''
      const note = text(item.note?.[language]) || text(item.note?.bg) || text(item.note?.en) || text(item.note?.ru)
      const quantity = formatKitQuantity(item.quantity, language)
      const image = safeHttpUrl(product.imageUrl)
      const linkable = isKitComponentLinkable(item) && Boolean(slug)
      const card = (image ? responsiveImage(image, name, name, { sizes: '56px', preferredWidth: 160, className: 'h-14 w-14 shrink-0 rounded-lg bg-slate-50 object-contain p-1' }) :
        '<span aria-hidden="true" class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">—</span>') +
        '<span class="min-w-0 flex-1"><span class="block font-semibold text-slate-800">' + escapeHtml(name) + '</span>' +
        (note ? '<span class="mt-1 block text-xs leading-5 text-slate-500">' + escapeHtml(note) + '</span>' : '') + '</span>' +
        (quantity ? '<span class="shrink-0 text-sm font-semibold tabular-nums text-slate-700">' + escapeHtml(quantity) + ' ' + unitLabel(item.unit) + '</span>' : '')
      return linkable
        ? '<a href="' + escapeHtml(localizedHref('/product/' + encodeURIComponent(slug), language, siteUrl)) + '" class="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 no-underline">' + card + '</a>'
        : '<div class="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">' + card + '</div>'
    }).join('') + '</div></section>'
}

function renderCompatibility(items, language) {
  const values = Array.isArray(items) ? items.filter((item) => text(item)) : []
  if (!values.length) return ''
  return '<section class="mb-12 rounded-2xl border border-cyan-100 bg-cyan-50/30 p-5 shadow-sm md:p-8">' +
    '<h2 class="mb-2 text-xl font-bold text-slate-900">' + (language === 'ru' ? 'Совместимость' : language === 'en' ? 'Compatibility' : 'Съвместимост') + '</h2>' +
    '<p class="mb-4 text-sm text-slate-600">' + (language === 'ru' ? 'Проверьте совместимость перед покупкой.' : language === 'en' ? 'Check compatibility before purchasing.' : 'Проверете съвместимостта преди покупка.') + '</p>' +
    '<div class="flex flex-wrap gap-2">' + values.map((item) =>
      '<span class="rounded-lg border border-cyan-100 bg-white px-3 py-2 text-sm font-medium text-slate-700">' + escapeHtml(item) + '</span>'
    ).join('') + '</div></section>'
}

function renderDocuments(product, language) {
  const manual = safeHttpUrl(product.manualPDFUrl)
  const catalog = safeHttpUrl(product.catalogPDFUrl)
  if (!manual && !catalog) return ''
  const title = language === 'ru' ? 'Документы и инструкции' : language === 'en' ? 'Documents and manuals' : 'Документи и инструкции'
  const intro = language === 'ru' ? 'Инструкции и каталоги производителя для ознакомления.' : language === 'en' ? 'Manufacturer manuals and catalogues for reference.' : 'Инструкции и каталози на производителя за справка.'
  const manualLabel = language === 'ru' ? 'Скачать инструкцию (PDF)' : language === 'en' ? 'Download manual (PDF)' : 'Изтегляне на инструкция (PDF)'
  const catalogLabel = language === 'ru' ? 'Скачать каталог (PDF)' : language === 'en' ? 'Download catalogue (PDF)' : 'Изтегляне на каталог (PDF)'
  const link = (url, label) => '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-sky-800">' +
    label + ' <span aria-hidden="true">↓</span></a>'
  return '<section class="mb-12 rounded-2xl border border-sky-100 bg-sky-50/30 p-5 shadow-sm md:p-8">' +
    '<h2 class="mb-2 text-xl font-bold text-slate-900">' + title + '</h2><p class="mb-4 text-sm text-slate-600">' + intro + '</p>' +
    '<div class="flex flex-col gap-2">' + (manual ? link(manual, manualLabel) : '') + (catalog ? link(catalog, catalogLabel) : '') + '</div></section>'
}

function renderRelatedContent(items, language, siteUrl) {
  const valid = (Array.isArray(items) ? items : []).filter((item) =>
    item?.slug?.current && (item._type === 'service' ? item.isActive !== false : item._type === 'blogPost' && item.isPublished === true)
  ).slice(0, 4)
  if (!valid.length) return ''
  const title = language === 'ru' ? 'Полезные материалы и услуги' : language === 'en' ? 'Useful resources and services' : 'Полезни материали и услуги'
  return '<section class="mb-12"><h2 class="text-xl font-bold text-slate-900 mb-6">' + title + '</h2>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">' +
    valid.map((item) => {
      const itemTitle = text(item.linkLabel) || (item._type === 'blogPost'
        ? text(item.translations?.[language]?.title) || text(item.translations?.bg?.title) || text(item.title)
        : text(item.translations?.[language]?.name) || text(item.name))
      const itemDescription = text(item.translations?.[language]?.shortDescription) || text(item.translations?.bg?.shortDescription) || text(item.shortDescription)
      const itemAlt = language === 'ru' ? text(item.imageAltRu) || text(item.imageAlt) || itemTitle :
        language === 'en' ? text(item.imageAltEn) || text(item.imageAlt) || itemTitle : text(item.imageAlt) || itemTitle
      const path = (item._type === 'service' ? '/services/' : '/blog/') + encodeURIComponent(item.slug.current)
      const href = localizedHref(path, language, siteUrl)
      const image = safeHttpUrl(item.imageUrl)
      return '<a href="' + escapeHtml(href) + '" class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm no-underline">' +
        (image ? responsiveImage(image, itemAlt, itemAlt, { sizes: '(min-width: 768px) 33vw, 50vw', preferredWidth: 640, className: 'h-40 w-full object-cover' }) : '<div class="h-40 bg-slate-100"></div>') +
        '<div class="p-4"><span class="text-xs font-semibold uppercase tracking-wide text-emerald-700">' +
        (item._type === 'service' ? (language === 'ru' ? 'Услуга Florial' : language === 'en' ? 'Florial service' : 'Услуга Florial') :
          (language === 'ru' ? 'Статья' : language === 'en' ? 'Article' : 'Статия')) +
        '</span><h3 class="mt-2 font-bold text-slate-900 leading-snug">' + escapeHtml(itemTitle) + '</h3>' +
        (itemDescription ? '<p class="mt-2 text-sm text-slate-600">' + escapeHtml(itemDescription) + '</p>' : '') +
        '<span class="mt-3 inline-block text-sm font-semibold text-emerald-700">' + (language === 'ru' ? 'Подробнее →' : language === 'en' ? 'Read more →' : 'Научете повече →') + '</span></div></a>'
    }).join('') + '</div></section>'
}

function renderRelatedProducts(items, currentId, language, siteUrl) {
  const valid = (Array.isArray(items) ? items : []).filter((item) =>
    item && item._id !== currentId && item.isActive !== false && item.slug?.current
  ).slice(0, 5)
  if (!valid.length) return ''
  const title = language === 'ru' ? 'С этим товаром покупают' : language === 'en' ? 'Frequently bought together' : 'Често купувани заедно'
  return '<section class="mb-12"><h2 class="text-xl font-bold text-slate-900 mb-6">' + title + '</h2>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">' +
    valid.map((item) => {
      const name = text(item.translations?.[language]?.name) || text(item.name)
      const href = localizedHref('/product/' + encodeURIComponent(item.slug.current), language, siteUrl)
      const image = safeHttpUrl(item.imageUrl)
      const price = typeof item.priceEUR === 'number' && item.priceEUR > 0 ? item.priceEUR.toFixed(2) + ' €' : ''
      return '<article class="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col">' +
        '<a href="' + escapeHtml(href) + '" class="no-underline flex-1">' +
        '<div class="h-36 bg-slate-50 rounded-lg mb-3 flex items-center justify-center">' +
        (image ? responsiveImage(image, productImageText(name, language, 0, 'alt'), productImageText(name, language, 0, 'title'), { sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw', preferredWidth: 320, className: 'h-full w-full object-contain p-2' }) :
          '<span class="text-xs text-slate-400">' + (language === 'ru' ? 'Нет изображения' : language === 'en' ? 'No image' : 'Няма снимка') + '</span>') +
        '</div><h3 class="font-bold text-slate-900 text-sm leading-snug mb-2">' + escapeHtml(name) + '</h3>' +
        (item.sku ? '<p class="text-xs text-slate-400 mb-2">SKU: ' + escapeHtml(item.sku) + '</p>' : '') +
        '</a><div class="mt-3 pt-3 border-t border-slate-100">' +
        (price ? '<p class="font-bold text-emerald-800 mb-1">' + price + '</p>' : '') +
        '<p class="text-xs text-slate-500">' + (language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.') + '</p>' +
        '</div></article>'
    }).join('') + '</div></section>'
}

export function renderEquipmentProductHtml(product, language, categories, siteUrl) {
  const localized = product?.translations?.[language] || {}
  const seo = language === 'bg' ? product?.seo : localized?.seo
  const name = text(localized.name) || text(product?.name)
  const h1 = text(seo?.h1) || name
  const description = preferFormattedDescription(localized.formattedDescription, localized.description || product?.description)
  const specifications = (Array.isArray(localized.specifications) && localized.specifications.length
    ? localized.specifications : product?.specifications || []).filter((spec) => text(spec?.name) && text(spec?.value))
  const compatibility = Array.isArray(localized.compatibility) && localized.compatibility.length
    ? localized.compatibility : product?.compatibility || []
  const images = imageCandidates(product, language, siteUrl)
  const hero = images[0]
  const shortDescription = text(localized.shortDescription) || text(product?.shortDescription)
  const gallery = images.slice(1)
  const featuredSpecs = renderSpecifications(specifications, language, true)
  const fullSpecs = specifications.length
    ? '<section class="mb-12 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">' +
      '<div class="mb-6 flex items-center justify-between gap-3"><div><h2 class="text-xl font-bold text-slate-900">' +
      (language === 'ru' ? 'Технические характеристики' : language === 'en' ? 'Technical specifications' : 'Технически характеристики') +
      '</h2><p class="mt-1 text-sm text-slate-500">' +
      (language === 'ru' ? 'Все указанные характеристики этого товара.' : language === 'en' ? 'All specifications provided for this product.' : 'Всички посочени параметри за този продукт.') +
      '</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">' + specifications.length + '</span></div>' +
      renderSpecifications(specifications, language) + '</section>'
    : ''
  const galleryHtml = gallery.length
    ? '<div class="flex gap-3 overflow-x-auto pb-2">' + gallery.map((image) =>
      '<a href="' + escapeHtml(image.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(image.alt) +
      '" class="w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 bg-slate-50">' +
      responsiveImage(image.url, image.alt, image.title, { sizes: '80px', preferredWidth: 200, className: 'w-full h-full object-contain p-1' }) +
      '</a>'
    ).join('') + '</div>'
    : ''
  const main = '<main class="flex-grow container mx-auto px-4 py-6 max-w-7xl">' +
    renderBreadcrumbs(product, categories, language, siteUrl, name) +
    '<section class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-12">' +
    '<div class="flex flex-col gap-4"><div class="w-full h-80 sm:h-96 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 relative">' +
    (hero ? responsiveImage(hero.url, hero.alt, hero.title, { priority: true, sizes: '(min-width: 1024px) 50vw, 100vw', preferredWidth: 1200, className: 'h-full w-full object-contain p-4' }) :
      '<span class="text-slate-400">' + (language === 'ru' ? 'Нет изображения' : language === 'en' ? 'No image' : 'Няма изображение') + '</span>') +
    (product?.stockStatus ? '<span class="absolute top-3 right-3 rounded-full px-3 py-1.5 text-xs font-bold ' +
      (product.stockStatus === 'outOfStock' ? 'bg-rose-100 text-rose-800' : product.stockStatus === 'onRequest' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') + '">' +
      (product.stockStatus === 'inStock' ? (language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност') :
        product.stockStatus === 'outOfStock' ? (language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Изчерпан') :
          (language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка')) +
      '</span>' : '') + '</div>' + galleryHtml + '</div>' +
    '<div class="flex flex-col justify-between"><div>' +
    (product?.sku ? '<p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">SKU: ' + escapeHtml(product.sku) + '</p>' : '') +
    '<h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">' + escapeHtml(h1) + '</h1>' +
    (shortDescription ? '<p class="mb-5 max-w-2xl rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 sm:text-base">' + escapeHtml(shortDescription) + '</p>' : '') +
    renderPriceAndStock(product, language) + featuredSpecs + '</div>' +
    '<div class="pt-6 border-t border-slate-100 flex flex-col gap-4"><p class="text-sm font-semibold text-slate-700">' +
    (language === 'ru' ? 'Количество: доступно в интерактивной корзине.' : language === 'en' ? 'Quantity: available in the interactive cart.' : 'Количество: налично в интерактивната количка.') +
    '</p></div></div></section>' +
    (fullSpecs ? fullSpecs : '') +
    (toPlainText(description).trim() ? '<section class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12"><h2 class="text-xl font-bold text-slate-900 mb-4">' +
      (language === 'ru' ? 'Описание' : language === 'en' ? 'Description' : 'Описание') + '</h2>' +
      renderEquipmentProductRichText(description, language, siteUrl) + '</section>' : '') +
    renderKitComponents(product?.kitComponents, language, siteUrl) +
    renderCompatibility(compatibility, language) +
    renderDocuments(product, language) +
    renderRelatedContent(product?.relatedContent, language, siteUrl) +
    renderRelatedProducts(product?.relatedProducts, product?._id, language, siteUrl) +
    '<p class="mb-8"><a href="' + escapeHtml(localizedHref('/', language, siteUrl)) + '" class="text-emerald-700">Florial</a></p></main>'
  return main
}

export function buildEquipmentProductStructuredData(product, language, canonicalUrl, siteUrl, offer) {
  const localized = product?.translations?.[language] || {}
  const name = text(localized.name) || text(product?.name)
  const description = toPlainText(text(localized.shortDescription) || text(product?.shortDescription) || localized.formattedDescription || localized.description || product?.description)
  const images = imageCandidates(product, language, siteUrl).map((image) => image.url)
  const specifications = (Array.isArray(localized.specifications) && localized.specifications.length
    ? localized.specifications : product?.specifications || []).filter((spec) => text(spec?.name) && text(spec?.value))
  const trail = categoryTrail(product, product?.categoryTree || [])
  const root = product?.categoryTree?.find((item) => item.slugValue === 'vsichko-za-polivane')
  const breadcrumbItems = [
    { name: language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало', item: localizedHref('/', language, siteUrl) },
    { name: language === 'ru' ? 'Каталог' : language === 'en' ? 'Catalogue' : 'Каталог', item: localizedHref('/category/vsichko-za-polivane', language, siteUrl) },
    ...trail.map((item) => ({
      name: text(item.translations?.[language]?.name) || text(item.name),
      item: localizedHref('/category/' + encodeURIComponent(item.slugValue || item._id), language, siteUrl),
    })),
    { name, item: canonicalUrl },
  ]
  const data = {
    product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      url: canonicalUrl,
      ...(images.length ? { image: images } : {}),
      ...(product?.sku ? { sku: product.sku } : {}),
      ...(product?.brandName ? { brand: { '@type': 'Brand', name: product.brandName } } : {}),
      ...(trail.length ? { category: text(trail[trail.length - 1].translations?.[language]?.name) || text(trail[trail.length - 1].name) } : {}),
      ...(specifications.length ? {
        additionalProperty: specifications.map((spec) => ({
          '@type': 'PropertyValue',
          name: text(spec.translations?.[language]?.name) || text(spec.name),
          value: text(spec.translations?.[language]?.value) || text(spec.value),
        })),
      } : {}),
      ...(offer ? { offers: offer } : {}),
    },
    breadcrumbs: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    },
  }
  return data
}
