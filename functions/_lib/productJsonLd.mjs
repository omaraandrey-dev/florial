export function getServerProductPrice(product) {
  if (product?._dataset === 'plants') {
    const variant = (product.saleVariants || []).find((item) =>
      typeof item?.priceEUR === 'number' && Number.isFinite(item.priceEUR) && item.priceEUR > 0
    )
    return variant?.priceEUR ?? null
  }
  return typeof product?.priceEUR === 'number' && Number.isFinite(product.priceEUR) && product.priceEUR > 0
    ? product.priceEUR
    : null
}

export function buildProductOffer(product, url) {
  if (product?._dataset === 'plants') {
    const prices = [...new Set((product.saleVariants || [])
      .map((variant) => variant?.priceEUR)
      .filter((price) => typeof price === 'number' && Number.isFinite(price) && price > 0))]
      .sort((a, b) => a - b)

    if (prices.length === 1) {
      return {
        '@type': 'Offer',
        price: prices[0].toFixed(2),
        priceCurrency: 'EUR',
        url,
        itemCondition: 'https://schema.org/NewCondition',
      }
    }
    if (prices.length > 1) {
      return {
        '@type': 'AggregateOffer',
        lowPrice: prices[0].toFixed(2),
        highPrice: prices[prices.length - 1].toFixed(2),
        offerCount: prices.length,
        priceCurrency: 'EUR',
        url,
      }
    }
    return null
  }

  if (typeof product?.priceEUR !== 'number' || !Number.isFinite(product.priceEUR) || product.priceEUR <= 0) return null
  return {
    '@type': 'Offer',
    price: product.priceEUR.toFixed(2),
    priceCurrency: 'EUR',
    url,
    itemCondition: 'https://schema.org/NewCondition',
    ...(product.stockStatus === 'inStock' ? { availability: 'https://schema.org/InStock' } : {}),
    ...(product.stockStatus === 'outOfStock' ? { availability: 'https://schema.org/OutOfStock' } : {}),
  }
}
