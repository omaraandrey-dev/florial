export function getServerProductPrice(product) {
  if (product?._dataset === 'plants') {
    const variant = product.saleVariants?.[0]
    return typeof variant?.priceEUR === 'number' && Number.isFinite(variant.priceEUR) && variant.priceEUR > 0
      ? variant.priceEUR
      : null
  }
  return typeof product?.priceEUR === 'number' && Number.isFinite(product.priceEUR) && product.priceEUR > 0
    ? product.priceEUR
    : null
}

export function buildProductOffer(product, url) {
  if (product?._dataset === 'plants') {
    const variantPrices = (product.saleVariants || [])
      .map((variant) => variant?.priceEUR)
      .filter((price) => typeof price === 'number' && Number.isFinite(price) && price > 0)
    const prices = [...new Set(variantPrices)].sort((a, b) => a - b)

    if (variantPrices.length === 1) {
      return {
        '@type': 'Offer',
        price: prices[0].toFixed(2),
        priceCurrency: 'EUR',
        url,
        itemCondition: 'https://schema.org/NewCondition',
      }
    }
    if (variantPrices.length > 1) {
      return {
        '@type': 'AggregateOffer',
        lowPrice: prices[0].toFixed(2),
        highPrice: prices[prices.length - 1].toFixed(2),
        offerCount: variantPrices.length,
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
