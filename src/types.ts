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
  isPlantCategory?: boolean
  helpBlock?: { title?: string; text?: string; buttonLabel?: string; translations?: Record<string, { title?: string; text?: string; buttonLabel?: string }> }
}

export interface CartItem {
  product: Product
  quantity: number
}
export interface RelatedContentItem {
  _id: string
  _type: 'service' | 'blogPost'
  name?: string
  title?: string
  slug?: { current: string }
  shortDescription?: string
  translations?: Record<string, Record<string, any>>
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  isActive?: boolean
  isPublished?: boolean
  linkLabel?: string
}

export type PlantProductType =
  | 'plant'
  | 'tree'
  | 'shrub'
  | 'flower'
  | 'perennial'
  | 'indoor'
  | 'citrus'
  | 'palm'
  | 'conifer'
  | 'fruit'
  | 'succulent'
  | 'climber'
  | 'ornamentalGrass'
  | 'groundcover'
  | 'bulb'
  | 'herb'
  | 'aquatic'
  | 'other'

export interface PlantCare {
  light?: 'sun' | 'partialShade' | 'shade'
  waterNeeds?: 'low' | 'medium' | 'high'
  minWinterTempC?: number
  blackSeaCoast?: 'suitable' | 'notSuitable' | 'needsVerification'
  adultHeightCm?: number
  foliageType?: 'evergreen' | 'deciduous'
  floweringSeason?: Array<'spring' | 'summer' | 'autumn' | 'winter'>
  plantingSeason?: Array<'spring' | 'summer' | 'autumn' | 'winter' | 'yearRound'>
  saleFormat?: {
    containerVolumeL?: number
    saleHeightCm?: number
  }
}

export interface Product {
  categoryTranslations?: Record<string, any>
  translations?: Record<string, Record<string, any>>
  _id: string
  name: string
  productType?: PlantProductType | 'equipment'
  scientificName?: string
  plantDetails?: {
    /** @deprecated Use Product.scientificName */
    scientificName?: string
    availabilityNote?: string
    [key: string]: any
  }
  plantCare?: PlantCare
  careGuide?: any[]
  recommendedIrrigation?: {
    irrigationType?: 'drip' | 'rotator' | 'root' | 'mist'
    productSlug?: string
  }
  recommendedIrrigationProduct?: Product
  relatedContentBySlug?: Array<{
    contentType: 'service' | 'blogPost'
    slug: string
    label?: string
  }>
  isFeatured?: boolean
  slug?: { current: string }
  priceEUR: number
  oldPriceEUR?: number
  sku?: string
  brand?: string
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  galleryImages?: Array<string | { url?: string | null; alt?: string | null; altEn?: string | null; altRu?: string | null } | null>
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
  relatedContent?: RelatedContentItem[]
}

export interface ServiceContentBlock {
  _key?: string
  title?: string
  text?: any
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  imagePosition?: 'left' | 'right'
  translations?: Record<string, { title?: string; text?: string }>
}

export interface ServiceGalleryImage {
  _key?: string
  url?: string
  alt?: string
  altEn?: string
  altRu?: string
}

export interface ServiceItem {
  translations?: Record<string, Record<string, any>>
  _id: string
  name: string
  slug?: { current: string }
  shortDescription?: string
  description?: any
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
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
