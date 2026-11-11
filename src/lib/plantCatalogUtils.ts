import type { PlantSaleVariant, Product } from '../types'

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


export interface PlantCatalogOffer {
  product: Product
  variant?: PlantSaleVariant
  variantKey?: string
}

export function getPlantOfferAvailabilityPriority(
  product: Product,
  variant?: PlantSaleVariant,
): number {
  const status = variant?.stockStatus || product.stockStatus
  if (status === 'inStock') return 0
  if (status === 'onRequest') return 1
  return 2
}

export function buildPlantCatalogOffers(
  products: Product[],
  sort: PlantCatalogSort,
  getName: (product: Product) => string,
  getVariantName: (variant: PlantSaleVariant, index: number) => string,
  locale: string,
): PlantCatalogOffer[] {
  const offers = products.flatMap((product) => {
    const variants = product.saleVariants || []
    if (variants.length === 0) return [{ product }]

    return variants.map((variant, index) => ({
      product,
      variant,
      variantKey: variant._key || String(index),
    }))
  })

  return offers.sort((a, b) => {
    const availabilityDifference =
      getPlantOfferAvailabilityPriority(a.product, a.variant) -
      getPlantOfferAvailabilityPriority(b.product, b.variant)
    if (availabilityDifference !== 0) return availabilityDifference

    if (sort !== 'default') {
      const aPrice = a.variant?.priceEUR ?? a.product.priceEUR
      const bPrice = b.variant?.priceEUR ?? b.product.priceEUR
      const aHasPrice = typeof aPrice === 'number' && Number.isFinite(aPrice) && aPrice > 0
      const bHasPrice = typeof bPrice === 'number' && Number.isFinite(bPrice) && bPrice > 0

      if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1
      if (aHasPrice && bHasPrice && aPrice !== bPrice) {
        return sort === 'priceAsc' ? aPrice - bPrice : bPrice - aPrice
      }
    }

    const nameDifference = getName(a.product).localeCompare(getName(b.product), locale)
    if (nameDifference !== 0) return nameDifference

    const aVariantName = a.variant ? getVariantName(a.variant, (a.product.saleVariants || []).indexOf(a.variant)) : ''
    const bVariantName = b.variant ? getVariantName(b.variant, (b.product.saleVariants || []).indexOf(b.variant)) : ''
    return aVariantName.localeCompare(bVariantName, locale)
  })
}
