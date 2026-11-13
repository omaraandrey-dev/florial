import { sanityClient, sanityLiveClient, plantsClient } from '../sanity'
import { mergeCategoryRelatedContent, parseCategoryRelatedContentPath } from '../plantRelatedContentUtils.mjs'
import type { Product } from '../../types'

const PLANT_PRODUCT_TYPES = new Set([
  'plant', 'tree', 'shrub', 'flower', 'perennial', 'indoor', 'citrus',
  'palm', 'conifer', 'fruit', 'succulent', 'climber', 'ornamentalGrass',
  'groundcover', 'bulb', 'herb', 'aquatic', 'other',
])

const isPlantProductType = (productType?: string) => PLANT_PRODUCT_TYPES.has(productType || '')

export async function fetchProductDetails(foundProduct: Product, isCancelled: () => boolean = () => false): Promise<Product | null> {
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
          sku, priceEUR, oldPriceEUR, vatIncluded, stockStatus, stockQuantity,
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
  const details = await (isPlant ? plantsClient : sanityLiveClient).fetch(
    isPlant ? plantDetailQuery : equipmentDetailQuery,
    { id: foundProduct._id }
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
    
              const plantRelatedQuery = `
                *[
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
                }
              `
    
              const irrigationProductQuery = `
                *[_type == "product" && coalesce(slug.current, slug) == $slug && isActive != false][0] {
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
              `
    
              const [relatedDocuments, recommendedProduct] = await Promise.all([
                relatedSlugs.length > 0
                  ? sanityClient.fetch(plantRelatedQuery, { slugs: relatedSlugs }).catch((error) => {
                      console.error('Sanity: не удалось разрешить связанные услуги и статьи растения:', error)
                      return []
                    })
                  : Promise.resolve([]),
                typeof recommendedSlug === 'string' && recommendedSlug.length > 0
                  ? sanityLiveClient.fetch(irrigationProductQuery, { slug: recommendedSlug }).catch((error) => {
                      console.error('Sanity: не удалось загрузить рекомендованный товар для полива:', error)
                      return null
                    })
                  : Promise.resolve(null),
              ])
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
      }).catch((error) => {
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

  return enrichedDetails
}
