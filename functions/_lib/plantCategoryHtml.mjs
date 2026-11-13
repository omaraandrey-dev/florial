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
    return '<li><article><h3><a href="' + escapeHtml(url) + '">' + escapeHtml(name) + '</a></h3>' +
      (priceLabel ? '<p>' + escapeHtml(priceLabel) + '</p>' : '') +
      (status ? '<p>' + escapeHtml(status) + '</p>' : '') + '</article></li>'
  }).join('')

  return '<section aria-labelledby="florial-category-products" data-florial-server-catalogue="plants">' +
    '<h2 id="florial-category-products">' + heading + '</h2>' +
    '<p>' + (language === 'ru' ? 'Товаров: ' : language === 'en' ? 'Products: ' : 'Продукти: ') + entries.length + '</p>' +
    '<ul>' + cards + '</ul></section>'
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
