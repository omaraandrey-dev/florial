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
  gallery?: Array<{asset?: {url?: string}; alt?: string; caption?: string}>
  tags?: string[]
  translations?: Partial<Record<BlogLanguage, BlogTranslation>>
}
export type BlogPostCard = Pick<BlogPost, '_id' | 'slug' | 'publishedAt' | 'cover' | 'translations'>

const blogCardProjection = `{
  _id, slug, publishedAt,
  "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption},
  "translations": {
    "bg": translations.bg { title, shortDescription, coverAlt },
    "ru": translations.ru { title, shortDescription, coverAlt },
    "en": translations.en { title, shortDescription, coverAlt }
  }
}`
const blogDetailTranslationProjection = `{
  title, shortDescription,
  body[]{..., "assetUrl": asset->url},
  seoTitle, seoDescription, coverAlt
}`
const blogDetailProjection = `{
  _id, slug, publishedAt, tags,
  "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption},
  "gallery": gallery[]{"asset": asset->{"url": url}, alt, caption},
  "translations": {
    "bg": translations.bg${blogDetailTranslationProjection},
    "ru": translations.ru${blogDetailTranslationProjection},
    "en": translations.en${blogDetailTranslationProjection}
  }
}`

// Share in-flight list requests between Header, BlogSection and blog routes.
// The short TTL prevents repeated fetches during navigation without keeping stale
// published content indefinitely; rejected requests are evicted immediately.
const BLOG_LIST_CACHE_TTL_MS = 60_000
const blogListCache = new Map<string, {expiresAt: number; promise: Promise<BlogPostCard[]>}>()

export function fetchBlogPosts(limit?: number): Promise<BlogPostCard[]> {
  const normalizedLimit = typeof limit === 'number' ? Math.max(1, Math.floor(limit)) : undefined
  const cacheKey = normalizedLimit === undefined ? 'all' : `limit:${normalizedLimit}`
  const cached = blogListCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.promise

  const slice = normalizedLimit === undefined ? '' : `[0...${normalizedLimit}]`
  const promise = sanityClient.fetch<BlogPostCard[]>(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt)] | order(publishedAt desc)${slice}${blogCardProjection}`
  ).catch((error) => {
    if (blogListCache.get(cacheKey)?.promise === promise) blogListCache.delete(cacheKey)
    throw error
  })

  blogListCache.set(cacheKey, {expiresAt: Date.now() + BLOG_LIST_CACHE_TTL_MS, promise})
  return promise
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await sanityClient.fetch<BlogPost[]>(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt) && (slug.current == $slug || slug == $slug)][0...1]${blogDetailProjection}`,
    {slug}
  )
  return posts?.[0] || null
}
export function blogSlug(post: BlogPostCard | BlogPost): string {
  return typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id
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
