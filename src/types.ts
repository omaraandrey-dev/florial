export interface CategoryItem {
  translations?: Record<string, Record<string, any>>
  _id: string
  name: string
  slug?: { current: string }
  imageUrl?: string
  description?: any
  sortOrder?: number
  parentId?: string | null
  seo?: { metaTitle?: string; metaDescription?: string; seoTitle?: string; seoDescription?: string; noIndex?: boolean }
}

export interface CartItem {
  product: Product
  quantity: number
}
export interface Product {
  categoryTranslations?: Record<string, any>
  translations?: Record<string, Record<string, any>>
  _id: string
  name: string
  productType?: 'plant' | 'equipment'
  scientificName?: string
  plantDetails?: { scientificName?: string; availabilityNote?: string; [key: string]: any }
  slug?: { current: string }
  priceEUR: number
  oldPriceEUR?: number
  sku?: string
  imageUrl?: string
  galleryImages?: string[]
  category?: string
  categoryId?: string
  categorySlug?: string
  categories?: Array<{ _id: string; name: string; slug?: { current: string } }>
  stockStatus?: string
  description?: any
  shortDescription?: string
  specifications?: Array<{ name: string; value: string; unit?: string; translations?: Record<string, Record<string, any>> }>
  compatibility?: string[]
  seo?: { metaTitle?: string; metaDescription?: string; seoTitle?: string; seoDescription?: string; keywords?: string[]; noIndex?: boolean }
  manualPDFUrl?: string
  catalogPDFUrl?: string
  documents?: Array<{ title: string; fileUrl: string }>
  compatibleProducts?: Product[]
  relatedProducts?: Product[]
}

export interface ServiceContentBlock {
  _key?: string
  title?: string
  text?: any
  imageUrl?: string
  imageAlt?: string
  imagePosition?: 'left' | 'right'
}

export interface ServiceGalleryImage {
  _key?: string
  url?: string
  alt?: string
}

export interface ServiceItem {
  translations?: Record<string, Record<string, any>>
  _id: string
  name: string
  slug?: { current: string }
  shortDescription?: string
  description?: any
  imageUrl?: string
  galleryImages?: ServiceGalleryImage[]
  contentBlocks?: ServiceContentBlock[]
  startingPriceEUR?: number
  isActive?: boolean
  advantages?: Array<{ title: string; description?: string }>
  steps?: Array<{ stepNumber?: number; title: string; description?: string }>
  hero?: { title?: string; subtitle?: string }
  callToAction?: { title?: string; buttonText?: string }
  leadForm?: { formTitle?: string; submitButtonText?: string }
  seo?: { metaTitle?: string; metaDescription?: string; seoTitle?: string; seoDescription?: string; keywords?: string[]; noIndex?: boolean }
}

export interface SiteSettings {
  translations?: Record<string, Record<string, any>>
  siteName?: string
  heroTitle?: string
  heroSubtitle?: string
  logoUrl?: string | null
}
