import { sanityClient, publicPlantsClient } from '../sanity'
import { mergeCategoryRelatedContent, parseCategoryRelatedContentPath } from '../plantRelatedContentUtils.mjs'
import type { Product } from '../../types'

const PLANT_PRODUCT_TYPES = new Set([
  'plant', 'tree', 'shrub', 'flower', 'perennial', 'indoor', 'citrus',
  'palm', 'conifer', 'fruit', 'succulent', 'climber', 'ornamentalGrass',
  'groundcover', 'bulb', 'herb', 'aquatic', 'other',
])

const isPlantProductType = (productType?: string) => PLANT_PRODUCT_TYPES.has(productType || '')

const PRODUCT_ROUTE_CACHE_TTL_MS = 30_000
const productIdentityCache = new Map<string, { dataset: 'production' | 'plants'; id: string; expiresAt: number }>()
const productDetailsCache = new Map<string, { product: Product; expiresAt: number }>()
const productDetailsInFlight = new Map<string, Promise<Product | null>>()

function writeProductIdentity(slug: string, dataset: 'production' | 'plants', id: string) {
  productIdentityCache.delete(slug)
  productIdentityCache.set(slug, { dataset, id, expiresAt: Date.now() + PRODUCT_ROUTE_CACHE_TTL_MS })
  if (productIdentityCache.size > 100) {
    const oldestKey = productIdentityCache.keys().next().value
    if (oldestKey !== undefined) productIdentityCache.delete(oldestKey)
  }
}

function writeProductDetails(key: string, product: Product) {
  productDetailsCache.delete(key)
  productDetailsCache.set(key, { product, expiresAt: Date.now() + PRODUCT_ROUTE_CACHE_TTL_MS })
  if (productDetailsCache.size > 100) {
    const oldestKey = productDetailsCache.keys().next().value
    if (oldestKey !== undefined) productDetailsCache.delete(oldestKey)
  }
}

function readProductIdentity(slug: string) {
  const cached = productIdentityCache.get(slug)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    productIdentityCache.delete(slug)
    return null
  }
  return cached
}

export async function fetchProductDetailsBySlug(slug: string, isCancelled: () => boolean = () => false): Promise<Product | null> {
  if (isCancelled()) return null
  const cachedIdentity = readProductIdentity(slug)
  if (cachedIdentity) {
    return fetchProductDetailsByIdentity(cachedIdentity.dataset, cachedIdentity.id, isCancelled, slug)
  }

  const productBySlugQuery = `
    *[_type == "product" && (coalesce(slug.current, slug) == $slug || _id == $slug) && isActive != false][0] {
      _id,
      "productType": "equipment"
    }
  `
  const plantBySlugQuery = `
    *[_type == "product" && (coalesce(slug.current, slug) == $slug || _id == $slug) && isActive != false][0] {
      _id,
      productType
    }
  `

  // All public product details, including displayed price and stock, use the published API CDN.
  // Checkout independently validates the submitted price through the direct Live API.
  const [equipmentResult, plantResult] = await Promise.allSettled([
    sanityClient.fetch(productBySlugQuery, { slug }, { tag: 'browser.product.slug.equipment' }),
    publicPlantsClient.fetch(plantBySlugQuery, { slug }, { tag: 'browser.product.slug.plants' }),
  ])
  if (isCancelled()) return null

  const equipmentProduct = equipmentResult.status === 'fulfilled' ? equipmentResult.value : null
  const plantProduct = plantResult.status === 'fulfilled' ? plantResult.value : null
  const foundProduct = equipmentProduct || plantProduct

  if (!foundProduct) {
    const failure = [equipmentResult, plantResult].find((result) => result.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
    return null
  }

  const dataset = equipmentProduct ? 'production' : 'plants'
  writeProductIdentity(slug, dataset, foundProduct._id)
  return fetchProductDetails(foundProduct as Product, isCancelled)
}

export async function fetchProductDetailsByIdentity(
  dataset: 'production' | 'plants',
  id: string,
  isCancelled: () => boolean = () => false,
  slug?: string,
): Promise<Product | null> {
  if (!id || (dataset !== 'production' && dataset !== 'plants') || isCancelled()) return null
  if (slug) writeProductIdentity(slug, dataset, id)

  // The SSR route resolver has already identified the exact published dataset and document.
  // Reuse that identity instead of repeating two slug lookups from the browser.
  return fetchProductDetails({
    _id: id,
    productType: dataset === 'plants' ? 'plant' : 'equipment',
  } as Product, isCancelled)
}

export async function fetchProductDetails(foundProduct: Product, isCancelled: () => boolean = () => false): Promise<Product | null> {
  if (isCancelled()) return null

  const isPlant = isPlantProductType(foundProduct.productType)
  const dataset = isPlant ? 'plants' : 'production'
  const cacheKey = dataset + ':' + foundProduct._id
  const cached = productDetailsCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return isCancelled() ? null : cached.product
  if (cached) productDetailsCache.delete(cacheKey)

  let pending = productDetailsInFlight.get(cacheKey)
  if (!pending) {
    // Share the same upstream reads across concurrent React effects/navigation.
    // Cancellation is applied per caller after the shared request completes.
    pending = fetchProductDetailsUncached(foundProduct, () => false)
    productDetailsInFlight.set(cacheKey, pending)
  }

  try {
    const product = await pending
    return isCancelled() ? null : product
  } finally {
    if (productDetailsInFlight.get(cacheKey) === pending) {
      productDetailsInFlight.delete(cacheKey)
    }
  }
}

async function fetchProductDetailsUncached(foundProduct: Product, isCancelled: () => boolean): Promise<Product | null> {
  const equipmentDetailQuery = `
        *[_type == "product" && _id == $id][0] {
          _id,
          name,
          translations,
          "productType": "equipment",
          "slug": { "current": coalesce(slug.current, slug) },
          sku,
          "brand": brand->name,
          priceEUR,
          oldPriceEUR,
          stockStatus,
          stockQuantity,
          weightKg,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
          "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
          "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
          "galleryImages": gallery[]{ "url": asset->url, alt, altEn, altRu },
          shortDescription,
          description,
          specifications,
          compatibility,
          seo,
          "manualPDFUrl": manualPDF.asset->url,
          "catalogPDFUrl": catalogPDF.asset->url,
          "category": category->name,
          "categoryTranslations": category->translations,
          "categoryRelatedContent": { "buttonUrl": category->helpBlock.buttonUrl },
          "categoryId": category->_id,
          "categorySlug": coalesce(category->slug.current, category->slug),
          "categoryParentId": category->parent->_id,
          "categories": categories[]-> {
            _id, name, translations,
            "slug": { "current": coalesce(slug.current, slug) },
            "parentId": parent->_id
          },
          "relatedProducts": relatedProducts[]->{
            _id, name, translations,
            "productType": "equipment",
            "slug": { "current": coalesce(slug.current, slug) },
            sku, priceEUR, oldPriceEUR, stockStatus,
            "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
            "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
            "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
            "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
            shortDescription
          },
          "relatedContent": relatedContent[]->{
            _id, _type, name, title, translations,
            "slug": { "current": coalesce(slug.current, slug) },
            shortDescription, isActive, isPublished,
            "imageUrl": coalesce(image.asset->url, cover.asset->url, hero.image.asset->url),
            "imageAlt": coalesce(image.alt, cover.alt, name, translations.bg.title, title),
            "imageAltEn": coalesce(image.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
            "imageAltRu": coalesce(image.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
          },
          "kitComponents": kitComponents[]{
            _key, quantity, unit, note { bg, ru, en },
            "product": product->{
              _id, name, translations,
              "slug": { "current": coalesce(slug.current, slug) },
              sku,
              "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
              isActive
            }
          }
        }
      `
  
      const plantDetailQuery = `
        *[_type == "product" && _id == $id][0] {
          _id, name, translations, productType,
          "slug": { "current": coalesce(slug.current, slug) },
          sku, "brand": brand->name, priceEUR, oldPriceEUR, vatIncluded, stockStatus, stockQuantity,
          saleVariants[]{_key, name, nameEn, nameRu, sku, saleHeightCm, containerVolumeL, priceEUR, oldPriceEUR, stockStatus, stockQuantity},
          shortDescription, description, seo,
          scientificName, plantCare, careGuide, recommendedIrrigation,
          relatedContentBySlug, isFeatured, plantDetails { availabilityNote }, sourcePageUrl,
          "categoryRelatedContent": { "buttonUrl": category->helpBlock.buttonUrl },
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url, category->image.asset->url, category->externalImageUrl, category->parent->image.asset->url, category->parent->externalImageUrl),
          "imageAlt": coalesce(mainImage.alt, name, translations.bg.name),
          "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
          "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
          "galleryImages": gallery[]{_key, "url": asset->url, alt, altEn, altRu},
          "category": category->name,
          "categoryTranslations": category->translations,
          "categoryId": category->_id,
          "categorySlug": coalesce(category->slug.current, category->slug),
          "categoryParentId": category->parent->_id,
          "categories": categories[]->{
            _id, name, translations,
            "slug": { "current": coalesce(slug.current, slug) },
            "parentId": parent->_id
          }
        }
      `

  const isPlant = isPlantProductType(foundProduct.productType)
  const dataset = isPlant ? 'plants' : 'production'
  const cacheKey = dataset + ':' + foundProduct._id

  const details = await (isPlant ? publicPlantsClient : sanityClient).fetch(
    isPlant ? plantDetailQuery : equipmentDetailQuery,
    { id: foundProduct._id },
    { tag: isPlant ? 'browser.product.detail.plants' : 'browser.product.detail.equipment' }
  )
  if (isCancelled() || !details) return null

  let enrichedDetails: Product = details
  if (isPlant) {
    const categoryRelated = parseCategoryRelatedContentPath(details.categoryRelatedContent?.buttonUrl)
              const categoryRelatedSlug = categoryRelated?.slug
              const categoryRelatedType = categoryRelated?.type
              const relatedSlugs = Array.from(new Set([
                ...(categoryRelatedSlug ? [categoryRelatedSlug] : []),
                ...(Array.isArray(details.relatedContentBySlug) ? details.relatedContentBySlug : [])
                  .map((item: any) => item?.slug)
                  .filter((slug: any): slug is string => typeof slug === 'string' && slug.length > 0),
              ]))
              const recommendedSlug = details.recommendedIrrigation?.productSlug
    
              const plantRelatedAndIrrigationQuery = `{
                "relatedDocuments": *[
                  _type in ["service", "blogPost"] &&
                  coalesce(slug.current, slug) in $slugs
                ] {
                  _id, _type, name, title,
                  "slug": { "current": coalesce(slug.current, slug) },
                  shortDescription, isActive, isPublished,
                  translations {
                    bg { name, title, shortDescription },
                    ru { name, title, shortDescription },
                    en { name, title, shortDescription }
                  },
                  "imageUrl": coalesce(image.asset->url, mainImage.asset->url, cover.asset->url, hero.image.asset->url),
                  "imageAlt": coalesce(image.alt, mainImage.alt, cover.alt, name, translations.bg.title, title),
                  "imageAltEn": coalesce(image.altEn, mainImage.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
                  "imageAltRu": coalesce(image.altRu, mainImage.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
                },
                "recommendedProduct": *[_type == "product" && coalesce(slug.current, slug) == $recommendedSlug && isActive != false][0] {
                  _id, name, translations,
                  "productType": "equipment",
                  "slug": { "current": coalesce(slug.current, slug) },
                  sku, priceEUR, oldPriceEUR, stockStatus,
                  "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
                  "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
                  "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
                  "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
                  shortDescription
                }
              }`

              const needsRelatedData = relatedSlugs.length > 0 ||
                (typeof recommendedSlug === 'string' && recommendedSlug.length > 0)
              const relatedData = needsRelatedData
                ? await sanityClient.fetch<{
                    relatedDocuments?: any[]
                    recommendedProduct?: Product | null
                  }>(
                    plantRelatedAndIrrigationQuery,
                    { slugs: relatedSlugs, recommendedSlug: recommendedSlug || '' },
                    { tag: 'browser.product.related-and-recommended' },
                  ).catch((error) => {
                    console.error('Sanity: не удалось загрузить связанные материалы и рекомендованное оборудование растения:', error)
                    return { relatedDocuments: [], recommendedProduct: null }
                  })
                : { relatedDocuments: [], recommendedProduct: null }
              const relatedDocuments = Array.isArray(relatedData?.relatedDocuments) ? relatedData.relatedDocuments : []
              const recommendedProduct = relatedData?.recommendedProduct || null
              if (isCancelled()) return null
    
              
    
              const categoryRelatedContent = categoryRelatedSlug
                ? (Array.isArray(relatedDocuments) ? relatedDocuments : []).find((candidate: any) =>
                    candidate._type === categoryRelatedType &&
                    candidate.slug?.current === categoryRelatedSlug &&
                    (candidate._type === 'service' ? candidate.isActive !== false : candidate.isPublished === true)
                  ) || null
                : null
              const individualRelatedContent = (Array.isArray(details.relatedContentBySlug) ? details.relatedContentBySlug : [])
                .map((reference: any) => {
                  const item = (Array.isArray(relatedDocuments) ? relatedDocuments : []).find((candidate: any) =>
                    candidate._type === reference.contentType &&
                    candidate.slug?.current === reference.slug &&
                    (candidate._type === 'service' ? candidate.isActive !== false : candidate.isPublished === true)
                  )
                  return item ? { ...item, linkLabel: reference.label || undefined } : null
                })
                .filter(Boolean)
              const relatedContent = mergeCategoryRelatedContent(categoryRelatedContent, individualRelatedContent)
    
              enrichedDetails = {
                ...details,
                relatedContent,
                recommendedIrrigationProduct: recommendedProduct || undefined,
              }
  } else {
    const categoryRelated = parseCategoryRelatedContentPath(details.categoryRelatedContent?.buttonUrl)
      || parseCategoryRelatedContentPath('/services/avtomatichno-napoyavane')
    if (categoryRelated) {
      const categoryRelatedQuery = `
        *[
          _type == $type &&
          coalesce(slug.current, slug) == $slug
        ][0] {
          _id, _type, name, title,
          "slug": { "current": coalesce(slug.current, slug) },
          shortDescription, isActive, isPublished,
          translations {
            bg { name, title, shortDescription },
            ru { name, title, shortDescription },
            en { name, title, shortDescription }
          },
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url, cover.asset->url, hero.image.asset->url),
          "imageAlt": coalesce(image.alt, mainImage.alt, cover.alt, name, translations.bg.title, title),
          "imageAltEn": coalesce(image.altEn, mainImage.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
          "imageAltRu": coalesce(image.altRu, mainImage.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
        }
      `
      const categoryRelatedContent = await sanityClient.fetch(categoryRelatedQuery, {
        type: categoryRelated.type,
        slug: categoryRelated.slug,
      }, { tag: 'browser.product.category-related' }).catch((error) => {
        console.error('Sanity: не удалось загрузить услугу или статью категории оборудования:', error)
        return null
      })
      if (isCancelled()) return null

      enrichedDetails = {
        ...details,
        relatedContent: mergeCategoryRelatedContent(categoryRelatedContent, details.relatedContent || []),
      }
    }
  }

  if (!isCancelled()) {
    writeProductDetails(cacheKey, enrichedDetails)
  }
  return isCancelled() ? null : enrichedDetails
}
