import { sanityLiveClient, plantsClient } from '../sanity'
import type { Product } from '../../types'

export async function fetchSearchProducts(isCancelled: () => boolean = () => false): Promise<Product[]> {
  if (isCancelled()) return []
  const equipmentSearchQuery = `
        *[_type == "product" && isActive != false && defined(slug)] {
          _id, name,
          translations {
            bg { name, shortDescription, description },
            ru { name, shortDescription, description },
            en { name, shortDescription, description }
          },
          "productType": "equipment",
          "slug": { "current": coalesce(slug.current, slug) },
          sku, "brand": brand->name, priceEUR, oldPriceEUR, stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          "imageAlt": coalesce(mainImage.alt, translations.bg.name, name),
          "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
          "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
          shortDescription, description, specifications,
          "category": category->name,
          "categoryTranslations": category->translations { bg { name }, ru { name }, en { name } },
          "categoryId": category->_id,
          "categorySlug": coalesce(category->slug.current, category->slug),
          "categories": categories[]->{_id, name, translations { bg { name }, ru { name }, en { name } }, "slug": {"current": coalesce(slug.current, slug)}}
        }
      `
  
      const plantSearchQuery = `
        *[_type == "product" && productType in ["plant", "tree", "shrub", "flower", "perennial", "indoor", "citrus", "palm", "conifer", "fruit", "succulent", "climber", "ornamentalGrass", "groundcover", "bulb", "herb", "aquatic", "other"] && isActive != false] {
          _id, name,
          translations {
            bg { name, shortDescription, description },
            ru { name, shortDescription, description },
            en { name, shortDescription, description }
          },
          productType,
          "slug": { "current": coalesce(slug.current, slug) },
          sku, priceEUR, oldPriceEUR, stockStatus,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url, category->image.asset->url, category->externalImageUrl, category->parent->image.asset->url, category->parent->externalImageUrl),
          "imageAlt": coalesce(mainImage.alt, name, translations.bg.name),
          "imageAltEn": coalesce(mainImage.altEn, translations.en.name, name),
          "imageAltRu": coalesce(mainImage.altRu, translations.ru.name, name),
          shortDescription, description, scientificName,
          "category": category->name,
          "categoryTranslations": category->translations { bg { name }, ru { name }, en { name } },
          "categoryId": category->_id,
          "categorySlug": coalesce(category->slug.current, category->slug),
          "categories": categories[]->{_id, name, translations { bg { name }, ru { name }, en { name } }, "slug": {"current": coalesce(slug.current, slug)}}
        }
      `

  const [equipmentResult, plantResult] = await Promise.allSettled([
    sanityLiveClient.fetch(equipmentSearchQuery),
    plantsClient.fetch(plantSearchQuery),
  ])
  if (isCancelled()) return []

  const equipment = equipmentResult.status === 'fulfilled' && Array.isArray(equipmentResult.value)
    ? equipmentResult.value
    : []
  const plants = plantResult.status === 'fulfilled' && Array.isArray(plantResult.value)
    ? plantResult.value
    : []

  if (equipmentResult.status === 'rejected') {
    console.error('Sanity: не удалось загрузить поиск оборудования:', equipmentResult.reason)
  }
  if (plantResult.status === 'rejected') {
    console.error('Sanity: не удалось загрузить поиск растений:', plantResult.reason)
  }

  return [...equipment, ...plants]
}
