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

function localizedProductName(product, language) {
  const translated = product.translations?.[language]?.name
  if (typeof translated === 'string' && translated.trim()) return translated.trim()
  const translatedH1 = language === 'bg' ? '' : product.translations?.[language]?.seo?.h1
  if (typeof translatedH1 === 'string' && translatedH1.trim()) return translatedH1.trim()
  return String(product.name || product.seo?.h1 || '').trim()
}

function localizedValue(product, key, language) {
  if (language !== 'bg') {
    const translated = product.translations?.[language]?.[key]
    if (translated !== undefined && translated !== null && translated !== '') return translated
  }
  return product.translations?.bg?.[key] ?? product[key]
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
  const sortedProducts = (Array.isArray(products) ? products : [])
    .filter((product) => product && product._id && (product.slugValue || product.slug?.current))
    .slice()
    .sort((a, b) => {
      const availabilityDifference = availabilityPriority(a) - availabilityPriority(b)
      if (availabilityDifference !== 0) return availabilityDifference
      return localizedProductName(a, language).localeCompare(localizedProductName(b, language), language)
    })

  const offers = sortedProducts.flatMap((product) => {
    const variants = Array.isArray(product.saleVariants) ? product.saleVariants : []
    return variants.length
      ? variants.map((variant, index) => ({ ...product, _catalogVariant: variant, _catalogVariantIndex: index }))
      : [{ ...product, _catalogVariant: null, _catalogVariantIndex: -1 }]
  })

  const offerPriority = (offer) => {
    const status = offer._catalogVariant?.stockStatus || offer.stockStatus
    return status === 'inStock' ? 0 : status === 'onRequest' ? 1 : 2
  }

  return offers
    .sort((a, b) => {
      const priorityDifference = offerPriority(a) - offerPriority(b)
      if (priorityDifference !== 0) return priorityDifference
      const nameDifference = localizedProductName(a, language).localeCompare(localizedProductName(b, language), language)
      if (nameDifference !== 0) return nameDifference
      if (a._id === b._id) return a._catalogVariantIndex - b._catalogVariantIndex
      return 0
    })
    .slice(0, PAGE_SIZE)
}

function availabilityLabel(product, language) {
  const status = product._catalogVariant
    ? (['inStock', 'onRequest', 'outOfStock'].includes(product._catalogVariant.stockStatus) ? product._catalogVariant.stockStatus : product.stockStatus)
    : getAvailability(product)
  if (!['inStock', 'onRequest', 'outOfStock'].includes(status)) return ''
  if (language === 'ru') {
    return status === 'inStock' ? 'В наличии' : status === 'outOfStock' ? 'Нет в наличии' : 'По запросу'
  }
  if (language === 'en') {
    return status === 'inStock' ? 'In stock' : status === 'outOfStock' ? 'Out of stock' : 'On request'
  }
  return status === 'inStock' ? 'В наличност' : status === 'outOfStock' ? 'Изчерпан' : 'По заявка'
}

function plantProductImageText(productName, language, kind) {
  const locale = language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'bg'
  const location = { bg: 'Несебър', ru: 'Несебре', en: 'Nessebar' }[locale]
  if (locale === 'ru') return kind === 'title' ? 'Продажа ' + productName + ' в ' + location : 'Купить ' + productName + ' в ' + location
  if (locale === 'en') return kind === 'title' ? productName + ' for sale in ' + location : 'Buy ' + productName + ' in ' + location
  return kind === 'title' ? 'Продажба на ' + productName + ' в ' + location : 'Купете ' + productName + ' в ' + location
}

function formatPrice(price, language) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return ''
  return price.toFixed(2) + ' €'
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

  const cards = entries.map((product, index) => {
    const variant = product._catalogVariant
    const name = localizedProductName(product, language) || product.slugValue
    const url = productUrl(product, language, siteUrl)
    const price = typeof variant?.priceEUR === 'number' && variant.priceEUR > 0 ? variant.priceEUR : null
    const priceLabel = price === null
      ? (language === 'ru' ? 'Цена по запросу' : language === 'en' ? 'Price on request' : 'Цена по запитване')
      : formatPrice(price, language)
    const oldPrice = typeof variant?.oldPriceEUR === 'number' && typeof price === 'number' && variant.oldPriceEUR > price
      ? formatPrice(variant.oldPriceEUR, language)
      : ''
    const status = availabilityLabel({ ...product, stockStatus: variant?.stockStatus || product.stockStatus }, language)
    const mainImage = typeof product.imageUrl === 'string' ? product.imageUrl : ''
    const gallery = Array.isArray(product.galleryImageUrls) ? product.galleryImageUrls.filter((url) => typeof url === 'string' && url) : []
    const candidates = Array.from(new Set([mainImage, ...gallery].filter(Boolean)))
    let imageUrl = mainImage || candidates[0] || ''
    if (variant && candidates.length > 1) {
      const prices = (product.saleVariants || []).map((item) => item.priceEUR).filter((item) => typeof item === 'number' && Number.isFinite(item) && item > 0)
      const highestPrice = prices.length ? Math.max(...prices) : null
      if (!(highestPrice !== null && variant.priceEUR === highestPrice)) {
        const identity = variant._key || variant.sku || variant.name || String(product._catalogVariantIndex)
        const seed = product._id + ':' + identity
        let hash = 2166136261
        for (let i = 0; i < seed.length; i += 1) {
          hash ^= seed.charCodeAt(i)
          hash = Math.imul(hash, 16777619)
        }
        imageUrl = candidates[(hash >>> 0) % candidates.length]
      }
    }
    const image = imageUrl
      ? '<div style="height:160px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f8fafc;border-radius:8px;margin-bottom:12px"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(name) + '" loading="' + (index < 2 ? 'eager' : 'lazy') + '" decoding="async" style="max-width:100%;max-height:100%;object-fit:contain" /></div>'
      : ''
    const size = [
      typeof variant?.saleHeightCm === 'number' && variant.saleHeightCm > 0 ? (language === 'en' ? 'Height ' : language === 'ru' ? 'Высота ' : 'Височина ') + variant.saleHeightCm + (language === 'en' ? ' cm' : ' см') : '',
      typeof variant?.containerVolumeL === 'number' && variant.containerVolumeL > 0 ? (language === 'en' ? 'Pot ' : language === 'ru' ? 'Контейнер ' : 'Контейнер ') + variant.containerVolumeL + ' L' : '',
    ].filter(Boolean).join(' · ')
    const variantName = variant
      ? (language === 'ru' ? variant.nameRu || variant.name : language === 'en' ? variant.nameEn || variant.name : variant.name) || ''
      : ''
    const shortDescription = localizedValue(product, 'shortDescription', language)
    const winter = typeof product.plantCare?.minWinterTempC === 'number'
      ? (language === 'en' ? 'Minimum winter temperature: ' : language === 'ru' ? 'Минимальная зимняя температура: ' : 'Минимална зимна температура: ') + (product.plantCare.minWinterTempC < 0 ? '−' : product.plantCare.minWinterTempC > 0 ? '+' : '') + Math.abs(product.plantCare.minWinterTempC) + ' °C'
      : ''
    return '<li><article style="height:100%;border:1px solid #e5e7eb;border-radius:12px;padding:12px">' + image +
      (winter ? '<p style="margin:0 0 6px;font-size:12px">❄ ' + escapeHtml(winter) + '</p>' : '') +
      '<h3><a href="' + escapeHtml(url) + '">' + escapeHtml(name) + '</a></h3>' +
      (shortDescription ? '<p>' + escapeHtml(shortDescription) + '</p>' : '') +
      '<p><strong>' + escapeHtml(priceLabel) + '</strong> ' + (oldPrice ? '<del>' + escapeHtml(oldPrice) + '</del>' : '') + '</p>' +
      (size ? '<p>' + escapeHtml(size) + '</p>' : '') +
      (status ? '<p>' + escapeHtml(status) + '</p>' : '') +
      (variantName ? '<p>' + escapeHtml((language === 'ru' ? 'Вариант: ' : language === 'en' ? 'Option: ' : 'Вариант: ') + variantName) + '</p>' : '') +
      '</article></li>'
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
