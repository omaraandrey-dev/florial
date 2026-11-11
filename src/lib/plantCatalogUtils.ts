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

    const aVariantIndex = a.variant ? (a.product.saleVariants || []).indexOf(a.variant) : -1
    const bVariantIndex = b.variant ? (b.product.saleVariants || []).indexOf(b.variant) : -1
    if (a.product._id === b.product._id && aVariantIndex !== bVariantIndex) return aVariantIndex - bVariantIndex

    const aVariantName = a.variant ? getVariantName(a.variant, aVariantIndex) : ''
    const bVariantName = b.variant ? getVariantName(b.variant, bVariantIndex) : ''
    return aVariantName.localeCompare(bVariantName, locale)
  })
}


export function resolveInitialPlantVariantKey(
  variants: PlantSaleVariant[] | undefined,
  requestedKey?: string | null,
): string {
  if (!variants?.length) return '0'
  if (requestedKey && variants.some((variant, index) => (variant._key || String(index)) === requestedKey)) {
    return requestedKey
  }
  return variants[0]._key || '0'
}


/**
 * Pick the category-card image for a plant offer.
 * The most expensive sale variant always uses Sanity mainImage.
 * Other variants receive a stable pseudo-random image from main + gallery so
 * React rerenders do not make the card image jump around.
 */
export function getPlantCatalogCardImageUrl(
  product: Product,
  variant?: PlantSaleVariant,
): string | undefined {
  const mainImage = product.mainImageUrl || product.imageUrl
  const galleryImages = (product.galleryImages || [])
    .map((image) => typeof image === 'string' ? image : image?.url)
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
  const candidates = Array.from(new Set([mainImage, ...galleryImages].filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  )))

  if (!variant) return mainImage || candidates[0]

  const prices = (product.saleVariants || [])
    .map((item) => item.priceEUR)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)
  const highestPrice = prices.length > 0 ? Math.max(...prices) : null

  if (
    highestPrice !== null &&
    typeof variant.priceEUR === 'number' &&
    Number.isFinite(variant.priceEUR) &&
    variant.priceEUR === highestPrice
  ) {
    return mainImage || candidates[0]
  }

  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]

  const variantIndex = (product.saleVariants || []).indexOf(variant)
  const variantIdentity = variant._key || variant.sku || variant.name || String(variantIndex)
  const seed = product._id + ':' + variantIdentity
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return candidates[(hash >>> 0) % candidates.length]
}
