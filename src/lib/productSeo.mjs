/**
 * Product SEO rules shared by the Manager generator and tests.
 * The generator writes only active H1 / Meta Title / Meta Description fields.
 */
export const PRODUCT_SEO_MAX_TITLE_LENGTH = 70
export const PRODUCT_SEO_MAX_DESCRIPTION_LENGTH = 160

const LOCATIONS = [
  { key: 'nessebar', aliases: ['Несебър', 'Несебр', 'Несебыр', 'Несебре', 'Несебыре', 'Nessebar', 'Nesebar'], names: { bg: 'Несебър', ru: 'Несебр', en: 'Nessebar' } },
  { key: 'ravda', aliases: ['Равда', 'Ravda'], names: { bg: 'Равда', ru: 'Равда', en: 'Ravda' } },
  { key: 'sunny-beach', aliases: ['Слънчев бряг', 'Солнечный берег', 'Солнечном берегу', 'Sunny Beach'], names: { bg: 'Слънчев бряг', ru: 'Солнечный берег', en: 'Sunny Beach' } },
  { key: 'sveti-vlas', aliases: ['Свети Влас', 'Святой Влас', 'Святом Власе', 'Sveti Vlas'], names: { bg: 'Свети Влас', ru: 'Святой Влас', en: 'Sveti Vlas' } },
  { key: 'pomorie', aliases: ['Поморие', 'Pomorie'], names: { bg: 'Поморие', ru: 'Поморие', en: 'Pomorie' } },
  { key: 'burgas', aliases: ['Бургас', 'Бургаса', 'Бургасе', 'Burgas'], names: { bg: 'Бургас', ru: 'Бургас', en: 'Burgas' } },
  { key: 'aheloy', aliases: ['Ахелой', 'Ахелоя', 'Ахелое', 'Aheloy', 'Aheloi'], names: { bg: 'Ахелой', ru: 'Ахелой', en: 'Aheloy' } },
  { key: 'kableshkovo', aliases: ['Каблешково', 'Kableshkovo'], names: { bg: 'Каблешково', ru: 'Каблешково', en: 'Kableshkovo' } },
  { key: 'kosharitsa', aliases: ['Кошарица', 'Кошарице', 'Kosharitsa'], names: { bg: 'Кошарица', ru: 'Кошарица', en: 'Kosharitsa' } },
]

const BRAND_LABELS = {
  bg: { full: 'Градински център Флориал', short: 'Флориал' },
  ru: { full: 'Садовый центр Флориал', short: 'Флориал' },
  en: { full: 'Florial Garden Centre', short: 'Florial' },
}
const EXCLUDED_LOCATION_PATTERN = /созопол|созополь|sozopol/i
const CYRILLIC_PATTERN = /[А-Яа-яЁё]/
const BULGARIAN_ONLY_PATTERN = /(?:вътрешна|външна|капков|маркуч|колче|дълга дръжка|полиетилен|редукционен)/i
const PRICE_ONLY_PATTERN = /(?:VAT included|price includes VAT|цена\s+с\s+ддс|цена\s+с\s+д\.д\.с\.)/i

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
  const existingText = collectSeoText(product)
    .toLocaleLowerCase()
    .replace(/созопол|созополь|sozopol/gi, ' ')
  const matches = LOCATIONS.flatMap((location) =>
    location.aliases.map((alias) => ({
      location,
      index: existingText.indexOf(alias.toLocaleLowerCase()),
    })).filter((match) => match.index >= 0),
  ).sort((left, right) => left.index - right.index)
  if (matches[0]) return matches[0].location

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

const stripAllowedLocationMentions = (value) => {
  let text = value
  const aliases = LOCATIONS.flatMap((location) => location.aliases).sort((left, right) => right.length - left.length)
  for (const alias of aliases) {
    const pattern = new RegExp('(?:\\b(?:in|near|for)\\s+|(?:в|на|около|за)\\s+)?' + alias + '(?:\\s+(?:and|и)\\s+(?:surrounding areas|окрестностях|района|районе))?', 'gi')
    text = text.replace(pattern, ' ')
  }
  return text
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/[ ,;:—–-]+([.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

const cleanFeature = (value, productName, locale) => {
  let text = asText(value).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  text = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !EXCLUDED_LOCATION_PATTERN.test(sentence) && !PRICE_ONLY_PATTERN.test(sentence))
    .join(' ')
  if (locale === 'en' && CYRILLIC_PATTERN.test(text)) return ''
  if (locale === 'ru' && BULGARIAN_ONLY_PATTERN.test(text)) return ''
  text = stripAllowedLocationMentions(text)

  const normalizedName = String(productName || '').trim().toLocaleLowerCase()
  if (normalizedName && text.toLocaleLowerCase().startsWith(normalizedName)) {
    text = text.slice(String(productName).length).replace(/^[\s:—–,.-]+/, '')
  }
  return text
    .replace(/^[\s:—–,.-]+/, '')
    .replace(/[\s:—–,.-]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Build a complete sentence without clipping a product feature mid-word or leaving an empty dash. */
const buildMetaDescription = (name, feature, locationName, locale) => {
  const prefix = {
    bg: 'Продажба на ',
    ru: 'Продажа: ',
    en: 'For sale: ',
  }[locale]
  const fullSuffix = {
    bg: '. Градински център Флориал предлага продукта за клиенти в ' + locationName + '.',
    ru: '. Садовый центр Флориал предлага товар покупателям в ' + locationName + '.',
    en: '. Florial Garden Centre serves customers in ' + locationName + '.',
  }[locale]
  const compactSuffix = {
    bg: '. Флориал, ' + locationName + '.',
    ru: '. Флориал, ' + locationName + '.',
    en: '. Florial, ' + locationName + '.',
  }[locale]

  const candidates = []
  if (feature) {
    candidates.push(prefix + name + ' — ' + feature + fullSuffix)
    candidates.push(prefix + feature + compactSuffix)
  }
  candidates.push(prefix + name + fullSuffix)
  candidates.push(prefix + name + compactSuffix)
  candidates.push(prefix + name)

  const complete = candidates.find((candidate) => candidate.length <= PRODUCT_SEO_MAX_DESCRIPTION_LENGTH)
  if (complete) return complete

  const budget = PRODUCT_SEO_MAX_DESCRIPTION_LENGTH - prefix.length - compactSuffix.length
  const shortenedName = shortenAtWordBoundary(name, budget)
  if (shortenedName) return prefix + shortenedName + compactSuffix
  return shortenAtWordBoundary(prefix + name, PRODUCT_SEO_MAX_DESCRIPTION_LENGTH) || prefix.trim()
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

  // Do not generate localized metadata from a visibly contaminated source name.
  if (locale === 'en' && CYRILLIC_PATTERN.test(name)) return null
  if (locale === 'ru' && BULGARIAN_ONLY_PATTERN.test(name)) return null

  const location = resolveProductLocation(product, stableIndex)
  const locationName = location.names[locale]
  const featureSource = locale === 'bg'
    ? product?.shortDescription || product?.description
    : translation?.shortDescription || translation?.description
  const feature = cleanFeature(featureSource, name, locale)

  return {
    h1: name,
    metaTitle: buildMetaTitle(name, locationName, locale),
    metaDescription: buildMetaDescription(name, feature, locationName, locale),
    location: locationName,
  }
}

export const PRODUCT_SEO_LOCATIONS = LOCATIONS.map((location) => location.key)

/** Return true when an SEO field is absent, non-string, empty, or whitespace-only. */
export function isProductSeoFieldMissing(value) {
  return typeof value !== 'string' || value.trim().length === 0
}

/** Return SEO fields only when they are currently empty. */
export function getMissingProductSeoFields(existingSeo, generated) {
  const source = existingSeo && typeof existingSeo === 'object' ? existingSeo : {}
  const result = {}
  for (const field of ['h1', 'metaTitle', 'metaDescription']) {
    if (isProductSeoFieldMissing(source[field])) result[field] = generated[field]
  }
  return result
}
