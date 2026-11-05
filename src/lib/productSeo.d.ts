export type ProductSeoLocale = 'bg' | 'ru' | 'en'
export type ProductSeoOutput = {
  h1: string
  metaTitle: string
  metaDescription: string
  location: string
}
export function generateProductSeo(
  product: Record<string, any>,
  locale: ProductSeoLocale,
  stableIndex?: number,
): ProductSeoOutput | null
export function resolveProductLocation(product: Record<string, any>, stableIndex?: number): Record<string, any>
export const PRODUCT_SEO_MAX_TITLE_LENGTH: number
export const PRODUCT_SEO_LOCATIONS: string[]
