type SeoFields = {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  noIndex?: boolean
}

function setMeta(name: string, content: string, attribute = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.content = content
}

export function applyPageSeo(options: {
  seo?: SeoFields | null
  fallbackTitle: string
  fallbackDescription: string
  pageType?: 'website' | 'product' | 'article'
}) {
  const { seo, fallbackTitle, fallbackDescription, pageType = 'website' } = options
  const title = seo?.metaTitle?.trim() || fallbackTitle
  const description = seo?.metaDescription?.trim() || fallbackDescription

  document.title = title
  setMeta('description', description)
  setMeta('robots', seo?.noIndex ? 'noindex, nofollow' : 'index, follow')
  if (seo?.keywords?.length) setMeta('keywords', seo.keywords.join(', '))
  else document.head.querySelector('meta[name="keywords"]')?.remove()

  setMeta('og:title', title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('og:type', pageType, 'property')
  setMeta('og:url', window.location.origin + window.location.pathname, 'property')
  setMeta('twitter:card', 'summary_large_image')
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
}
