function validPrice(price) {
  return typeof price === 'number' && Number.isFinite(price) && price > 0
}

function getAvailability(status) {
  if (status === 'inStock') return 'https://schema.org/InStock'
  if (status === 'outOfStock') return 'https://schema.org/OutOfStock'
  // "onRequest" is not equivalent to a confirmed pre-order.
  return null
}

export function getServerProductPrice(product) {
  if (product?._dataset === 'plants') {
    const variant = product.saleVariants?.[0]
    return validPrice(variant?.priceEUR) ? variant.priceEUR : null
  }
  return validPrice(product?.priceEUR) ? product.priceEUR : null
}

/**
 * Build the canonical single Offer shared by Cloudflare SSR and ProductPage.
 *
 * Google does not recommend AggregateOffer for a set of product variants.
 * Until each plant variant has a stable unique identifier and its own
 * crawlable URL, describe only the default (first) variant shown in initial
 * HTML. Do not invent SKU/GTIN values or claim all variants as one offer.
 */
export function buildProductOffer(product, url) {
  if (product?._dataset === 'plants') {
    const variant = product.saleVariants?.[0]
    if (!validPrice(variant?.priceEUR)) return null

    const availability = getAvailability(variant.stockStatus || product.stockStatus)
    return {
      '@type': 'Offer',
      price: variant.priceEUR.toFixed(2),
      priceCurrency: 'EUR',
      url,
      itemCondition: 'https://schema.org/NewCondition',
      ...(availability ? { availability } : {}),
    }
  }

  if (!validPrice(product?.priceEUR)) return null
  const availability = getAvailability(product.stockStatus)
  return {
    '@type': 'Offer',
    price: product.priceEUR.toFixed(2),
    priceCurrency: 'EUR',
    url,
    itemCondition: 'https://schema.org/NewCondition',
    ...(availability ? { availability } : {}),
  }
}
