export type EquipmentProductLocale = 'bg' | 'ru' | 'en'

export type EquipmentProductCategory = {
  _id: string
  name?: string
  slugValue?: string
  parentId?: string
  translations?: Record<string, { name?: string } | undefined>
}

export type EquipmentProductDocument = {
  _id: string
  _dataset?: string
  name?: string
  slugValue?: string
  sku?: string
  brandName?: string
  priceEUR?: number
  oldPriceEUR?: number
  vatIncluded?: boolean
  stockStatus?: string
  weightKg?: number
  shortDescription?: string
  description?: unknown
  seo?: Record<string, any>
  translations?: Record<string, Record<string, any>>
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  galleryImages?: Array<{ _key?: string; url?: string; alt?: string; altEn?: string; altRu?: string }>
  specifications?: Array<Record<string, any>>
  compatibility?: string[]
  manualPDFUrl?: string
  catalogPDFUrl?: string
  categoryId?: string
  categoryIds?: string[]
  relatedProducts?: Array<Record<string, any>>
  relatedContent?: Array<Record<string, any>>
  kitComponents?: Array<Record<string, any>>
}

export function getEquipmentProductMetadata(
  product: EquipmentProductDocument,
  language: EquipmentProductLocale,
): { name: string; h1: string; title: string; metaDescription: string; description: string; noIndex: boolean }

export function buildEquipmentProductStructuredData(
  product: EquipmentProductDocument,
  categories: EquipmentProductCategory[],
  language: EquipmentProductLocale,
  canonicalUrl: string,
): [Record<string, unknown>, Record<string, unknown>]

export function renderEquipmentProductHtml(
  product: EquipmentProductDocument,
  categories: EquipmentProductCategory[],
  language: EquipmentProductLocale,
): string
