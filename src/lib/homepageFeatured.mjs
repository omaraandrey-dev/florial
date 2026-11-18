/**
 * @param {{ saleVariants?: Array<{ priceEUR?: number; stockStatus?: string }> | null; priceEUR?: number }} product
 * @returns {{ price: number; from: boolean } | null}
 */
export function getPlantPrice(product) {
  const variants = product.saleVariants || []
  if (variants.length) {
    const prices = variants
      .filter((variant) => variant.stockStatus !== 'outOfStock')
      .map((variant) => variant.priceEUR)
      .filter((price) => typeof price === 'number' && Number.isFinite(price) && price > 0)
    return prices.length
      ? { price: Math.min(...prices), from: new Set(prices).size > 1 }
      : null
  }

  return typeof product.priceEUR === 'number' && Number.isFinite(product.priceEUR) && product.priceEUR > 0
    ? { price: product.priceEUR, from: false }
    : null
}

/**
 * @template T
 * @param {T[] | null | undefined} products
 * @returns {T[]}
 */
export function selectFeaturedEquipment(products) {
  const items = Array.isArray(products) ? products : []
  const regularPicks = items
    .filter((product) => product.slug?.current !== 'komplekt-polivane-5x5' && product.slug?.current !== 'komplekt-avtomatizatsiya-6-zoni')
    .slice(0, 3)
  const sixZoneKit = items.find((product) => product.slug?.current === 'komplekt-avtomatizatsiya-6-zoni')
  return sixZoneKit ? [...regularPicks, sixZoneKit] : regularPicks
}
