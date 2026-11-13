import { sanityClient } from '../sanity'
import type { ServiceItem } from '../../types'

type ServiceLanguage = 'bg' | 'ru' | 'en'

const SERVICE_DETAIL_CACHE_TTL_MS = 60_000
const serviceDetailCache = new Map<string, {expiresAt: number; promise: Promise<ServiceItem | null>; token: object}>()

export async function fetchServiceDetails(
  slug: string,
  language: ServiceLanguage = 'bg',
  isCancelled: () => boolean = () => false,
): Promise<ServiceItem | null> {
  if (isCancelled()) return null

  const cacheKey = `${language}:${slug}`
  const cached = serviceDetailCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    const service = await cached.promise
    return isCancelled() ? null : service
  }

  const localeProjection = language === 'bg'
    ? '"translations": {}'
    : `"translations": {
        "${language}": {
          "name": translations.${language}.name,
          "shortDescription": translations.${language}.shortDescription,
          "description": translations.${language}.description,
          "hero": translations.${language}.hero{title, subtitle},
          "advantages": translations.${language}.advantages[]{_key, title, text},
          "steps": translations.${language}.steps[]{_key, title, text},
          "callToAction": translations.${language}.callToAction{title, text, buttonLabel},
          "leadForm": translations.${language}.leadForm{
            title, submitLabel, successMessage,
            "fields": fields[]{_key, name, type, label, placeholder, required}
          },
          "seo": translations.${language}.seo{metaTitle, metaDescription, noIndex, keywords}
        }
      }`
  const blockTranslations = language === 'bg'
    ? '"translations": {}'
    : `"translations": {
        "${language}": {
          "title": translations.${language}.title,
          "text": translations.${language}.text,
          "imageAlt": translations.${language}.imageAlt
        }
      }`
  const relatedTranslations = language === 'bg'
    ? '"translations": {}'
    : `"translations": {
        "${language}": {
          "name": translations.${language}.name,
          "title": translations.${language}.title,
          "shortDescription": translations.${language}.shortDescription
        }
      }`

  const serviceDetailQuery = `
    *[
      _type == "service" &&
      isActive != false &&
      (coalesce(slug.current, slug) == $slug || _id == $slug)
    ][0] {
      _id,
      name,
      ${localeProjection},
      "slug": { "current": coalesce(slug.current, slug) },
      shortDescription,
      description,
      "imageUrl": coalesce(image.asset->url, mainImage.asset->url, hero.image.asset->url),
      "imageAlt": coalesce(image.alt, mainImage.alt, hero.image.alt),
      "imageAltEn": coalesce(image.altEn, mainImage.altEn, hero.image.altEn),
      "imageAltRu": coalesce(image.altRu, mainImage.altRu, hero.image.altRu),
      "imageLinkUrl": coalesce(image.linkUrl, mainImage.linkUrl),
      sortOrder,
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
        ${blockTranslations}
      },
      "relatedContent": relatedContent[]->{
        _id, _type, name, title,
        ${relatedTranslations},
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

  const cacheToken = {}
  const promise = sanityClient.fetch<ServiceItem | null>(serviceDetailQuery, {slug}).catch((error) => {
    if (serviceDetailCache.get(cacheKey)?.token === cacheToken) serviceDetailCache.delete(cacheKey)
    throw error
  })
  serviceDetailCache.set(cacheKey, {expiresAt: Date.now() + SERVICE_DETAIL_CACHE_TTL_MS, promise, token: cacheToken})

  const service = await promise
  return isCancelled() ? null : service
}
