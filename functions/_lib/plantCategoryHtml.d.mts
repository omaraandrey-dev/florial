export type PlantCategoryProduct = {
  _id: string
  name?: string
  slugValue?: string
  priceEUR?: number
  stockStatus?: string
  translations?: Record<string, { name?: string; seo?: { h1?: string } } | undefined>
  seo?: { h1?: string }
  saleVariants?: Array<{
    name?: string
    nameEn?: string
    nameRu?: string
    priceEUR?: number
    stockStatus?: string
    saleHeightCm?: number
    containerVolumeL?: number
  }>
}

export function collectDescendantCategoryIds(
  rootId: string,
  categories: Array<{ _id: string; parentId?: string | null }>,
): string[]

export function buildPlantCategoryEntries(
  products: PlantCategoryProduct[],
  language?: 'bg' | 'ru' | 'en',
): PlantCategoryProduct[]

export function renderPlantCategoryListing(
  products: PlantCategoryProduct[],
  language?: 'bg' | 'ru' | 'en',
  siteUrl?: string,
): string

export function buildPlantCategoryItemList(
  products: PlantCategoryProduct[],
  language?: 'bg' | 'ru' | 'en',
  siteUrl?: string,
): Record<string, unknown>
