export interface CategoryItem {
  _id: string
  name: string
  slug?: { current: string }
  imageUrl?: string
  description?: any
  sortOrder?: number
  seo?: { 
    metaTitle?: string
    metaDescription?: string
    noIndex?: boolean
  }
}

export interface Product {
  _id: string
  name: string
  slug?: { current: string }
  priceEUR: number
  oldPriceEUR?: number
  sku?: string
  imageUrl?: string
  category?: string
  categoryId?: string
  stockStatus?: string
  description?: any
  shortDescription?: string
  specifications?: Array<{ name: string; value: string; unit?: string }>
}

export interface ServiceItem {
  _id: string
  name: string
  slug?: { current: string }
  shortDescription?: string
  description?: any
  imageUrl?: string
  startingPriceEUR?: number
  isActive?: boolean
  advantages?: Array<{ title: string; description?: string }>
  steps?: Array<{ stepNumber?: number; title: string; description?: string }>
  hero?: { title?: string; subtitle?: string }
  callToAction?: { title?: string; buttonText?: string }
  leadForm?: { formTitle?: string; submitButtonText?: string }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    seoTitle?: string
    seoDescription?: string
  }
}

export interface SiteSettings {
  siteName?: string
  heroTitle?: string
  heroSubtitle?: string
}
