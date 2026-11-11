import type { Product } from '../types'

export type PlantCatalogSort = 'default' | 'priceAsc' | 'priceDesc'
export type PlantAvailability = 'inStock' | 'onRequest' | 'outOfStock'

export function getPlantStockStatus(
  product: Pick<Product, 'stockStatus' | 'saleVariants'>,
): PlantAvailability | null {
  const variantStatuses = (product.saleVariants || [])
    .map((variant) => variant.stockStatus)
    .filter((status): status is PlantAvailability =>
      status === 'inStock' || status === 'onRequest' || status === 'outOfStock',
    )

  if (variantStatuses.length > 0) {
    if (variantStatuses.includes('inStock')) return 'inStock'
    if (variantStatuses.includes('onRequest')) return 'onRequest'
    return 'outOfStock'
  }

  if (
    product.stockStatus === 'inStock' ||
    product.stockStatus === 'onRequest' ||
    product.stockStatus === 'outOfStock'
  ) {
    return product.stockStatus
  }

  return null
}

export function getPlantAvailabilityPriority(
  product: Pick<Product, 'stockStatus' | 'saleVariants'>,
): number {
  const status = getPlantStockStatus(product)
  if (status === 'inStock') return 0
  if (status === 'onRequest') return 1
  return 2
}

export function getPlantMinimumPrice(
  product: Pick<Product, 'saleVariants'>,
): number | null {
  const prices = (product.saleVariants || [])
    .map((variant) => variant.priceEUR)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)

  return prices.length > 0 ? Math.min(...prices) : null
}

export function getPlantDisplayName(
  product: Pick<Product, 'name' | 'seo' | 'translations'>,
  localizedName: unknown,
  language: 'bg' | 'ru' | 'en',
): string {
  const localized = typeof localizedName === 'string' ? localizedName.trim() : ''
  if (localized) return localized

  const localizedH1 = language === 'bg'
    ? ''
    : product.translations?.[language]?.seo?.h1?.trim()

  return localizedH1 || product.name?.trim() || product.seo?.h1?.trim() || ''
}

export function comparePlantProducts(
  a: Product,
  b: Product,
  sort: PlantCatalogSort,
  getName: (product: Product) => string,
  locale: string,
): number {
  const availabilityDifference = getPlantAvailabilityPriority(a) - getPlantAvailabilityPriority(b)
  if (availabilityDifference !== 0) return availabilityDifference

  if (sort !== 'default') {
    const aPrice = getPlantMinimumPrice(a)
    const bPrice = getPlantMinimumPrice(b)

    if (aPrice === null && bPrice !== null) return 1
    if (aPrice !== null && bPrice === null) return -1

    if (aPrice !== null && bPrice !== null && aPrice !== bPrice) {
      return sort === 'priceAsc' ? aPrice - bPrice : bPrice - aPrice
    }
  }

  return getName(a).localeCompare(getName(b), locale)
}
