type SeoFields = {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  noIndex?: boolean
}

type AlternateLanguageUrls = Partial<Record<'bg' | 'ru' | 'en' | 'x-default', string>>

const SITE_URL = 'https://florial-bg.com'

function setMeta(name: string, content: string, attribute = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonicalUrl() {
  let path = window.location.pathname
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  const canonical = new URL(path, SITE_URL)
  const selectedLocale = new URLSearchParams(window.location.search).get('lang')
  if (selectedLocale === 'ru' || selectedLocale === 'en') {
    canonical.searchParams.set('lang', selectedLocale)
  }

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = canonical.toString()
  return canonical.toString()
}

function setAlternateLanguages(alternates?: AlternateLanguageUrls) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove())
  if (!alternates) return

  Object.entries(alternates).forEach(([language, href]) => {
    if (!href) return
    const link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = language
    link.href = href
    document.head.appendChild(link)
  })
}

export function applyPageSeo(options: {
  seo?: SeoFields | null
  fallbackTitle: string
  fallbackDescription: string
  pageType?: 'website' | 'product' | 'article'
  alternates?: AlternateLanguageUrls
}) {
  const { seo, fallbackTitle, fallbackDescription, pageType = 'website', alternates } = options
  const title = seo?.metaTitle?.trim() || fallbackTitle
  const description = seo?.metaDescription?.trim() || fallbackDescription
  const canonicalUrl = setCanonicalUrl()

  document.title = title
  setMeta('description', description)
  setMeta('robots', seo?.noIndex ? 'noindex, nofollow' : 'index, follow')
  if (seo?.keywords?.length) setMeta('keywords', seo.keywords.join(', '))
  else document.head.querySelector('meta[name="keywords"]')?.remove()

  setMeta('og:title', title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('og:type', pageType, 'property')
  setMeta('og:url', canonicalUrl, 'property')
  setMeta('twitter:card', 'summary_large_image')
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
  setAlternateLanguages(alternates)
}
