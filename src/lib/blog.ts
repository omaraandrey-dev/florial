import { sanityClient } from './sanity'

export type BlogLanguage = 'bg' | 'ru' | 'en'
export type BlogTextBlock = {
  _key?: string
  _type?: string
  style?: string
  listItem?: 'bullet' | 'number'
  children?: Array<{_key?: string; text?: string; marks?: string[]}>
  markDefs?: Array<{_key?: string; _type?: string; href?: string; blank?: boolean}>
  assetUrl?: string
  alt?: string
  altRu?: string
  altEn?: string
  caption?: string
  url?: string
  title?: string
}
export type BlogTranslation = {
  title?: string
  shortDescription?: string
  body?: BlogTextBlock[]
  seoTitle?: string
  seoDescription?: string
  coverAlt?: string
}
export type BlogPost = {
  _id: string
  slug?: {current?: string} | string
  publishedAt?: string
  cover?: {asset?: {url?: string}; alt?: string; caption?: string}
  gallery?: Array<{asset?: {url?: string}; alt?: string; altRu?: string; altEn?: string; caption?: string}>
  tags?: string[]
  translations?: Partial<Record<BlogLanguage, BlogTranslation>>
}
export type BlogPostCard = Pick<BlogPost, '_id' | 'slug' | 'publishedAt' | 'cover' | 'translations' | 'tags'>

function blogCardProjection(language: BlogLanguage) {
  return `{
    _id, slug, publishedAt, tags,
    "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption},
    "translations": {
      "${language}": {
        "title": coalesce(translations.${language}.title, translations.bg.title),
        "shortDescription": coalesce(translations.${language}.shortDescription, translations.bg.shortDescription),
        "coverAlt": coalesce(translations.${language}.coverAlt, translations.bg.coverAlt)
      }
    }
  }`
}

function blogDetailProjection(language: BlogLanguage) {
  return `{
    _id, slug, publishedAt, tags,
    "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption},
    "gallery": gallery[]{"asset": asset->{"url": url}, alt, altRu, altEn, caption},
    "translations": {
      "${language}": {
        "title": coalesce(translations.${language}.title, translations.bg.title),
        "shortDescription": coalesce(translations.${language}.shortDescription, translations.bg.shortDescription),
        "body": coalesce(translations.${language}.body, translations.bg.body)[]{..., "assetUrl": asset->url, alt, altRu, altEn},
        "seoTitle": coalesce(translations.${language}.seoTitle, translations.bg.seoTitle),
        "seoDescription": coalesce(translations.${language}.seoDescription, translations.bg.seoDescription),
        "coverAlt": coalesce(translations.${language}.coverAlt, translations.bg.coverAlt)
      }
    }
  }`
}

// Share in-flight list requests between Header, BlogSection and blog routes.
// The short TTL prevents repeated fetches during navigation without keeping stale
// published content indefinitely; rejected requests are evicted immediately.
const BLOG_LIST_CACHE_TTL_MS = 60_000
const blogListCache = new Map<string, {expiresAt: number; promise: Promise<BlogPostCard[]>; token: object}>()

export function fetchBlogPosts(limit?: number, language: BlogLanguage = 'bg'): Promise<BlogPostCard[]> {
  const normalizedLimit = typeof limit === 'number' ? Math.max(1, Math.floor(limit)) : undefined
  const cacheKey = `${language}:${normalizedLimit === undefined ? 'all' : `limit:${normalizedLimit}`}`
  const cached = blogListCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.promise

  const slice = normalizedLimit === undefined ? '' : `[0...${normalizedLimit}]`
  const cacheToken = {}
  const promise = sanityClient.fetch<BlogPostCard[]>(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt)] | order(publishedAt desc)${slice}${blogCardProjection(language)}`
  ).catch((error) => {
    if (blogListCache.get(cacheKey)?.token === cacheToken) blogListCache.delete(cacheKey)
    throw error
  })

  blogListCache.set(cacheKey, {expiresAt: Date.now() + BLOG_LIST_CACHE_TTL_MS, promise, token: cacheToken})
  return promise
}

const BLOG_DETAIL_CACHE_TTL_MS = 60_000
const blogDetailCache = new Map<string, {expiresAt: number; promise: Promise<BlogPost | null>; token: object}>()

export function fetchBlogPost(slug: string, language: BlogLanguage = 'bg'): Promise<BlogPost | null> {
  const cacheKey = `${language}:${slug}`
  const cached = blogDetailCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.promise

  const cacheToken = {}
  const promise = sanityClient.fetch<BlogPost[]>(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt) && (slug.current == $slug || slug == $slug)][0...1]${blogDetailProjection(language)}`,
    {slug}
  ).then((posts) => posts?.[0] || null).catch((error) => {
    if (blogDetailCache.get(cacheKey)?.token === cacheToken) blogDetailCache.delete(cacheKey)
    throw error
  })

  blogDetailCache.set(cacheKey, {expiresAt: Date.now() + BLOG_DETAIL_CACHE_TTL_MS, promise, token: cacheToken})
  return promise
}

const BLOG_RELATED_CACHE_TTL_MS = 60_000
const blogRelatedCache = new Map<string, {expiresAt: number; promise: Promise<BlogPostCard[]>; token: object}>()

export function fetchRelatedBlogPosts(excludeId: string, tags: string[], language: BlogLanguage = 'bg'): Promise<BlogPostCard[]> {
  const normalizedTags = Array.from(new Set(tags)).sort()
  const cacheKey = `${language}:${excludeId}:${normalizedTags.join('|')}`
  const cached = blogRelatedCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.promise

  const cacheToken = {}
  const promise = sanityClient.fetch<BlogPostCard[]>(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt) && _id != $excludeId]{
      "sharedTagCount": count(tags[@ in $tags]),
      _id, slug, publishedAt, tags,
      "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption},
      "translations": {
        "${language}": {
          "title": coalesce(translations.${language}.title, translations.bg.title),
          "shortDescription": coalesce(translations.${language}.shortDescription, translations.bg.shortDescription),
          "coverAlt": coalesce(translations.${language}.coverAlt, translations.bg.coverAlt)
        }
      }
    } | order(sharedTagCount desc, publishedAt desc)[0...3]{
      _id, slug, publishedAt, tags, cover, translations
    }`,
    {excludeId, tags: normalizedTags}
  ).catch((error) => {
    if (blogRelatedCache.get(cacheKey)?.token === cacheToken) blogRelatedCache.delete(cacheKey)
    throw error
  })

  blogRelatedCache.set(cacheKey, {expiresAt: Date.now() + BLOG_RELATED_CACHE_TTL_MS, promise, token: cacheToken})
  return promise
}
export function blogSlug(post: BlogPostCard | BlogPost): string {
  return typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id
}
export function blogImageAlt(image: {alt?: string; altRu?: string; altEn?: string}, language: BlogLanguage, fallback = ''): string {
  const localized = language === 'ru' ? image.altRu : language === 'en' ? image.altEn : image.alt
  return localized || image.alt || image.altRu || image.altEn || fallback
}

export function blogTranslation(post: BlogPostCard | BlogPost, language: BlogLanguage): BlogTranslation {
  const selected = post.translations?.[language]
  const bg = post.translations?.bg || {}
  return {
    ...bg,
    ...selected,
    title: selected?.title || bg.title || '',
    shortDescription: selected?.shortDescription || bg.shortDescription || '',
    body: selected?.body?.length ? selected.body : bg.body || [],
    seoTitle: selected?.seoTitle || bg.seoTitle,
    seoDescription: selected?.seoDescription || bg.seoDescription || selected?.shortDescription || bg.shortDescription,
    coverAlt: selected?.coverAlt || bg.coverAlt || post.cover?.alt || selected?.title || bg.title || '',
  }
}
export function formatBlogDate(value: string | undefined, language: BlogLanguage): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date)
}
