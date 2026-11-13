import { sanityClient } from '../sanity'
import type { ServiceItem } from '../../types'

export async function fetchServiceDetails(slug: string): Promise<ServiceItem | null> {
  const serviceDetailQuery = `
        *[
          _type == "service" &&
          isActive != false &&
          (coalesce(slug.current, slug) == $slug || _id == $slug)
        ][0] {
          _id,
          name,
          translations,
          "slug": { "current": coalesce(slug.current, slug) },
          shortDescription,
          description,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
          "imageAlt": coalesce(image.alt, mainImage.alt, hero.image.alt),
          "imageAltEn": coalesce(image.altEn, mainImage.altEn, hero.image.altEn),
          "imageAltRu": coalesce(image.altRu, mainImage.altRu, hero.image.altRu),
          "imageLinkUrl": coalesce(image.linkUrl, mainImage.linkUrl),
          "sortOrder": sortOrder,
          serviceCategory,
          serviceLayout,
          "hero": hero{
            title,
            subtitle,
            "imageUrl": image.asset->url,
            "imageAlt": image.alt,
            "imageAltEn": image.altEn,
            "imageAltRu": image.altRu,
            "imageLinkUrl": image.linkUrl
          },
          "galleryImages": gallery[]{_key, "url": asset->url, alt, altEn, altRu, linkUrl},
          "contentBlocks": contentBlocks[]{
            _key,
            title,
            text,
            imagePosition,
            "imageUrl": image.asset->url,
            "imageAlt": image.alt,
            "imageAltEn": image.altEn,
            "imageAltRu": image.altRu,
            "imageLinkUrl": image.linkUrl,
            translations
          },
          "relatedContent": relatedContent[]->{
            _id, _type, name, title, translations,
            "slug": { "current": coalesce(slug.current, slug) },
            shortDescription, isActive, isPublished,
            "imageUrl": coalesce(image.asset->url, mainImage.asset->url, cover.asset->url, hero.image.asset->url),
            "imageAlt": coalesce(image.alt, mainImage.alt, cover.alt, name, translations.bg.title, title),
            "imageAltEn": coalesce(image.altEn, mainImage.altEn, cover.altEn, translations.en.title, translations.en.name, title, name),
            "imageAltRu": coalesce(image.altRu, mainImage.altRu, cover.altRu, translations.ru.title, translations.ru.name, title, name)
          },
          startingPriceEUR,
          advantages,
          steps,
          callToAction,
          leadForm,
          seo
        }
      `
  return sanityClient.fetch(serviceDetailQuery, { slug })
}
