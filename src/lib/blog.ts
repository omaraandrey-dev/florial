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
const translationProjection = `{
  title, shortDescription,
  body[]{..., "assetUrl": asset->url},
  seoTitle, seoDescription, coverAlt
}`
const postProjection = `{
  _id, slug, publishedAt, tags,
  "cover": {"asset": cover.asset->{"url": url}, "alt": cover.alt, "caption": cover.caption},
  "gallery": gallery[]{"asset": asset->{"url": url}, alt, caption},
  "translations": {
    "bg": translations.bg${translationProjection},
    "ru": translations.ru${translationProjection},
    "en": translations.en${translationProjection}
  }
}`
export async function fetchBlogPosts(limit?: number): Promise<BlogPost[]> {
  const slice = typeof limit === 'number' ? `[0...${Math.max(1, Math.floor(limit))}]` : ''
  return sanityClient.fetch(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt)] | order(publishedAt desc)${slice}${postProjection}`
  )
}
export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await sanityClient.fetch<BlogPost[]>(
    `*[_type == "blogPost" && isPublished == true && defined(publishedAt) && (slug.current == $slug || slug == $slug)][0...1]${postProjection}`,
    {slug}
  )
  return posts?.[0] || null
}
export function blogSlug(post: BlogPost): string {
  return typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id
}
export function blogTranslation(post: BlogPost, language: BlogLanguage): BlogTranslation {
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
