import { buildProductOffer } from './productJsonLd.mjs'

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
  const source = new URL(sourceUrl)
  const dimensions = source.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
  let src = sourceUrl
  let srcSet = ''
  let sizeAttributes = ''
  if (dimensions) {
    const sourceWidth = Number(dimensions[1])
    const sourceHeight = Number(dimensions[2])
    const widths = [160, 240, 320, 480, 640, 800, 960, 1200, 1600]
      .map((width) => Math.min(width, sourceWidth))
      .filter((width, index, all) => width > 0 && all.indexOf(width) === index)
      .sort((a, b) => a - b)
    const build = (width) => {
      const image = new URL(sourceUrl)
      image.searchParams.set('w', String(Math.min(width, sourceWidth)))
      image.searchParams.set('fit', 'max')
      image.searchParams.set('auto', 'format')
      image.searchParams.set('q', priority ? '68' : '75')
      return image.toString()
    }
    src = build(Math.min(960, sourceWidth))
    srcSet = widths.map((width) => build(width) + ' ' + width + 'w').join(', ')
    sizeAttributes = ' width="' + sourceWidth + '" height="' + sourceHeight + '"'
  }
  return '<img src="' + escapeHtml(src) + '"' +
    (srcSet ? ' srcset="' + escapeHtml(srcSet) + '" sizes="' + escapeHtml(sizes || '100vw') + '"' : '') +
    sizeAttributes + ' alt="' + escapeHtml(alt || '') + '"' +
    ' loading="' + loading + '"' +
    (priority ? ' fetchpriority="high"' : '') +
    ' decoding="async"' + (className ? ' class="' + className + '"' : '') + ' />'
}

function plainText(value) {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''
  return value.map((block) => {
    if (typeof block === 'string') return block
    return Array.isArray(block?.children)
      ? block.children.map((child) => typeof child?.text === 'string' ? child.text : '').join('')
      : ''
  }).filter(Boolean).join(' ').trim()
}

function localizedField(product, field, language) {
  const translated = product?.translations?.[language]
  const bg = product?.translations?.bg
  return translated?.[field] ?? bg?.[field] ?? product?.[field]
}

function localizedName(product, language) {
  return textValue(localizedField(product, 'name', language)) || textValue(product?.name)
}

function localizedImageAlt(image, language, fallback) {
  const selected = language === 'ru' ? image?.altRu : language === 'en' ? image?.altEn : image?.alt
  return textValue(selected || image?.alt || image?.altRu || image?.altEn || fallback)
}

function renderInline(block, language) {
  const definitions = new Map((block?.markDefs || []).map((mark) => [mark?._key || '', mark]))
  return (block?.children || []).map((child) => {
    let content = escapeHtml(child?.text || '')
    for (const mark of child?.marks || []) {
      if (mark === 'strong') content = '<strong>' + content + '</strong>'
      else if (mark === 'em') content = '<em>' + content + '</em>'
      else if (mark === 'underline') content = '<u>' + content + '</u>'
      else if (mark === 'strike-through' || mark === 'strike') content = '<s>' + content + '</s>'
      else if (mark === 'code') content = '<code>' + content + '</code>'
      else {
        const definition = definitions.get(mark)
        const href = safeHref(definition?.href, language)
        if (definition?._type === 'link' && href) {
          content = '<a href="' + escapeHtml(href) + '"' +
            (href.startsWith('http://') || href.startsWith('https://') && !href.startsWith(SITE_URL) ? ' target="_blank" rel="noopener noreferrer"' : '') +
            ' class="font-medium text-emerald-800 underline underline-offset-4">' + content + '</a>'
        }
      }
    }
    return content
  }).join('')
}

function renderRichText(value, language) {
  if (typeof value === 'string') {
    return value.trim() ? '<p class="whitespace-pre-line leading-relaxed">' + escapeHtml(value) + '</p>' : ''
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
      const items = []
      while (index < value.length && value[index]?._type === 'block' &&
        value[index]?.listItem === listType && Array.isArray(value[index]?.children)) {
        items.push('<li class="pl-1">' + renderInline(value[index], language) + '</li>')
        index += 1
      }
      const tag = listType === 'number' ? 'ol' : 'ul'
      const klass = listType === 'number' ? 'list-decimal' : 'list-disc'
      output.push('<' + tag + ' class="' + klass + ' space-y-1 pl-6">' + items.join('') + '</' + tag + '>')
      continue
    }
    const content = renderInline(block, language)
    if (block.style === 'h2') output.push('<h2 class="mt-6 mb-3 text-xl font-bold text-slate-900">' + content + '</h2>')
    else if (block.style === 'h3') output.push('<h3 class="mt-5 mb-2 text-lg font-semibold text-slate-800">' + content + '</h3>')
    else if (block.style === 'blockquote') output.push('<blockquote class="border-l-4 border-slate-200 pl-4 italic text-slate-600">' + content + '</blockquote>')
    else output.push('<p class="leading-relaxed">' + content + '</p>')
    index += 1
  }
  return output.join('')
}

function formatPrice(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return ''
  return value.toFixed(2) + ' €'
}

function stockLabel(status, language) {
  if (status === 'inStock') return language === 'ru' ? 'В наличии' : language === 'en' ? 'In stock' : 'В наличност'
  if (status === 'outOfStock') return language === 'ru' ? 'Нет в наличии' : language === 'en' ? 'Out of stock' : 'Изчерпан'
  return language === 'ru' ? 'По запросу' : language === 'en' ? 'On request' : 'По заявка'
}

function categoryTrail(product, categories, language) {
  const categoryList = Array.isArray(categories) ? categories : []
  const byId = new Map(categoryList.map((item) => [item._id, item]))
  const root = categoryList.find((item) => item.slugValue === 'vsichko-za-polivane')
  const assignedIds = Array.isArray(product.categoryIds) ? product.categoryIds : []
  const assigned = assignedIds.map((id) => byId.get(id)).filter(Boolean)
  if (product.categoryId && !assigned.some((item) => item._id === product.categoryId)) {
    const primary = byId.get(product.categoryId)
    if (primary) assigned.push(primary)
  }
  const depth = (candidate) => {
    let current = candidate
    let result = 0
    const visited = new Set()
    while (current?.parentId && !visited.has(current._id)) {
      visited.add(current._id)
      current = byId.get(current.parentId)
      result += 1
    }
    return result
  }
  const primary = assigned.slice().sort((a, b) => depth(b) - depth(a))[0]
  const trail = []
  let current = primary
  const visited = new Set()
  while (current && !visited.has(current._id)) {
    visited.add(current._id)
    if (current._id !== root?._id && current.slugValue !== 'vsichko-za-polivane') trail.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  const catalogName = root
    ? localizedField(root, 'name', language) || root.name
    : (language === 'ru' ? 'Каталог поливочного оборудования' : language === 'en' ? 'Irrigation equipment' : 'Оборудване за поливане')
  return { trail, catalogName, rootSlug: root?.slugValue || 'vsichko-za-polivane' }
}

function renderBreadcrumbs(product, categories, language) {
  const catalog = categoryTrail(product, categories, language)
  const items = [
    '<a href="' + escapeHtml(localizedHref('/', language)) + '"> ' + (language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало') + '</a>',
    '<a href="' + escapeHtml(localizedHref('/category/' + encodeURIComponent(catalog.rootSlug), language)) + '">' + escapeHtml(catalog.catalogName) + '</a>',
  ]
  for (const category of catalog.trail) {
    const name = localizedField(category, 'name', language) || category.name
    items.push('<a href="' + escapeHtml(localizedHref('/category/' + encodeURIComponent(category.slugValue), language)) + '">' + escapeHtml(name) + '</a>')
  }
  items.push('<span aria-current="page">' + escapeHtml(localizedName(product, language)) + '</span>')
  return '<nav data-florial-product-breadcrumbs="true" aria-label="' + (language === 'ru' ? 'Навигационная цепочка' : language === 'en' ? 'Breadcrumb' : 'Навигационна пътека') + '" class="mb-6 text-sm text-slate-500"><ol class="flex flex-wrap gap-2">' +
    items.map((item, index) => '<li class="flex items-center gap-2">' + (index ? '<span aria-hidden="true">/</span>' : '') + item + '</li>').join('') +
    '</ol></nav>'
}

function renderGallery(product, language, name) {
  const images = []
  if (product.imageUrl) images.push({ url: product.imageUrl, alt: language === 'ru' ? product.imageAltRu : language === 'en' ? product.imageAltEn : product.imageAlt })
  for (const image of Array.isArray(product.galleryImages) ? product.galleryImages : []) {
    if (image?.url && !images.some((item) => item.url === image.url)) images.push(image)
  }
  if (!images.length) return '<div class="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-slate-400">' +
    (language === 'ru' ? 'Нет изображения' : language === 'en' ? 'No image available' : 'Няма изображение') + '</div>'
  return '<div data-florial-product-gallery="true" data-florial-product-gallery-count="' + images.length + '" class="space-y-3"><div class="overflow-hidden rounded-2xl bg-white">' +
    responsiveImage(images[0].url, localizedImageAlt(images[0], language, name), '(min-width: 768px) 50vw, 100vw', 'h-full max-h-[560px] w-full object-contain', 'eager', true) +
    '</div>' +
    (images.length > 1 ? '<div class="grid grid-cols-4 gap-3">' + images.slice(1).map((image) =>
      '<div class="overflow-hidden rounded-xl border border-slate-100 bg-white">' +
      responsiveImage(image.url, localizedImageAlt(image, language, name), '(min-width: 768px) 12vw, 25vw', 'aspect-square w-full object-contain p-1') +
      '</div>').join('') + '</div>' : '') + '</div>'
}

function renderSpecifications(product, language) {
  const specs = Array.isArray(product.specifications) ? product.specifications.filter((item) =>
    textValue(item?.name) && textValue(item?.value)
  ) : []
  if (!specs.length) return ''
  const title = language === 'ru' ? 'Технические характеристики' : language === 'en' ? 'Technical specifications' : 'Технически характеристики'
  return '<section data-florial-product-specifications="true" data-florial-product-spec-count="' + specs.length + '" class="mb-10 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-7"><h2 class="mb-4 text-xl font-bold text-slate-900">' + title + '</h2><dl class="divide-y divide-slate-100">' +
    specs.map((spec) => {
      const localized = spec.translations?.[language] || {}
      const label = textValue(localized.name || spec.name)
      const value = textValue(localized.value || spec.value)
      const unit = textValue(localized.unit || spec.unit)
      return '<div class="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-5"><dt class="text-sm font-medium text-slate-500">' + escapeHtml(label) + '</dt><dd class="text-sm font-semibold text-slate-800">' + escapeHtml(value + (unit ? ' ' + unit : '')) + '</dd></div>'
    }).join('') + '</dl></section>'
}

function renderKitComponents(product, language) {
  const items = (Array.isArray(product.kitComponents) ? product.kitComponents : []).filter((item) =>
    item?.product && textValue(item.product.name)
  )
  if (!items.length) return ''
  const title = language === 'ru' ? 'Состав комплекта' : language === 'en' ? 'Kit contents' : 'Състав на комплекта'
  const rows = items.map((item) => {
    const linked = item.product.isActive !== false && textValue(item.product.slugValue)
    const name = localizedName(item.product, language)
    const quantity = typeof item.quantity === 'number' && Number.isFinite(item.quantity)
      ? new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG', { maximumFractionDigits: 6 }).format(item.quantity)
      : ''
    const unit = item.unit === 'm' ? 'm' : (language === 'ru' ? 'шт.' : language === 'en' ? 'pcs' : 'бр.')
    const note = textValue(item.note?.[language] || item.note?.bg)
    const label = linked
      ? '<a href="' + escapeHtml(localizedHref('/product/' + encodeURIComponent(item.product.slugValue), language)) + '">' + escapeHtml(name) + '</a>'
      : escapeHtml(name)
    return '<li class="flex items-start justify-between gap-4 border-b border-slate-100 py-3"><span>' + label +
      (note ? '<span class="mt-1 block text-xs text-slate-500">' + escapeHtml(note) + '</span>' : '') +
      '</span><span class="shrink-0 text-sm font-semibold text-slate-700">' + escapeHtml(quantity + ' ' + unit) + '</span></li>'
  })
  return '<section data-florial-product-kit="true" data-florial-product-kit-count="' + items.length + '" class="mb-10 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-7"><h2 class="mb-3 text-xl font-bold text-slate-900">' + title + '</h2><ul>' + rows.join('') + '</ul></section>'
}

function renderCompatibility(product, language) {
  const values = Array.isArray(product.compatibility) ? product.compatibility.filter((item) => textValue(item)) : []
  if (!values.length) return ''
  const title = language === 'ru' ? 'Совместимость' : language === 'en' ? 'Compatibility' : 'Съвместимост'
  const intro = language === 'ru' ? 'Проверьте совместимость перед покупкой.' : language === 'en' ? 'Check compatibility before purchasing.' : 'Проверете съвместимостта преди покупка.'
  return '<section data-florial-product-compatibility="true" data-florial-product-compatibility-count="' + values.length + '" class="mb-10 rounded-2xl border border-cyan-100 bg-cyan-50/30 p-5 md:p-7"><h2 class="mb-2 text-xl font-bold text-slate-900">' + title + '</h2><p class="mb-4 text-sm text-slate-600">' + intro + '</p><div class="flex flex-wrap gap-2">' +
    values.map((value) => '<span class="rounded-lg border border-cyan-100 bg-white px-3 py-2 text-sm font-medium text-slate-700">' + escapeHtml(value) + '</span>').join('') +
    '</div></section>'
}

function renderDocuments(product, language) {
  const items = []
  if (product.manualPDFUrl && safePdfUrl(product.manualPDFUrl)) items.push({ url: product.manualPDFUrl, title: language === 'ru' ? 'Скачать инструкцию (PDF)' : language === 'en' ? 'Download manual (PDF)' : 'Изтегляне на инструкция (PDF)' })
  if (product.catalogPDFUrl && safePdfUrl(product.catalogPDFUrl)) items.push({ url: product.catalogPDFUrl, title: language === 'ru' ? 'Скачать каталог (PDF)' : language === 'en' ? 'Download catalogue (PDF)' : 'Изтегляне на каталог (PDF)' })
  if (!items.length) return ''
  const title = language === 'ru' ? 'Документы и инструкции' : language === 'en' ? 'Documents and manuals' : 'Документи и инструкции'
  const intro = language === 'ru' ? 'Инструкции и каталоги производителя для ознакомления.' : language === 'en' ? 'Manufacturer manuals and catalogues for reference.' : 'Инструкции и каталози на производителя за справка.'
  return '<section data-florial-product-documents="true" data-florial-product-documents-count="' + items.length + '" class="mb-10 rounded-2xl border border-sky-100 bg-sky-50/30 p-5 md:p-7"><h2 class="mb-2 text-xl font-bold text-slate-900">' + title + '</h2><p class="mb-4 text-sm text-slate-600">' + intro + '</p><div class="flex flex-col gap-2">' +
    items.map((item) => '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" class="rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-sky-800">' + item.title + '</a>').join('') +
    '</div></section>'
}

function safePdfUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cdn.sanity.io' && url.pathname.startsWith('/files/bxvcy0qs/production/')
  } catch {
    return false
  }
}

function renderRelatedContent(product, language) {
  const items = (Array.isArray(product.relatedContent) ? product.relatedContent : []).filter((item) =>
    item && (item._type === 'service' ? item.isActive !== false : item._type === 'blogPost' && item.isPublished === true) &&
    textValue(item.slugValue)
  )
  if (!items.length) return ''
  const title = language === 'ru' ? 'Полезные материалы и услуги' : language === 'en' ? 'Useful resources and services' : 'Полезни материали и услуги'
  return '<section data-florial-product-related-content="true" data-florial-product-related-content-count="' + items.length + '" class="mb-10"><h2 class="mb-5 text-xl font-bold text-slate-900">' + title + '</h2><div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">' +
    items.map((item) => {
      const isService = item._type === 'service'
      const name = isService
        ? (localizedField(item, 'name', language) || item.name)
        : (localizedField(item, 'title', language) || item.title)
      const description = localizedField(item, 'shortDescription', language) || item.shortDescription
      const imageAlt = language === 'ru' ? item.imageAltRu : language === 'en' ? item.imageAltEn : item.imageAlt
      const path = (isService ? '/services/' : '/blog/') + encodeURIComponent(item.slugValue)
      return '<a href="' + escapeHtml(localizedHref(path, language)) + '" class="overflow-hidden rounded-xl border border-slate-200 bg-white no-underline shadow-sm">' +
        (item.imageUrl ? responsiveImage(item.imageUrl, imageAlt || name, '(min-width: 768px) 33vw, 50vw', 'h-40 w-full object-cover') : '') +
        '<div class="p-4"><span class="text-xs font-semibold uppercase tracking-wide text-emerald-700">' +
        (isService ? (language === 'ru' ? 'Услуга Florial' : language === 'en' ? 'Florial service' : 'Услуга Florial') : (language === 'ru' ? 'Статья' : language === 'en' ? 'Article' : 'Статия')) +
        '</span><h3 class="mt-2 font-bold text-slate-900">' + escapeHtml(name) + '</h3>' +
        (description ? '<p class="mt-2 text-sm text-slate-600">' + escapeHtml(description) + '</p>' : '') + '</div></a>'
    }).join('') + '</div></section>'
}

function renderRelatedProducts(product, language) {
  const items = (Array.isArray(product.relatedProducts) ? product.relatedProducts : [])
    .filter((item) => item && item._id !== product._id && textValue(item.slugValue))
    .slice(0, 5)
  if (!items.length) return ''
  const title = language === 'ru' ? 'С этим товаром покупают' : language === 'en' ? 'Frequently bought together' : 'Често купувани заедно'
  const vat = language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'
  return '<section data-florial-product-related-products="true" data-florial-product-related-products-count="' + items.length + '" class="mb-10"><h2 class="mb-5 text-xl font-bold text-slate-900">' + title + '</h2><div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">' +
    items.map((item) => {
      const name = localizedName(item, language)
      return '<article class="flex flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm">' +
        '<a href="' + escapeHtml(localizedHref('/product/' + encodeURIComponent(item.slugValue), language)) + '" class="flex-1 no-underline">' +
        (item.imageUrl ? responsiveImage(item.imageUrl, localizedImageAlt(item, language, name), '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw', 'mb-3 h-36 w-full rounded-lg object-contain p-2') : '') +
        '<h3 class="mb-2 text-sm font-bold leading-snug text-slate-900">' + escapeHtml(name) + '</h3>' +
        (item.sku ? '<p class="mb-2 text-xs text-slate-400">SKU: ' + escapeHtml(item.sku) + '</p>' : '') +
        '</a><div class="mt-3 border-t border-slate-100 pt-3">' +
        '<p class="mb-1 font-bold text-emerald-800">' + escapeHtml(formatPrice(item.priceEUR) || (language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване')) + '</p>' +
        '<p class="mb-3 text-xs text-slate-500">' + vat + '</p>' +
        '<p class="text-xs text-slate-500">' + escapeHtml(stockLabel(item.stockStatus, language)) + '</p></div></article>'
    }).join('') + '</div></section>'
}

export function getEquipmentProductMetadata(product, language) {
  const name = localizedName(product, language)
  const translation = product.translations?.[language] || {}
  const seo = language === 'bg' ? product.seo : translation.seo || product.seo
  const h1 = textValue(seo?.h1) || name
  const shortDescription = textValue(translation.shortDescription || product.shortDescription)
  const description = shortDescription || plainText(translation.formattedDescription || translation.description || product.description) || name
  const title = textValue(seo?.metaTitle || seo?.title) || (name + ' | Florial')
  const metaDescription = textValue(seo?.metaDescription || seo?.description) || description
  return { name, h1, title, metaDescription, description, noIndex: seo?.noIndex === true }
}

export function buildEquipmentProductStructuredData(product, categories, language, canonicalUrl) {
  const metadata = getEquipmentProductMetadata(product, language)
  const catalog = categoryTrail(product, categories, language)
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало', item: localizedHref('/', language) },
    { '@type': 'ListItem', position: 2, name: catalog.catalogName, item: localizedHref('/category/' + catalog.rootSlug, language) },
  ]
  for (const category of catalog.trail) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: localizedField(category, 'name', language) || category.name,
      item: localizedHref('/category/' + encodeURIComponent(category.slugValue), language),
    })
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: metadata.name,
    item: canonicalUrl,
  })
  const images = [product.imageUrl, ...(Array.isArray(product.galleryImages) ? product.galleryImages.map((item) => item?.url) : [])]
    .filter((value, index, all) => safeImageUrl(value) && all.indexOf(value) === index)
  const offer = buildProductOffer({ ...product, _dataset: 'production' }, canonicalUrl)
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: metadata.name,
      description: metadata.description,
      url: canonicalUrl,
      ...(images.length ? { image: images } : {}),
      ...(product.sku ? { sku: product.sku } : {}),
      ...(product.brandName ? { brand: { '@type': 'Brand', name: product.brandName } } : {}),
      ...(offer ? { offers: offer } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  ]
}

export function renderEquipmentProductHtml(product, categories, language) {
  const metadata = getEquipmentProductMetadata(product, language)
  const name = metadata.name
  const price = formatPrice(product.priceEUR)
  const oldPrice = typeof product.oldPriceEUR === 'number' && product.oldPriceEUR > product.priceEUR
    ? formatPrice(product.oldPriceEUR, language)
    : ''
  const vatLabel = language === 'ru' ? 'Цена включает НДС.' : language === 'en' ? 'Price includes VAT.' : 'Цената е с включен ДДС.'
  const stock = stockLabel(product.stockStatus, language)
  const shortDescription = textValue(localizedField(product, 'shortDescription', language))
  const description = language === 'bg'
    ? product.description
    : (Array.isArray(product.translations?.[language]?.formattedDescription) && product.translations[language].formattedDescription.length
      ? product.translations[language].formattedDescription
      : (product.translations?.[language]?.description || product.description))
  const specs = renderSpecifications(product, language)
  const gallery = renderGallery(product, language, name)
  const catalog = categoryTrail(product, categories, language)
  const breadcrumb = renderBreadcrumbs(product, categories, language)
  const brand = textValue(product.brandName)
  const sku = textValue(product.sku)
  const descriptionHtml = renderRichText(description, language)
  const detailsLabel = language === 'ru' ? 'Описание' : language === 'en' ? 'Description' : 'Описание'
  const main = '<main class="mx-auto w-full max-w-7xl flex-grow px-4 py-6 sm:px-6 lg:px-8" data-florial-ssr="equipment-product-v1">' +
    breadcrumb +
    '<article>' +
    '<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">' +
    '<div>' + gallery + '</div>' +
    '<div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-7">' +
    '<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">' + escapeHtml(catalog.catalogName) + '</p>' +
    '<h1 class="mb-4 text-2xl font-bold leading-tight text-slate-900 md:text-3xl">' + escapeHtml(metadata.h1) + '</h1>' +
    (brand ? '<p class="mb-2 text-sm text-slate-600">' + (language === 'ru' ? 'Бренд' : language === 'en' ? 'Brand' : 'Марка') + ': <strong>' + escapeHtml(brand) + '</strong></p>' : '') +
    (sku ? '<p class="mb-3 text-sm text-slate-500">SKU: ' + escapeHtml(sku) + '</p>' : '') +
    (shortDescription ? '<p class="mb-5 text-base leading-relaxed text-slate-600">' + escapeHtml(shortDescription) + '</p>' : '') +
    '<div class="mb-3 flex flex-wrap items-baseline gap-3">' +
    (price ? '<strong data-florial-product-price="' + escapeHtml(Number(product.priceEUR).toFixed(2)) + '" class="text-2xl font-bold text-emerald-800">' + escapeHtml(price) + '</strong>' : '<strong class="text-xl font-bold text-slate-800">' + (language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване') + '</strong>') +
    (oldPrice ? '<s class="text-base text-slate-400">' + escapeHtml(oldPrice) + '</s>' : '') +
    '</div>' +
    (product.vatIncluded === true ? '<p class="mb-3 text-xs text-slate-500">' + vatLabel + '</p>' : '') +
    '<p data-florial-product-stock="' + escapeHtml(product.stockStatus || 'onRequest') + '" class="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">' + escapeHtml(stock) + '</p>' +
    (typeof product.weightKg === 'number' && product.weightKg > 0 ? '<p class="mt-3 text-sm text-slate-500">' + (language === 'ru' ? 'Вес' : language === 'en' ? 'Weight' : 'Тегло') + ': ' + escapeHtml(String(product.weightKg)) + ' kg</p>' : '') +
    '</div></div>' +
    (specs ? '<div class="mt-10">' + specs + '</div>' : '') +
    (descriptionHtml ? '<section data-florial-product-description="true" data-florial-product-description-block-count="' + (Array.isArray(description) ? description.length : 0) + '" class="mb-10 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-7"><h2 class="mb-4 text-xl font-bold text-slate-900">' + detailsLabel + '</h2><div class="space-y-3 text-base leading-relaxed text-slate-600">' + descriptionHtml + '</div></section>' : '') +
    renderKitComponents(product, language) +
    renderCompatibility(product, language) +
    renderDocuments(product, language) +
    renderRelatedContent(product, language) +
    renderRelatedProducts(product, language) +
    '</article></main>'
  return main
}
