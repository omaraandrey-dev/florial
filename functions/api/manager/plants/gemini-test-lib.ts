export type GeminiPlantCategory = { id: string; name: string }

const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export const extractGeminiText = (payload: unknown): string => {
  if (!isObject(payload) || !Array.isArray(payload.candidates)) throw new Error('GEMINI_EMPTY_RESPONSE')
  const candidate = payload.candidates[0]
  if (!isObject(candidate) || !isObject(candidate.content) || !Array.isArray(candidate.content.parts)) {
    throw new Error('GEMINI_EMPTY_RESPONSE')
  }
  return candidate.content.parts
    .filter((part: unknown) => isObject(part) && typeof part.text === 'string')
    .map((part: any) => part.text)
    .join('\n')
    .trim()
}

export const normalizeGeminiPlantResult = (
  value: unknown,
  categories: GeminiPlantCategory[],
  productTypes: string[],
) => {
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { throw new Error('GEMINI_INVALID_JSON') }
  }
  if (!isObject(parsed)) throw new Error('GEMINI_INVALID_JSON')

  const localized = (source: unknown) => {
    const item = isObject(source) ? source : {}
    return {
      shortDescription: text(item.shortDescription, 500),
      description: text(item.description, 8000),
    }
  }
  const seo = (source: unknown) => {
    const item = isObject(source) ? source : {}
    return {
      h1: text(item.h1, 160),
      metaTitle: text(item.metaTitle, 70),
      metaDescription: text(item.metaDescription, 320),
    }
  }
  const descriptions = isObject(parsed.descriptions) ? parsed.descriptions : {}
  const seoSource = isObject(parsed.seo) ? parsed.seo : {}
  const altSource = isObject(parsed.imageAlt) ? parsed.imageAlt : {}
  const care = isObject(parsed.plantCare) ? parsed.plantCare : {}
  const confidence = ['high', 'medium', 'low'].includes(String(parsed.confidence)) ? String(parsed.confidence) : 'low'
  const productType = productTypes.includes(String(parsed.productType)) ? String(parsed.productType) : 'plant'
  const categoryId = text(parsed.categoryId, 128)
  const allowedCategoryId = categories.some((category) => category.id === categoryId) ? categoryId : ''
  const scientificCandidates = Array.isArray(parsed.scientificCandidates)
    ? parsed.scientificCandidates.slice(0, 3).map((candidate: unknown) => {
        const item = isObject(candidate) ? candidate : {}
        const scientificName = text(item.scientificName, 160)
        return {
          scientificName: /^[A-Z][A-Za-z-]+ [a-z][A-Za-z-]+$/.test(scientificName) ? scientificName : '',
          confidence: ['high', 'medium', 'low'].includes(String(item.confidence)) ? String(item.confidence) : 'low',
          reason: text(item.reason, 240),
        }
      }).filter((candidate: { scientificName: string }) => candidate.scientificName)
    : []

  return {
    plantName: text(parsed.plantName, 160),
    confidence,
    scientificCandidates,
    productType,
    categoryId: allowedCategoryId,
    visibleDescription: text(parsed.visibleDescription, 240),
    descriptions: {
      bg: localized(descriptions.bg),
      ru: localized(descriptions.ru),
      en: localized(descriptions.en),
    },
    seo: {
      bg: seo(seoSource.bg),
      ru: seo(seoSource.ru),
      en: seo(seoSource.en),
    },
    imageAlt: {
      bg: text(altSource.bg, 180),
      ru: text(altSource.ru, 180),
      en: text(altSource.en, 180),
    },
    plantCare: {
      light: text(care.light, 32),
      waterNeeds: text(care.waterNeeds, 32),
      minWinterTempC: text(care.minWinterTempC, 32),
      adultHeightCm: text(care.adultHeightCm, 32),
      foliageType: text(care.foliageType, 32),
      floweringSeason: Array.isArray(care.floweringSeason) ? care.floweringSeason.slice(0, 5).map((item: unknown) => text(item, 24)) : [],
      plantingSeason: Array.isArray(care.plantingSeason) ? care.plantingSeason.slice(0, 5).map((item: unknown) => text(item, 24)) : [],
      blackSeaCoast: 'needsVerification',
    },
    careGuide: text(parsed.careGuide, 5000),
  }
}
