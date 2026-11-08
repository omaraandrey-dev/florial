export interface CategoryItem {
  translations?: Record<string, Record<string, any>>
  _id: string
  name: string
  slug?: { current: string }
  imageUrl?: string
  imageAlt?: string
  imageAltEn?: string
  imageAltRu?: string
  imageTitle?: string
  imageTitleEn?: string
  imageTitleRu?: string
  description?: any
  sortOrder?: number
  parentId?: string | null
  seo?: { h1?: string; metaTitle?: string; metaDescription?: string; seoTitle?: string; seoDescription?: string; noIndex?: boolean }
  isPlantCategory?: boolean
  helpBlock?: { title?: string; text?: string; buttonLabel?: string; buttonUrl?: string; translations?: Record<string, { title?: string; text?: string; buttonLabel?: string }> }
}

export interface CartItem {
  product: Product
  quantity: number
  saleVariant?: PlantSaleVariant
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

export interface PlantSaleVariant {
  _key?: string
  name: string
  nameEn?: string
  nameRu?: string
  sku?: string
  saleHeightCm?: number
  containerVolumeL?: number
  priceEUR?: number
  oldPriceEUR?: number
  stockStatus?: 'inStock' | 'onRequest' | 'outOfStock'
  stockQuantity?: number
}

export interface KitComponent {
  _key?: string
  quantity: number
  unit?: 'pcs' | 'm'
  note?: Partial<Record<'bg' | 'ru' | 'en', string>>
  product?: {
    _id?: string
    name?: string
    translations?: Record<string, Record<string, any>>
    slug?: string | { current?: string }
    sku?: string
    imageUrl?: string
    isActive?: boolean
  } | null
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
  saleVariants?: PlantSaleVariant[]
  vatIncluded?: boolean
  stockQuantity?: number
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
  kitComponents?: KitComponent[]
  specifications?: Array<{ name: string; value: string; unit?: string; translations?: Record<string, Record<string, any>> }>
  compatibility?: string[]
  seo?: { h1?: string; metaTitle?: string; metaDescription?: string; title?: string; description?: string; seoTitle?: string; seoDescription?: string; keywords?: string[]; noIndex?: boolean }
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
  sortOrder?: number
  serviceCategory?: 'landscaping' | 'planting' | 'irrigation' | 'lawn' | 'maintenance' | 'delivery'
  serviceLayout?: 'standard' | 'delivery'
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
  advantages?: Array<{ title?: string; text?: string; description?: string }>
  steps?: Array<{ stepNumber?: number; title?: string; text?: string; description?: string }>
  hero?: { title?: string; subtitle?: string; imageUrl?: string; imageAlt?: string; imageAltEn?: string; imageAltRu?: string }
  callToAction?: { title?: string; text?: string; buttonLabel?: string; buttonText?: string }
  leadForm?: {
    title?: string
    formTitle?: string
    submitLabel?: string
    submitButtonText?: string
    successMessage?: string
    consentText?: string
    privacyPolicyUrl?: string
    placeholder?: string
    type?: string
    fields?: Array<{ _key?: string; name: string; type?: 'text' | 'tel' | 'email' | 'textarea'; label?: string; placeholder?: string; required?: boolean }>
  }
  seo?: { metaTitle?: string; metaDescription?: string; seoTitle?: string; seoDescription?: string; keywords?: string[]; noIndex?: boolean }
}

export interface SiteSettings {
  translations?: Record<string, Record<string, any>>
  siteName?: string
  heroTitle?: string
  heroSubtitle?: string
  logoUrl?: string | null
  logoAlt?: string | null
  logoAltEn?: string | null
  logoAltRu?: string | null
  logoAssetTitle?: string | null
  logoAssetAltText?: string | null
  logoTitle?: string | null
  logoTitleEn?: string | null
  logoTitleRu?: string | null
  logoWidth?: number | null
  logoHeight?: number | null
}
