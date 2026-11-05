/**
 * Product SEO rules shared by the Manager generator and tests.
 * The generator writes only active H1 / Meta Title / Meta Description fields.
 */
export const PRODUCT_SEO_MAX_TITLE_LENGTH = 70

const LOCATIONS = [
  { key: 'nessebar', aliases: ['Несебър', 'Несебр', 'Несебыр', 'Nessebar', 'Nesebar'], names: { bg: 'Несебър', ru: 'Несебр', en: 'Nessebar' } },
  { key: 'ravda', aliases: ['Равда', 'Ravda'], names: { bg: 'Равда', ru: 'Равда', en: 'Ravda' } },
  { key: 'sunny-beach', aliases: ['Слънчев бряг', 'Солнечный берег', 'Sunny Beach'], names: { bg: 'Слънчев бряг', ru: 'Солнечный берег', en: 'Sunny Beach' } },
  { key: 'sveti-vlas', aliases: ['Свети Влас', 'Святой Влас', 'Sveti Vlas'], names: { bg: 'Свети Влас', ru: 'Святой Влас', en: 'Sveti Vlas' } },
  { key: 'pomorie', aliases: ['Поморие', 'Pomorie'], names: { bg: 'Поморие', ru: 'Поморие', en: 'Pomorie' } },
  { key: 'burgas', aliases: ['Бургас', 'Burgas'], names: { bg: 'Бургас', ru: 'Бургас', en: 'Burgas' } },
  { key: 'aheloy', aliases: ['Ахелой', 'Aheloy', 'Aheloi'], names: { bg: 'Ахелой', ru: 'Ахелой', en: 'Aheloy' } },
  { key: 'kableshkovo', aliases: ['Каблешково', 'Kableshkovo'], names: { bg: 'Каблешково', ru: 'Каблешково', en: 'Kableshkovo' } },
  { key: 'kosharitsa', aliases: ['Кошарица', 'Kosharitsa'], names: { bg: 'Кошарица', ru: 'Кошарица', en: 'Kosharitsa' } },
]

const BRAND_LABELS = {
  bg: { full: 'Градински център Флориал', short: 'Флориал' },
  ru: { full: 'Садовый центр Флориал', short: 'Флориал' },
  en: { full: 'Florial Garden Centre', short: 'Florial' },
}
const EXCLUDED_LOCATION_PATTERN = /созопол|созополь|sozopol/i

const asText = (value) => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    if (typeof value.text === 'string') return value.text
    if (Array.isArray(value.children)) return value.children.map(asText).filter(Boolean).join('')
    return Object.values(value).map(asText).filter(Boolean).join(' ')
  }
  return ''
}

const collectSeoText = (product) => {
  const values = [
    product?.shortDescription,
    product?.description,
    product?.seo?.metaTitle,
    product?.seo?.metaDescription,
    product?.seo?.title,
    product?.seo?.description,
  ]
  for (const locale of ['ru', 'en']) {
    const translation = product?.translations?.[locale]
    const seo = translation?.seo
    values.push(
      translation?.shortDescription,
      translation?.description,
      seo?.metaTitle,
      seo?.metaDescription,
      seo?.title,
      seo?.description,
    )
  }
  return values.map(asText).filter(Boolean).join(' ')
}

/** Resolve an existing permitted location first; otherwise distribute products deterministically. */
export function resolveProductLocation(product, stableIndex = 0) {
  const existingText = collectSeoText(product).toLocaleLowerCase()
  if (!EXCLUDED_LOCATION_PATTERN.test(existingText)) {
    const match = LOCATIONS.find((location) => location.aliases.some((alias) => existingText.includes(alias.toLocaleLowerCase())))
    if (match) return match
  }
  const index = Number.isInteger(stableIndex) && stableIndex >= 0 ? stableIndex : 0
  return LOCATIONS[index % LOCATIONS.length]
}

const shortenAtWordBoundary = (value, maxLength) => {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  if (maxLength < 2) return ''
  let result = ''
  for (const word of text.split(/\s+/)) {
    const candidate = result ? result + ' ' + word : word
    if (candidate.length + 1 > maxLength) break
    result = candidate
  }
  return result ? result.replace(/[\s,;:—–-]+$/, '') + '…' : ''
}

const buildMetaTitle = (name, locationName, locale) => {
  const brand = BRAND_LABELS[locale]
  const full = name + ' | ' + locationName + ' | ' + brand.full
  if (full.length <= PRODUCT_SEO_MAX_TITLE_LENGTH) return full

  const short = name + ' | ' + locationName + ' | ' + brand.short
  if (short.length <= PRODUCT_SEO_MAX_TITLE_LENGTH) return short

  const suffix = ' | ' + locationName + ' | ' + brand.short
  const shortenedName = shortenAtWordBoundary(name, PRODUCT_SEO_MAX_TITLE_LENGTH - suffix.length)
  if (shortenedName) return shortenedName + suffix

  const locationSuffix = ' | ' + locationName
  const minimalName = shortenAtWordBoundary(name, PRODUCT_SEO_MAX_TITLE_LENGTH - locationSuffix.length)
  if (minimalName) return minimalName + locationSuffix
  return locationName + ' | ' + brand.short
}

const cleanFeature = (value, productName) => {
  let text = asText(value).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const sentences = text.split(/(?<=[.!?])\s+/).filter((sentence) =>
    !EXCLUDED_LOCATION_PATTERN.test(sentence) &&
    !LOCATIONS.some((location) => location.aliases.some((alias) => sentence.toLocaleLowerCase().includes(alias.toLocaleLowerCase()))),
  )
  text = sentences.join(' ').trim()
  const normalizedName = String(productName || '').trim().toLocaleLowerCase()
  if (normalizedName && text.toLocaleLowerCase().startsWith(normalizedName)) {
    text = text.slice(String(productName).length).replace(/^[\s:—–,-]+/, '')
  }
  return text.replace(/\s+/g, ' ').trim()
}

const buildMetaDescription = (name, feature, locationName, locale) => {
  const brand = BRAND_LABELS[locale].full
  const templates = {
    bg: { prefix: 'Продажба на ', join: ' — ', suffix: '. ' + brand + ' предлага продукта за клиенти в ' + locationName + ' и района.' },
    ru: { prefix: 'Продажа: ', join: ' — ', suffix: '. ' + brand + ' предлагает товар покупателям в ' + locationName + ' и окрестностях.' },
    en: { prefix: 'For sale: ', join: ' — ', suffix: '. ' + brand + ' serves customers in ' + locationName + ' and nearby areas.' },
  }
  const template = templates[locale]
  const featureBudget = Math.max(0, 180 - template.prefix.length - name.length - template.suffix.length - template.join.length)
  const conciseFeature = feature ? shortenAtWordBoundary(feature, featureBudget) : ''
  return template.prefix + name + (conciseFeature ? template.join + conciseFeature : '') + template.suffix
}

/**
 * @param {Record<string, any>} product Published Sanity product document.
 * @param {'bg'|'ru'|'en'} locale
 * @param {number} stableIndex Stable index in the dataset's _id-sorted list.
 * @returns {{h1:string, metaTitle:string, metaDescription:string, location:string}|null}
 */
export function generateProductSeo(product, locale, stableIndex = 0) {
  const translation = locale === 'bg' ? null : product?.translations?.[locale]
  const name = String(locale === 'bg' ? product?.name || '' : translation?.name || '').trim()
  if (!name) return null

  const location = resolveProductLocation(product, stableIndex)
  const locationName = location.names[locale]
  const featureSource = locale === 'bg' ? product?.shortDescription || product?.description : translation?.shortDescription || translation?.description
  const feature = cleanFeature(featureSource, name)

  return {
    h1: name,
    metaTitle: buildMetaTitle(name, locationName, locale),
    metaDescription: buildMetaDescription(name, feature, locationName, locale),
    location: locationName,
  }
}

export const PRODUCT_SEO_LOCATIONS = LOCATIONS.map((location) => location.key)
