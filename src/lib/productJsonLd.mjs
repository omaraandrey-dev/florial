function validPrice(price) {
  return typeof price === 'number' && Number.isFinite(price) && price > 0
}

function getConsistentAvailability(statuses) {
  if (!statuses.length) return null
  const first = statuses[0]
  if (!['inStock', 'outOfStock'].includes(first)) return null
  return statuses.every((status) => status === first)
    ? (first === 'inStock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock')
    : null
}

export function getServerProductPrice(product) {
  if (product?._dataset === 'plants') {
    const variant = product.saleVariants?.[0]
    return validPrice(variant?.priceEUR) ? variant.priceEUR : null
  }
  return validPrice(product?.priceEUR) ? product.priceEUR : null
}

/**
 * Build the canonical Offer payload shared by Cloudflare SSR and ProductPage.
 * "onRequest" is deliberately not mapped to PreOrder: the two states are not
 * interchangeable without an explicit commercial policy.
 */
export function buildProductOffer(product, url) {
  if (product?._dataset === 'plants') {
    const pricedVariants = (product.saleVariants || []).filter((variant) => validPrice(variant?.priceEUR))
    if (!pricedVariants.length) return null

    const prices = pricedVariants.map((variant) => variant.priceEUR).sort((a, b) => a - b)
    const statuses = pricedVariants.map((variant) => variant.stockStatus || product.stockStatus)
    const availability = getConsistentAvailability(statuses)

    if (pricedVariants.length === 1) {
      return {
        '@type': 'Offer',
        price: prices[0].toFixed(2),
        priceCurrency: 'EUR',
        url,
        itemCondition: 'https://schema.org/NewCondition',
        ...(availability ? { availability } : {}),
      }
    }

    return {
      '@type': 'AggregateOffer',
      lowPrice: prices[0].toFixed(2),
      highPrice: prices[prices.length - 1].toFixed(2),
      offerCount: pricedVariants.length,
      priceCurrency: 'EUR',
      url,
      ...(availability ? { availability } : {}),
    }
  }

  if (!validPrice(product?.priceEUR)) return null
  const availability = getConsistentAvailability([product.stockStatus])
  return {
    '@type': 'Offer',
    price: product.priceEUR.toFixed(2),
    priceCurrency: 'EUR',
    url,
    itemCondition: 'https://schema.org/NewCondition',
    ...(availability ? { availability } : {}),
  }
}
