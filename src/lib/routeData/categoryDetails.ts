import { publicPlantsClient, sanityClient } from '../sanity'
import type { CategoryItem } from '../../types'

export async function fetchCategoryDetails(category: CategoryItem, isCancelled: () => boolean = () => false): Promise<CategoryItem | null> {
  if (isCancelled()) return null
  const equipmentCategoryDetailQuery = `
        *[_type == "category" && _id == $id][0] {
          _id, name, translations,
          "slug": { "current": coalesce(slug.current, slug) },
          sortOrder, "parentId": parent->_id,
          "imageUrl": image.asset->url,
          "imageAlt": image.alt,
          "imageAltEn": image.altEn,
          "imageAltRu": image.altRu,
          "imageTitle": image.title,
          "imageTitleEn": image.titleEn,
          "imageTitleRu": image.titleRu,
          description, seo, seoContent, helpBlock,
          "isPlantCategory": false
        }
      `
  
      const plantCategoryDetailQuery = `
        *[_type == "category" && _id == $id][0] {
          _id, name, translations, seo, seoContent,
          "slug": { "current": coalesce(slug.current, slug) },
          sortOrder, description,
          "parentId": parent->_id,
          "imageUrl": coalesce(image.asset->url, externalImageUrl),
          "imageAlt": image.alt,
          "imageAltEn": image.altEn,
          "imageAltRu": image.altRu,
          "imageTitle": image.title,
          "imageTitleEn": image.titleEn,
          "imageTitleRu": image.titleRu,
          helpBlock,
          "isPlantCategory": true
        }
      `
  const client = category.isPlantCategory ? publicPlantsClient : sanityClient
  const query = category.isPlantCategory ? plantCategoryDetailQuery : equipmentCategoryDetailQuery
  const details = await client.fetch(query, { id: category._id })
  return isCancelled() ? null : details
}
