const BLOG_TO_SERVICE_REDIRECTS = Object.freeze({
  'montazh-podmyana-remont-razpruskvachi-nesebar': 'montazh-podmyana-remont-razpruskvachi-nesebar',
  'montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane': 'montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane',
  'montazh-remont-elektromagnitni-klapani': 'montazh-remont-elektromagnitni-klapani',
  'remont-modernizatsiya-polivni-sistemi': 'remont-modernizatsiya-polivni-sistemi',
  'godishna-poddruzhka-avtomatichni-sistemi': 'godishna-poddruzhka-avtomatichni-sistemi',
  'landshaften-dizain-proekt-zasazhdenie': 'landshaften-dizain-proekt-zasazhdenie',
  'izgrazhdane-tsvetni-lehi': 'izgrazhdane-tsvetni-lehi',
  'topiarna-rezitba-rasteniya': 'topiarna-rezitba-rasteniya',
  'podmyana-stara-travna-plosht': 'podmyana-stara-travna-plosht',
})

export function getBlogServiceRedirectPath(pathname) {
  if (typeof pathname !== 'string') return null

  const normalizedPath = pathname.replace(/\\/+$/, '') || '/'
  const prefix = '/blog/'
  if (!normalizedPath.startsWith(prefix)) return null

  const encodedSlug = normalizedPath.slice(prefix.length)
  if (!encodedSlug || encodedSlug.includes('/')) return null

  let slug
  try {
    slug = decodeURIComponent(encodedSlug)
  } catch {
    return null
  }

  const serviceSlug = BLOG_TO_SERVICE_REDIRECTS[slug]
  return serviceSlug ? `/services/${serviceSlug}` : null
}
