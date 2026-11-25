const PAGE_SIZE = 20

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
}

function safeHref(value) {
  const href = String(value || '').trim()
  if (!href) return ''
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('/')) return href
  return ''
}

function localizedValue(product, key, language) {
  if (language !== 'bg') {
    const translated = product.translations?.[language]?.[key]
    if (translated !== undefined && translated !== null && translated !== '' && (!Array.isArray(translated) || translated.length > 0)) return translated
  }
  const bulgarian = product.translations?.bg?.[key]
  if (bulgarian !== undefined && bulgarian !== null && bulgarian !== '' && (!Array.isArray(bulgarian) || bulgarian.length > 0)) return bulgarian
  return product[key]
}

function localizedProductName(product, language) {
  const translated = localizedValue(product, 'name', language)
  if (typeof translated === 'string' && translated.trim()) return translated.trim()
  const translatedH1 = language === 'bg' ? '' : product.translations?.[language]?.seo?.h1
  if (typeof translatedH1 === 'string' && translatedH1.trim()) return translatedH1.trim()
  return String(product.name || product.seo?.h1 || '').trim()
}

function localizedEquipmentProductName(product, language) {
  const translated = product.translations?.[language]?.name
  if (typeof translated === 'string' && translated.trim()) return translated.trim()
  return String(product.name || '').trim()
}

function getAvailability(product) {
  const statuses = (product.saleVariants || [])
    .map((variant) => variant?.stockStatus)
    .filter((status) => ['inStock', 'onRequest', 'outOfStock'].includes(status))

  if (statuses.includes('inStock')) return 'inStock'
  if (statuses.includes('onRequest')) return 'onRequest'
  if (statuses.length > 0) return 'outOfStock'
  return ['inStock', 'onRequest', 'outOfStock'].includes(product.stockStatus)
    ? product.stockStatus
    : null
}

function availabilityPriority(product) {
  const status = getAvailability(product)
  if (status === 'inStock') return 0
  if (status === 'onRequest') return 1
  return 2
}

function getStartingPrice(product) {
  const variantPrices = (product.saleVariants || [])
    .map((variant) => variant?.priceEUR)
    .filter((price) => typeof price === 'number' && Number.isFinite(price) && price > 0)
  const prices = variantPrices.length
    ? variantPrices
    : [product.priceEUR].filter((price) => typeof price === 'number' && Number.isFinite(price) && price > 0)
  return prices.length ? Math.min(...prices) : null
}

export function collectDescendantCategoryIds(rootId, categories) {
  const childrenByParent = new Map()
  for (const category of Array.isArray(categories) ? categories : []) {
    if (!category?.parentId || !category?._id) continue
    const children = childrenByParent.get(category.parentId) || []
    children.push(category._id)
    childrenByParent.set(category.parentId, children)
  }

  const result = new Set([rootId])
  const pending = [rootId]
  while (pending.length) {
    const parentId = pending.pop()
    for (const childId of childrenByParent.get(parentId) || []) {
      if (result.has(childId)) continue
      result.add(childId)
      pending.push(childId)
    }
  }
  return [...result]
}

export function buildPlantCategoryEntries(products, language = 'bg') {
  return (Array.isArray(products) ? products : [])
    .filter((product) => product && product._id && (product.slugValue || product.slug?.current))
    .slice()
    .sort((a, b) => {
      const availabilityDifference = availabilityPriority(a) - availabilityPriority(b)
      if (availabilityDifference !== 0) return availabilityDifference
      return localizedProductName(a, language).localeCompare(localizedProductName(b, language), language)
    })
    .slice(0, PAGE_SIZE)
}

function availabilityLabel(product, language) {
  const status = getAvailability(product)
  if (!status) return ''
  if (language === 'ru') {
    return status === 'inStock' ? 'В наличии' : status === 'outOfStock' ? 'Нет в наличии' : 'По запросу'
  }
  if (language === 'en') {
    return status === 'inStock' ? 'In stock' : status === 'outOfStock' ? 'Out of stock' : 'On request'
  }
  return status === 'inStock' ? 'В наличност' : status === 'outOfStock' ? 'Изчерпан' : 'По заявка'
}

function productUrl(product, language, siteUrl) {
  const slug = product.slugValue || product.slug?.current
  const path = '/product/' + encodeURIComponent(slug)
  return siteUrl + path + (language === 'ru' || language === 'en' ? '?lang=' + language : '')
}

export function renderPlantCategoryListing(products, language = 'bg', siteUrl = 'https://florial-bg.com') {
  const entries = buildPlantCategoryEntries(products, language)
  const heading = language === 'ru' ? 'Товары в категории' : language === 'en' ? 'Products in this category' : 'Продукти в категорията'
  const empty = language === 'ru'
    ? 'В этой категории пока нет товаров.'
    : language === 'en'
      ? 'There are currently no products in this category.'
      : 'В тази категория все още няма налични продукти.'

  if (!entries.length) {
    return '<section aria-labelledby="florial-category-products"><h2 id="florial-category-products">' +
      heading + '</h2><p>' + empty + '</p></section>'
  }

  const cards = entries.map((product) => {
    const name = localizedProductName(product, language) || product.slugValue
    const url = productUrl(product, language, siteUrl)
    const price = getStartingPrice(product)
    const priceLabel = price === null
      ? ''
      : (language === 'ru' ? 'Цена от ' : language === 'en' ? 'From ' : 'Цена от ') +
        (language === 'en' ? '€' + price.toFixed(2) : price.toFixed(2) + ' €')
    const status = availabilityLabel(product, language)
    return '<li><article style="height:100%;border:1px solid #e5e7eb;border-radius:12px;padding:16px"><h3><a href="' + escapeHtml(url) + '">' + escapeHtml(name) + '</a></h3>' +
      (priceLabel ? '<p>' + escapeHtml(priceLabel) + '</p>' : '') +
      (status ? '<p>' + escapeHtml(status) + '</p>' : '') + '</article></li>'
  }).join('')

  return '<section aria-labelledby="florial-category-products" data-florial-server-catalogue="plants" style="margin:24px 0">' +
    '<h2 id="florial-category-products">' + heading + '</h2>' +
    '<p>' + (language === 'ru' ? 'Показано товаров: ' : language === 'en' ? 'Showing products: ' : 'Показани продукти: ') + entries.length + '</p>' +
    '<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;list-style:none;padding:0">' + cards + '</ul></section>'
}

export function buildPlantCategoryItemList(products, language = 'bg', siteUrl = 'https://florial-bg.com') {
  const entries = buildPlantCategoryEntries(products, language)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: entries.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: localizedProductName(product, language),
      url: productUrl(product, language, siteUrl),
    })),
  }
}

export function renderPortableText(value) {
  if (!Array.isArray(value) || value.length === 0) return ''
  const blocks = []
  let activeList = ''

  const closeList = () => {
    if (!activeList) return ''
    const tag = activeList === 'bullet' ? 'ul' : 'ol'
    activeList = ''
    return '</' + tag + '>'
  }

  for (const block of value) {
    if (!block || block._type !== 'block') continue
    const children = Array.isArray(block.children) ? block.children : []
    const marks = new Map((Array.isArray(block.markDefs) ? block.markDefs : []).map((mark) => [mark._key, mark]))
    const text = children.map((child) => {
      let output = escapeHtml(child?.text || '')
      for (const mark of Array.isArray(child?.marks) ? child.marks : []) {
        if (mark === 'strong') output = '<strong>' + output + '</strong>'
        else if (mark === 'em') output = '<em>' + output + '</em>'
        else {
          const definition = marks.get(mark)
          if (definition?._type === 'link') {
            const href = safeHref(definition.href)
            if (href) output = '<a href="' + escapeHtml(href) + '">' + output + '</a>'
          }
        }
      }
      return output
    }).join('')

    if (block.listItem === 'bullet' || block.listItem === 'number') {
      const nextList = block.listItem
      if (activeList !== nextList) {
        blocks.push(closeList())
        activeList = nextList
        blocks.push(nextList === 'bullet' ? '<ul>' : '<ol>')
      }
      blocks.push('<li>' + text + '</li>')
      continue
    }

    blocks.push(closeList())
    const style = block.style
    if (style === 'h2') blocks.push('<h2>' + text + '</h2>')
    else if (style === 'h3') blocks.push('<h3>' + text + '</h3>')
    else if (text.trim()) blocks.push('<p>' + text + '</p>')
  }
  blocks.push(closeList())
  return blocks.filter(Boolean).join('')
}

function imageAlt(image, language, fallback) {
  const alt = language === 'ru' ? image?.altRu : language === 'en' ? image?.altEn : image?.alt
  return String(alt || fallback || '')
}

function responsiveImage(url, alt, priority = false) {
  if (!url) return ''
  let src = url
  let dimensions = ''
  let srcset = ''
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i)
    if (parsed.protocol === 'https:' && parsed.hostname === 'cdn.sanity.io' && match) {
      const width = Number(match[1])
      const height = Number(match[2])
      dimensions = ' width="' + width + '" height="' + height + '"'
      const widths = [320, 480, 640, 800, 1000, 1200].map((item) => Math.min(item, width))
        .filter((item, index, values) => item > 0 && values.indexOf(item) === index)
      const build = (targetWidth) => {
        const image = new URL(url)
        image.searchParams.set('w', String(targetWidth))
        image.searchParams.set('fit', 'max')
        image.searchParams.set('auto', 'format')
        image.searchParams.set('q', '78')
        return image.toString()
      }
      src = build(Math.min(1000, width))
      srcset = ' srcset="' + escapeHtml(widths.map((item) => build(item) + ' ' + item + 'w').join(', ')) + '" sizes="(min-width: 900px) 48vw, 100vw"'
    }
  } catch {
    // Keep the source URL unchanged when it is not a standard Sanity image.
  }
  return '<img src="' + escapeHtml(src) + '"' + srcset + dimensions +
    ' alt="' + escapeHtml(alt) + '" loading="' + (priority ? 'eager' : 'lazy') + '"' +
    (priority ? ' fetchpriority="high"' : '') +
    ' decoding="async" style="display:block;max-width:100%;height:auto;object-fit:contain" />'
}

function localizedVariantName(variant, language, index) {
  const value = language === 'ru'
    ? variant.nameRu || variant.name
    : language === 'en'
      ? variant.nameEn || variant.name
      : variant.name
  return String(value || ((language === 'ru' ? 'Вариант ' : language === 'en' ? 'Option ' : 'Вариант ') + (index + 1)))
}

function formatPrice(price, language) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return ''
  return language === 'en' ? '€' + price.toFixed(2) : price.toFixed(2) + ' €'
}

function plantCareRows(plantCare, language) {
  if (!plantCare || typeof plantCare !== 'object') return []
  const labels = language === 'ru'
    ? { light: 'Освещение', water: 'Потребность в воде', height: 'Высота взрослого растения', foliage: 'Листва', winter: 'Минимальная зимняя температура', coast: 'Пригодность для Черноморского побережья', flowering: 'Цветение', planting: 'Сезон посадки' }
    : language === 'en'
      ? { light: 'Light', water: 'Water needs', height: 'Mature height', foliage: 'Foliage', winter: 'Minimum winter temperature', coast: 'Black Sea coast suitability', flowering: 'Flowering season', planting: 'Planting season' }
      : { light: 'Осветеност', water: 'Нужда от вода', height: 'Височина на възрастното растение', foliage: 'Листна маса', winter: 'Минимална зимна температура', coast: 'Пригодност за Черноморието', flowering: 'Сезон на цъфтеж', planting: 'Сезон за засаждане' }

  const value = (key) => {
    const maps = language === 'ru'
      ? {
          light: { sun: 'Полное солнце', partialShade: 'Полутень', shade: 'Тень' },
          waterNeeds: { low: 'Низкая', medium: 'Средняя', high: 'Высокая' },
          foliageType: { evergreen: 'Вечнозелёное', deciduous: 'Листопадное' },
          blackSeaCoast: { suitable: 'Подходит', notSuitable: 'Не подходит', needsVerification: 'Требуется проверка' },
          season: { spring: 'весна', summer: 'лето', autumn: 'осень', winter: 'зима', yearRound: 'круглый год' },
        }
      : language === 'en'
        ? {
            light: { sun: 'Full sun', partialShade: 'Partial shade', shade: 'Shade' },
            waterNeeds: { low: 'Low', medium: 'Moderate', high: 'High' },
            foliageType: { evergreen: 'Evergreen', deciduous: 'Deciduous' },
            blackSeaCoast: { suitable: 'Suitable', notSuitable: 'Not suitable', needsVerification: 'Needs verification' },
            season: { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter', yearRound: 'year-round' },
          }
        : {
            light: { sun: 'Пълно слънце', partialShade: 'Полусянка', shade: 'Сянка' },
            waterNeeds: { low: 'Ниска', medium: 'Средна', high: 'Висока' },
            foliageType: { evergreen: 'Вечнозелено', deciduous: 'Листопадно' },
            blackSeaCoast: { suitable: 'Подходящо', notSuitable: 'Неподходящо', needsVerification: 'Нужна е проверка' },
            season: { spring: 'пролет', summer: 'лято', autumn: 'есен', winter: 'зима', yearRound: 'целогодишно' },
          }
    return maps[key] || {}
  }

  const rows = []
  if (plantCare.light) rows.push([labels.light, value('light')[plantCare.light]])
  if (plantCare.waterNeeds) rows.push([labels.water, value('waterNeeds')[plantCare.waterNeeds]])
  if (typeof plantCare.adultHeightCm === 'number') rows.push([labels.height, plantCare.adultHeightCm + ' cm'])
  if (plantCare.foliageType) rows.push([labels.foliage, value('foliageType')[plantCare.foliageType]])
  if (typeof plantCare.minWinterTempC === 'number') rows.push([labels.winter, plantCare.minWinterTempC + ' °C'])
  if (['suitable', 'notSuitable', 'needsVerification'].includes(plantCare.blackSeaCoast)) rows.push([labels.coast, value('blackSeaCoast')[plantCare.blackSeaCoast]])
  for (const [field, label] of [['floweringSeason', labels.flowering], ['plantingSeason', labels.planting]]) {
    if (Array.isArray(plantCare[field]) && plantCare[field].length) {
      rows.push([label, plantCare[field].map((item) => value('season')[item] || item).join(', ')])
    }
  }
  return rows.filter((row) => row[1] !== undefined && row[1] !== '')
}

function availabilityText(status, language) {
  if (language === 'ru') return status === 'inStock' ? 'В наличии' : status === 'outOfStock' ? 'Нет в наличии' : status === 'onRequest' ? 'По запросу' : ''
  if (language === 'en') return status === 'inStock' ? 'In stock' : status === 'outOfStock' ? 'Out of stock' : status === 'onRequest' ? 'On request' : ''
  return status === 'inStock' ? 'В наличност' : status === 'outOfStock' ? 'Изчерпан' : status === 'onRequest' ? 'По заявка' : ''
}

export function renderPlantProductHtml(product, language = 'bg', siteUrl = 'https://florial-bg.com') {
  const name = localizedProductName(product, language) || product.slugValue || product._id
  const h1 = String((language === 'bg' ? product.seo?.h1 : product.translations?.[language]?.seo?.h1) || name)
  const scientificName = String(product.scientificName || '')
  const shortDescription = localizedValue(product, 'shortDescription', language)
  const description = localizedValue(product, 'description', language)
  const careGuide = localizedValue(product, 'careGuide', language)
  const mainImage = product.mainImage || null
  const mainImageUrl = mainImage?.asset?.url || product.imageUrl || ''
  const gallery = Array.isArray(product.gallery) ? product.gallery.filter((image) => image?.asset?.url) : []
  const allImages = [
    ...(mainImageUrl ? [{ url: mainImageUrl, image: mainImage, primary: true }] : []),
    ...gallery.map((image) => ({ url: image.asset.url, image, primary: false })),
  ]
  const category = product.category || null
  const categoryName = category ? localizedProductName(category, language) || category.name : ''
  const categoryUrl = category?.slugValue ? siteUrl + '/category/' + encodeURIComponent(category.slugValue) : siteUrl + '/category/rastenia'
  const labels = language === 'ru'
    ? { catalog: 'Растения', details: 'Описание', care: 'Уход и выращивание', characteristics: 'Характеристики', variants: 'Доступные размеры', sku: 'Артикул', category: 'Категория', irrigation: 'Рекомендации по поливу', related: 'Полезные материалы' }
    : language === 'en'
      ? { catalog: 'Plants', details: 'Description', care: 'Growing and care', characteristics: 'Plant characteristics', variants: 'Available sizes', sku: 'SKU', category: 'Category', irrigation: 'Irrigation recommendation', related: 'Related resources' }
      : { catalog: 'Растения', details: 'Описание', care: 'Отглеждане и грижи', characteristics: 'Характеристики на растението', variants: 'Предлагани размери', sku: 'Артикул', category: 'Категория', irrigation: 'Препоръка за поливане', related: 'Полезни материали' }

  const imagesHtml = allImages.length
    ? '<div class="florial-plant-gallery" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:20px 0">' +
      allImages.map(({ url, image, primary }) => '<figure style="margin:0">' +
        responsiveImage(url, imageAlt(image, language, name), primary) + '</figure>').join('') + '</div>'
    : ''

  const variantRows = (Array.isArray(product.saleVariants) ? product.saleVariants : []).map((variant, index) => {
    const price = formatPrice(variant.priceEUR, language)
    const oldPrice = typeof variant.oldPriceEUR === 'number' && variant.oldPriceEUR > variant.priceEUR ? formatPrice(variant.oldPriceEUR, language) : ''
    const size = [
      typeof variant.saleHeightCm === 'number' ? variant.saleHeightCm + ' cm' : '',
      typeof variant.containerVolumeL === 'number' ? 'C' + variant.containerVolumeL + ' L' : '',
    ].filter(Boolean).join(' · ')
    const status = availabilityText(variant.stockStatus || product.stockStatus, language)
    return '<li style="border:1px solid #e5e7eb;border-radius:12px;padding:14px">' +
      '<h3>' + escapeHtml(localizedVariantName(variant, language, index)) + '</h3>' +
      (size ? '<p>' + escapeHtml(size) + '</p>' : '') +
      (price ? '<p><strong>' + escapeHtml(price) + '</strong> ' + (oldPrice ? '<del>' + escapeHtml(oldPrice) + '</del>' : '') + '</p>' : '') +
      (status ? '<p>' + escapeHtml(status) + '</p>' : '') +
      (variant.sku ? '<p>' + labels.sku + ': ' + escapeHtml(variant.sku) + '</p>' : '') +
      '</li>'
  }).join('')

  const rows = plantCareRows(product.plantCare, language)
  const characteristics = rows.length
    ? '<section><h2>' + labels.characteristics + '</h2><dl>' + rows.map(([label, value]) => '<div style="display:grid;grid-template-columns:minmax(150px,1fr) 2fr;gap:12px;padding:8px 0;border-bottom:1px solid #e5e7eb"><dt><strong>' + escapeHtml(label) + '</strong></dt><dd style="margin:0">' + escapeHtml(value) + '</dd></div>').join('') + '</dl></section>'
    : ''

  const descriptionHtml = renderPortableText(description)
  const careHtml = renderPortableText(careGuide)
  const irrigation = product.recommendedIrrigation
  const irrigationText = irrigation?.irrigationType
    ? ({ drip: language === 'ru' ? 'Капельный полив' : language === 'en' ? 'Drip irrigation' : 'Капково напояване',
         rotator: language === 'ru' ? 'Ротаторные форсунки' : language === 'en' ? 'Rotary nozzles' : 'Ротаторни дюзи',
         root: language === 'ru' ? 'Корневой полив' : language === 'en' ? 'Root-zone irrigation' : 'Кореново напояване',
         mist: language === 'ru' ? 'Туманообразование' : language === 'en' ? 'Misting' : 'Мъглуване' })[irrigation.irrigationType]
    : ''
  const irrigationHtml = irrigationText
    ? '<section><h2>' + labels.irrigation + '</h2><p>' + escapeHtml(irrigationText) + '</p>' +
      (irrigation.productSlug ? '<p><a href="' + escapeHtml(siteUrl + '/product/' + encodeURIComponent(irrigation.productSlug)) + '">' + escapeHtml(language === 'ru' ? 'Посмотреть рекомендованный товар' : language === 'en' ? 'View recommended product' : 'Вижте препоръчания продукт') + '</a></p>' : '') + '</section>'
    : ''
  const related = Array.isArray(product.relatedContentBySlug) ? product.relatedContentBySlug : []
  const relatedHtml = related.length
    ? '<section><h2>' + labels.related + '</h2><ul>' + related.map((item) => {
        const base = item.contentType === 'service' ? '/services/' : item.contentType === 'blogPost' ? '/blog/' : ''
        if (!base || !item.slug) return ''
        return '<li><a href="' + escapeHtml(siteUrl + base + encodeURIComponent(item.slug)) + '">' + escapeHtml(item.label || item.slug) + '</a></li>'
      }).filter(Boolean).join('') + '</ul></section>'
    : ''

  const price = getStartingPrice(product)
  const priceText = price === null ? '' : formatPrice(price, language)
  const summary = typeof shortDescription === 'string' ? shortDescription : ''
  const breadcrumbs = '<nav aria-label="breadcrumb"><ol><li><a href="' + escapeHtml(siteUrl + '/') + '">' + escapeHtml(language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало') + '</a></li><li><a href="' + escapeHtml(siteUrl + '/category/rastenia') + '">' + labels.catalog + '</a></li>' +
    (categoryName ? '<li><a href="' + escapeHtml(categoryUrl) + '">' + escapeHtml(categoryName) + '</a></li>' : '') +
    '<li aria-current="page">' + escapeHtml(name) + '</li></ol></nav>'

  return '<main data-florial-ssr="plant-product" data-product-id="' + escapeHtml(product._id) + '" style="max-width:1200px;margin:0 auto;padding:24px 16px">' +
    breadcrumbs + '<article><header><h1>' + escapeHtml(h1) + '</h1>' +
    (scientificName ? '<p><em>' + escapeHtml(scientificName) + '</em></p>' : '') +
    (summary ? '<p>' + escapeHtml(summary) + '</p>' : '') +
    (priceText ? '<p><strong>' + escapeHtml((language === 'ru' ? 'Цена от ' : language === 'en' ? 'From ' : 'Цена от ') + priceText) + '</strong></p>' : '') +
    (product.sku ? '<p>' + labels.sku + ': ' + escapeHtml(product.sku) + '</p>' : '') +
    (categoryName ? '<p>' + labels.category + ': <a href="' + escapeHtml(categoryUrl) + '">' + escapeHtml(categoryName) + '</a></p>' : '') +
    '</header>' + imagesHtml +
    (variantRows.length ? '<section><h2>' + labels.variants + '</h2><ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;list-style:none;padding:0">' + variantRows + '</ul></section>' : '') +
    (descriptionHtml ? '<section><h2>' + labels.details + '</h2>' + descriptionHtml + '</section>' : '') +
    (careHtml ? '<section><h2>' + labels.care + '</h2>' + careHtml + '</section>' : '') +
    characteristics + irrigationHtml + relatedHtml +
    '</article></main>'
}

export function buildPlantProductStructuredData(product, language = 'bg', canonicalUrl = 'https://florial-bg.com') {
  const name = localizedProductName(product, language) || product.slugValue || product._id
  const description = localizedValue(product, 'shortDescription', language)
  const image = product.mainImage?.asset?.url
  const offers = (Array.isArray(product.saleVariants) ? product.saleVariants : [])
    .filter((variant) => typeof variant.priceEUR === 'number' && variant.priceEUR > 0)
  const prices = offers.map((variant) => variant.priceEUR)
  const availability = offers.some((variant) => variant.stockStatus === 'inStock')
    ? 'https://schema.org/InStock'
    : offers.length > 0 && offers.every((variant) => variant.stockStatus === 'onRequest')
      ? 'https://schema.org/PreOrder'
      : offers.length > 0 && offers.every((variant) => variant.stockStatus === 'outOfStock')
        ? 'https://schema.org/OutOfStock'
        : undefined
  const aggregateOffer = prices.length
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'EUR',
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: offers.length,
        ...(availability ? { availability } : {}),
      }
    : undefined
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: typeof description === 'string' ? description : '',
    url: canonicalUrl,
    ...(product.scientificName ? { alternateName: product.scientificName } : {}),
    ...(image ? { image: [image] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(aggregateOffer ? { offers: aggregateOffer } : {}),
    category: 'Plants',
  }
  const catalogUrl = canonicalUrl.replace(/\/product\/[^/?#]+(?:\?.*)?$/, '/category/rastenia')
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало', item: 'https://florial-bg.com/' },
      { '@type': 'ListItem', position: 2, name: language === 'ru' ? 'Растения' : language === 'en' ? 'Plants' : 'Растения', item: catalogUrl },
      ...(product.category?.name ? [{
        '@type': 'ListItem',
        position: 3,
        name: localizedProductName(product.category, language) || product.category.name,
        item: product.category.slugValue ? 'https://florial-bg.com/category/' + encodeURIComponent(product.category.slugValue) : catalogUrl,
      }] : []),
      { '@type': 'ListItem', position: product.category?.name ? 4 : 3, name, item: canonicalUrl },
    ],
  }
  return [productData, breadcrumbs]
}

function equipmentImageText(productName, language, imageIndex, kind) {
  const locations = [
    { bg: 'Несебър', ru: 'Несебре', en: 'Nessebar' },
    { bg: 'Равда', ru: 'Равде', en: 'Ravda' },
    { bg: 'Слънчев бряг', ru: 'Солнечном Берегу', en: 'Sunny Beach' },
    { bg: 'Свети Влас', ru: 'Свети-Власе', en: 'Sveti Vlas' },
    { bg: 'Поморие', ru: 'Поморие', en: 'Pomorie' },
  ]
  const locale = language === 'ru' || language === 'en' ? language : 'bg'
  const location = locations[Math.max(0, imageIndex) % locations.length][locale]
  if (locale === 'ru') return kind === 'title' ? `Продажа ${productName} в ${location}` : `Купить ${productName} в ${location}`
  if (locale === 'en') return kind === 'title' ? `${productName} for sale in ${location}` : `Buy ${productName} in ${location}`
  return kind === 'title' ? `Продажба на ${productName} в ${location}` : `Купете ${productName} в ${location}`
}

export function buildEquipmentCategoryEntries(products, language = 'bg', options = {}) {
  const sorted = (Array.isArray(products) ? products : [])
    .filter((product) => product && product._id && (product.slugValue || product.slug?.current))
    .slice()
    .sort((a, b) => localizedEquipmentProductName(a, language).localeCompare(localizedEquipmentProductName(b, language), language))

  if (options.rootCatalog && Array.isArray(options.categories)) {
    const prioritySlugs = [
      'controllers',
      'gotovi-komplekti-za-polivane',
      'sprinklers',
      'nozzles',
      'klapani',
      'shahti',
    ]
    const priorityIds = prioritySlugs
      .map((slug) => options.categories.find((item) => item.slugValue === slug)?._id)
      .filter(Boolean)
    const priorityIdSet = new Set(priorityIds)
    const parentById = new Map(options.categories.map((item) => [item._id, item.parentId]))
    const getRootCategoryId = (categoryId) => {
      let currentId = categoryId
      const visited = new Set()
      while (currentId && !visited.has(currentId)) {
        if (priorityIdSet.has(currentId)) return currentId
        visited.add(currentId)
        currentId = parentById.get(currentId)
      }
      return undefined
    }

    const buckets = new Map(priorityIds.map((id) => [id, []]))
    const otherProducts = []
    sorted.forEach((product) => {
      const categoryCandidates = [
        product.categoryId,
        ...(Array.isArray(product.categoryIds) ? product.categoryIds : []),
      ].filter(Boolean)
      const matchingPriorityId = categoryCandidates
        .map((id) => getRootCategoryId(id))
        .find(Boolean)
      if (matchingPriorityId) buckets.get(matchingPriorityId)?.push(product)
      else otherProducts.push(product)
    })

    const nozzlesCategoryId = options.categories.find((item) => item.slugValue === 'nozzles')?._id
    const nozzlesBucket = nozzlesCategoryId ? buckets.get(nozzlesCategoryId) : undefined
    if (nozzlesBucket) {
      const getNozzleSeriesRank = (product) => {
        const productText = [product.name, localizedEquipmentProductName(product, language), product.sku]
          .filter(Boolean).join(' ').toLocaleUpperCase()
        if (/\bR[\s-]?VAN\b/.test(productText)) return 0
        if (/\bHE[\s-]?VAN\b/.test(productText)) return 1
        if (/\bVAN\b/.test(productText)) return 2
        return 3
      }
      nozzlesBucket.sort((a, b) => getNozzleSeriesRank(a) - getNozzleSeriesRank(b))
    }

    const priorityProducts = []
    let hasMorePriorityProducts = true
    while (hasMorePriorityProducts) {
      hasMorePriorityProducts = false
      priorityIds.forEach((id) => {
        const nextProduct = buckets.get(id)?.shift()
        if (nextProduct) {
          priorityProducts.push(nextProduct)
          hasMorePriorityProducts = true
        }
      })
    }
    return [...priorityProducts, ...otherProducts].slice(0, PAGE_SIZE)
  }

  return sorted.slice(0, PAGE_SIZE)
}

function equipmentAvailabilityLabel(product, language) {
  const status = ['inStock', 'onRequest', 'outOfStock'].includes(product.stockStatus) ? product.stockStatus : null
  if (!status) return ''
  if (language === 'ru') return status === 'inStock' ? 'В наличии' : status === 'outOfStock' ? 'Нет в наличии' : 'По запросу'
  if (language === 'en') return status === 'inStock' ? 'In stock' : status === 'outOfStock' ? 'Out of stock' : 'On request'
  return status === 'inStock' ? 'В наличност' : status === 'outOfStock' ? 'Изчерпан' : 'По заявка'
}

export function renderEquipmentCategoryListing(products, language = 'bg', siteUrl = 'https://florial-bg.com', options = {}) {
  const entries = buildEquipmentCategoryEntries(products, language, options)
  const heading = language === 'ru' ? 'Оборудование в категории' : language === 'en' ? 'Equipment in this category' : 'Оборудване в категорията'
  const empty = language === 'ru'
    ? 'В этой категории пока нет товаров.'
    : language === 'en'
      ? 'There are currently no products in this category.'
      : 'В тази категория все още няма продукти.'

  if (!entries.length) {
    return '<section aria-labelledby="florial-equipment-category-products" data-florial-server-catalogue="equipment">' +
      '<h2 id="florial-equipment-category-products">' + heading + '</h2><p>' + empty + '</p></section>'
  }

  const cards = entries.map((product, index) => {
    const name = localizedEquipmentProductName(product, language) || product.slugValue
    const url = productUrl(product, language, siteUrl)
    const price = typeof product.priceEUR === 'number' && Number.isFinite(product.priceEUR) && product.priceEUR > 0 ? product.priceEUR : null
    const priceLabel = price === null
      ? ''
      : (language === 'ru' ? 'Цена: ' : language === 'en' ? 'Price: ' : 'Цена: ') +
        price.toFixed(2) + ' €'
    const status = equipmentAvailabilityLabel(product, language)
    const imageUrl = typeof product.imageUrl === 'string' ? product.imageUrl : ''
    const image = imageUrl
      ? '<div style="height:160px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f8fafc;border-radius:8px;margin-bottom:12px"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(equipmentImageText(name, language, index, 'alt')) + '" title="' + escapeHtml(equipmentImageText(name, language, index, 'title')) + '" loading="lazy" decoding="async" style="max-width:100%;max-height:100%;object-fit:contain" /></div>'
      : ''
    return '<li><article style="height:100%;border:1px solid #e5e7eb;border-radius:12px;padding:16px">' + image +
      '<h3><a href="' + escapeHtml(url) + '">' + escapeHtml(name) + '</a></h3>' +
      (priceLabel ? '<p><strong>' + escapeHtml(priceLabel) + '</strong></p>' : '') +
      (status ? '<p>' + escapeHtml(status) + '</p>' : '') +
      (product.sku ? '<p>SKU: ' + escapeHtml(product.sku) + '</p>' : '') +
      '</article></li>'
  }).join('')

  return '<section aria-labelledby="florial-equipment-category-products" data-florial-server-catalogue="equipment" style="margin:24px 0">' +
    '<h2 id="florial-equipment-category-products">' + heading + '</h2>' +
    '<p>' + (language === 'ru' ? 'Показано товаров: ' : language === 'en' ? 'Showing products: ' : 'Показани продукти: ') + entries.length + '</p>' +
    '<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;list-style:none;padding:0">' + cards + '</ul></section>'
}
