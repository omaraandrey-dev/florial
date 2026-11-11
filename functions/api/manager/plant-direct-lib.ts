import { json, newId, nowIso, type ManagerEnv, type ManagerIdentity } from './_lib.ts'
import { validatePlantVariantStock } from './plant-stock-lib.mjs'
import { normalizePlantOldPrice } from './plant-old-price-lib.mjs'

export const PLANTS_PROJECT = 'bxvcy0qs'
export const PLANTS_DATASET = 'plants'
export const PRODUCT_TYPES = new Set([
  'plant','tree','shrub','flower','perennial','indoor','citrus','palm','conifer','fruit','succulent',
  'climber','ornamentalGrass','groundcover','bulb','herb','aquatic','other',
])
export const STOCK_STATUSES = new Set(['inStock','onRequest','outOfStock'])
export type PlantVariant = {
  _type: 'plantSaleVariant'
  _key: string
  name: string
  nameEn?: string
  nameRu?: string
  sku?: string
  saleHeightCm?: number | null
  containerVolumeL?: number | null
  priceEUR: number
  oldPriceEUR?: number | null
  stockStatus: 'inStock' | 'onRequest' | 'outOfStock'
  stockQuantity?: number | null
}
export type PlantDocument = Record<string, any> & { _id: string; _rev: string; _type: 'product'; name: string; saleVariants: PlantVariant[] }

export const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
export const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''
export const parseJsonBody = async (request: Request): Promise<Record<string, any> | null> => {
  const length = Number(request.headers.get('Content-Length') || 0)
  if (length > 160_000) return null
  try {
    const value = await request.json()
    return isObject(value) ? value : null
  } catch { return null }
}
export const errorJson = (message: string, status = 400) => json({ error: message }, status)

export const sanityQuery = async <T>(env: ManagerEnv, query: string): Promise<T> => {
  const project = env.SANITY_PROJECT_ID || PLANTS_PROJECT
  const dataset = PLANTS_DATASET
  if (!env.SANITY_API_TOKEN) throw new Error('SANITY_NOT_CONFIGURED')
  const url = 'https://' + project + '.api.sanity.io/v2025-02-19/data/query/' + dataset + '?query=' + encodeURIComponent(query)
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + env.SANITY_API_TOKEN, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('SANITY_QUERY_FAILED_' + response.status)
  const result = await response.json() as { result?: T }
  return result.result as T
}

export const sanityMutate = async (env: ManagerEnv, mutations: unknown[]) => {
  const project = env.SANITY_PROJECT_ID || PLANTS_PROJECT
  if (!env.SANITY_API_TOKEN) throw new Error('SANITY_NOT_CONFIGURED')
  const response = await fetch('https://' + project + '.api.sanity.io/v2025-02-19/data/mutate/' + PLANTS_DATASET + '?returnIds=true', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.SANITY_API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  })
  if (!response.ok) throw new Error('SANITY_MUTATION_FAILED_' + response.status)
  return await response.json() as { transactionId?: string; results?: Array<{ id?: string; operation?: string }> }
}

export const requirePlantRole = (user: ManagerIdentity) =>
  ['owner','manager','seller'].includes(user.role)

const plantSessionToken = (request: Request) => {
  const cookie = request.headers.get('Cookie') || ''
  const entry = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('florial_manager_session='))
  return entry ? entry.slice('florial_manager_session='.length) : ''
}
const plantAiIdentity = (product: unknown) => {
  const value = isObject(product) ? product : {}
  const image = isObject(value.mainImage) ? value.mainImage : {}
  return { imageAssetId: cleanText(image.assetId || value.mainImageAssetId, 160) }
}
const plantAiSignature = async (sessionToken: string, payload: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(sessionToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')
}
export const issuePlantAiProof = async (request: Request, product: unknown) => {
  const token = plantSessionToken(request)
  if (!token || token.length < 40) throw new Error('MANAGER_SESSION_PROOF_UNAVAILABLE')
  const timestamp = Date.now()
  const identity = plantAiIdentity(product)
  let signature: string
  try {
    signature = await plantAiSignature(token, String(timestamp) + '.' + JSON.stringify(identity))
  } catch {
    throw new Error('MANAGER_SESSION_PROOF_SIGN_FAILED')
  }
  return String(timestamp) + '.' + signature
}
export const verifyPlantAiProof = async (request: Request, proof: unknown, product: unknown) => {
  const token = plantSessionToken(request)
  if (!token || token.length < 40 || typeof proof !== 'string') return false
  const [timestampText, suppliedSignature, extra] = proof.split('.')
  if (extra !== undefined || !/^\d{13}$/.test(timestampText || '') || !/^[a-f0-9]{64}$/.test(suppliedSignature || '')) return false
  const timestamp = Number(timestampText)
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 30_000 || Date.now() - timestamp > 2 * 60 * 60 * 1000) return false
  const identity = plantAiIdentity(product)
  const expected = await plantAiSignature(token, timestampText + '.' + JSON.stringify(identity))
  if (expected.length !== suppliedSignature.length) return false
  let difference = 0
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ suppliedSignature.charCodeAt(index)
  return difference === 0 && Boolean(identity.imageAssetId)
}

const numberValue = (value: unknown, label: string, min: number, integer = false): number | null => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed))) {
    throw new Error('Проверете стойността на полето „' + label + '“.')
  }
  return parsed
}

const stableKey = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(36).padStart(7, '0')
}

const portableText = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  const text = cleanText(value, 12_000)
  if (!text) return []
  return [{
    _type: 'block',
    _key: 'block-' + stableKey(text),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'span-' + stableKey(text), text, marks: [] }],
  }]
}

const imageObject = (value: unknown) => {
  if (!isObject(value) || !/^image-[A-Za-z0-9-]+$/.test(String(value.assetId || ''))) {
    throw new Error('Една от снимките няма валиден Sanity asset.')
  }
  const fields = {
    _type: 'image',
    _key: 'image-' + stableKey(String(value.assetId)),
    asset: { _type: 'reference', _ref: String(value.assetId) },
    alt: cleanText(value.alt, 240),
    altEn: cleanText(value.altEn, 240),
    altRu: cleanText(value.altRu, 240),
  }
  return fields
}

const normalizeVariants = (value: unknown): PlantVariant[] => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) {
    throw new Error('Добавете от 1 до 30 размера на растението.')
  }
  const keys = new Set<string>()
  return value.map((item, index) => {
    if (!isObject(item)) throw new Error('Невалиден вариант №' + (index + 1) + '.')
    const name = cleanText(item.name, 100)
    if (name.length < 2) throw new Error('Въведете размер или име за вариант №' + (index + 1) + '.')
    const _key = cleanText(item._key, 80) || crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(_key) || keys.has(_key)) throw new Error('Ключовете на вариантите трябва да са уникални.')
    keys.add(_key)
    const priceEUR = numberValue(item.priceEUR, 'Цена EUR', 0.01)
    if (priceEUR === null) throw new Error('Въведете цена за всеки размер.')
    const stockStatus = cleanText(item.stockStatus, 30)
    if (!STOCK_STATUSES.has(stockStatus)) throw new Error('Изберете валиден статус на наличност.')
    const stockQuantity = numberValue(item.stockQuantity, 'Количество', 0, true)
    const oldPriceEUR = normalizePlantOldPrice(numberValue(item.oldPriceEUR, 'Стара цена', 0), priceEUR)
    return {
      _type: 'plantSaleVariant',
      _key, name,
      ...(cleanText(item.nameEn, 100) ? { nameEn: cleanText(item.nameEn, 100) } : {}),
      ...(cleanText(item.nameRu, 100) ? { nameRu: cleanText(item.nameRu, 100) } : {}),
      ...(cleanText(item.sku, 100) ? { sku: cleanText(item.sku, 100) } : {}),
      saleHeightCm: numberValue(item.saleHeightCm, 'Височина', 0),
      containerVolumeL: numberValue(item.containerVolumeL, 'Обем на контейнера', 0.1),
      priceEUR,
      ...(oldPriceEUR !== null ? { oldPriceEUR } : {}),
      stockStatus: stockStatus as PlantVariant['stockStatus'],
      stockQuantity,
    }
  })
}

export const buildPlantSet = async (
  env: ManagerEnv,
  input: unknown,
  role: string,
  existing?: PlantDocument,
  isCreate = false,
): Promise<{ set: Record<string, unknown>; changedFields: string[] }> => {
  if (!isObject(input)) throw new Error('Липсват данни за растението.')
  const set: Record<string, unknown> = {}
  const fields = ['name','scientificName','sku','productType','shortDescription','isFeatured','isActive','sortOrder'] as const
  for (const field of fields) {
    if (!(field in input)) continue
    if (field === 'name') {
      const value = cleanText(input.name, 160)
      if (value.length < 2) throw new Error('Въведете име на растението.')
      set.name = value
    } else if (field === 'productType') {
      const value = cleanText(input.productType, 40)
      if (!PRODUCT_TYPES.has(value)) throw new Error('Изберете валиден тип растение.')
      set.productType = value
    } else if (field === 'scientificName') set.scientificName = cleanText(input.scientificName, 160)
    else if (field === 'sku') set.sku = cleanText(input.sku, 100)
    else if (field === 'shortDescription') set.shortDescription = cleanText(input.shortDescription, 1200)
    else if (field === 'isFeatured' || field === 'isActive') {
      if (typeof input[field] !== 'boolean') throw new Error('Невалидна стойност за ' + field + '.')
      set[field] = input[field]
    } else if (field === 'sortOrder') set.sortOrder = numberValue(input.sortOrder, 'Ред на показване', 0, true)
  }

  if ('slug' in input) {
    const slug = cleanText(input.slug, 96)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Въведете валиден URL адрес (slug).')
    set.slug = { _type: 'slug', current: slug }
  }
  if ('categoryId' in input || 'categoryIds' in input) {
    const rawIds = Array.isArray(input.categoryIds) ? input.categoryIds : [input.categoryId]
    const categoryIds = Array.from(new Set(rawIds.map((value: unknown) => cleanText(value, 128)).filter(Boolean)))
    if (!categoryIds.length || categoryIds.length > 10 || categoryIds.some((id: string) => !/^[A-Za-z0-9_-]{8,128}$/.test(id))) {
      throw new Error('Изберете поне една и максимум 10 категории.')
    }
    const primaryId = cleanText(input.categoryId, 128) || categoryIds[0]
    if (!categoryIds.includes(primaryId)) throw new Error('Основната категория трябва да е сред избраните категории.')
    const found = await sanityQuery<Array<{ _id: string }>>(env, '*[_type=="category" && _id in ' + JSON.stringify(categoryIds) + ']{_id}')
    if (!Array.isArray(found) || found.length !== categoryIds.length) throw new Error('Една или повече категории не са намерени в каталога с растения.')
    set.category = { _type: 'reference', _ref: primaryId }
    const previousCategories = Array.isArray(existing?.categories) ? existing.categories : []
    set.categories = categoryIds.map((id: string) => {
      const previous = previousCategories.find((item: any) => item?._ref === id)
      return { _type: 'reference', _key: cleanText(previous?._key, 80) || 'category-' + stableKey(id), _ref: id }
    })
  }
  if ('description' in input) set.description = portableText(input.description)
  if ('mainImage' in input) set.mainImage = imageObject(input.mainImage)
  if ('gallery' in input) {
    if (!Array.isArray(input.gallery) || input.gallery.length > 10) throw new Error('Максимумът е 10 допълнителни снимки.')
    set.gallery = input.gallery.map(imageObject)
  }
  if ('saleVariants' in input) {
    const variants = validatePlantVariantStock(normalizeVariants(input.saleVariants), Array.isArray(existing?.saleVariants) ? existing.saleVariants : [], isCreate)
    if (!variants.some(item => (item.saleHeightCm || 0) > 0 || (item.containerVolumeL || 0) > 0)) {
      throw new Error('Добавете поне един реален размер: височина или обем на контейнера.')
    }
    set.saleVariants = variants
    set.priceEUR = Math.min(...variants.map(item => item.priceEUR))
    const oldPrices = variants.map(item => item.oldPriceEUR).filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)
    set.oldPriceEUR = oldPrices.length ? Math.min(...oldPrices) : null
    set.stockStatus = variants.some(item => item.stockStatus === 'inStock') ? 'inStock'
      : variants.some(item => item.stockStatus === 'onRequest') ? 'onRequest' : 'outOfStock'
  }
  if ('seo' in input) {
    if (!isObject(input.seo)) throw new Error('Невалидни SEO данни.')
    const previousSeo = isObject(existing?.seo) ? existing.seo : {}
    set.seo = {
      ...previousSeo,
      h1: cleanText(input.seo.h1, 160),
      metaTitle: cleanText(input.seo.metaTitle, 70),
      metaDescription: cleanText(input.seo.metaDescription, 320),
      ...(typeof input.seo.noIndex === 'boolean' ? { noIndex: input.seo.noIndex } : {}),
      ...(Array.isArray(input.seo.keywords) ? { keywords: input.seo.keywords.slice(0, 20).map((item: unknown) => cleanText(item, 60)).filter(Boolean) } : {}),
    }
  }
  if ('translations' in input) {
    if (!isObject(input.translations)) throw new Error('Невалидни преводи.')
    const previousTranslations = isObject(existing?.translations) ? existing.translations : {}
    const translations: Record<string, unknown> = { ...previousTranslations }
    for (const language of ['bg','ru','en']) {
      const item = input.translations[language]
      if (!isObject(item)) continue
      const previousLanguage = isObject(previousTranslations[language]) ? previousTranslations[language] : {}
      const seo = isObject(item.seo) ? item.seo : {}
      const previousLanguageSeo = isObject(previousLanguage.seo) ? previousLanguage.seo : {}
      const hasLocalizedContent = Boolean(
        cleanText(item.name, 160) || cleanText(item.shortDescription, 1200) ||
        cleanText(item.description, 8000) || (Array.isArray(item.description) && item.description.length) ||
        cleanText(seo.h1, 160) || cleanText(seo.metaTitle, 70) || cleanText(seo.metaDescription, 320)
      )
      if (!hasLocalizedContent && !Object.keys(previousLanguage).length) continue
      translations[language] = {
        ...previousLanguage,
        name: cleanText(item.name, 160),
        shortDescription: cleanText(item.shortDescription, 1200),
        description: portableText(item.description),
        seo: {
          ...previousLanguageSeo,
          h1: cleanText(seo.h1, 160),
          metaTitle: cleanText(seo.metaTitle, 70),
          metaDescription: cleanText(seo.metaDescription, 320),
          ...(typeof seo.noIndex === 'boolean' ? { noIndex: seo.noIndex } : {}),
          ...(Array.isArray(seo.keywords) ? { keywords: seo.keywords.slice(0, 20).map((entry: unknown) => cleanText(entry, 60)).filter(Boolean) } : {}),
        },
      }
    }
    if (Object.keys(translations).length) set.translations = translations
  }
  if ('plantCare' in input && isObject(input.plantCare)) {
    const plantCare = { ...input.plantCare }
    if ('blackSeaCoast' in plantCare && !['suitable', 'notSuitable', 'needsVerification'].includes(String(plantCare.blackSeaCoast))) {
      plantCare.blackSeaCoast = 'needsVerification'
    }
    if ('blackSeaCoastRecommendation' in plantCare && !['suitable', 'conditional', 'notSuitable', 'insufficientData'].includes(String(plantCare.blackSeaCoastRecommendation))) {
      plantCare.blackSeaCoastRecommendation = 'insufficientData'
    }
    if ('blackSeaCoastReason' in plantCare) plantCare.blackSeaCoastReason = cleanText(plantCare.blackSeaCoastReason, 800)
    set.plantCare = plantCare
  }
  if ('careGuide' in input) set.careGuide = portableText(input.careGuide)
  if (isCreate) {
    if (!set.name || !set.slug || !set.productType || !set.category || !set.categories || !set.mainImage || !set.saleVariants) {
      throw new Error('За публикуване попълнете име, URL, тип, категория, основна снимка и поне един размер.')
    }
    set.vatIncluded = true
    set.isActive = true
  }
  if ('name' in set && !('slug' in set) && isCreate) throw new Error('Липсва URL адрес на растението.')
  return { set, changedFields: Object.keys(set).sort() }
}

const portableTextSummary = (value: unknown) => {
  if (!Array.isArray(value)) return cleanText(value, 1200)
  return value.slice(0, 12).map((block: any) =>
    Array.isArray(block?.children) ? block.children.map((child: any) => cleanText(child?.text, 500)).join('') : ''
  ).filter(Boolean).join('\n\n').slice(0, 1200)
}
const imageSummary = (value: any) => ({
  assetId: cleanText(value?.asset?._ref || value?.asset?._id, 160),
  alt: cleanText(value?.alt, 240),
  altEn: cleanText(value?.altEn, 240),
  altRu: cleanText(value?.altRu, 240),
})

export const auditSnapshot = (value: Record<string, any> | null) => {
  if (!value) return null
  const translations: Record<string, unknown> = {}
  for (const language of ['bg','ru','en']) {
    const item = value.translations?.[language]
    if (isObject(item)) translations[language] = {
      name: cleanText(item.name, 160),
      shortDescription: cleanText(item.shortDescription, 500),
      description: portableTextSummary(item.description),
      seo: isObject(item.seo) ? {
        h1: cleanText(item.seo.h1, 160),
        metaTitle: cleanText(item.seo.metaTitle, 70),
        metaDescription: cleanText(item.seo.metaDescription, 320),
      } : {},
    }
  }
  return {
    name: cleanText(value.name, 160),
    slug: cleanText(value.slug?.current, 96),
    sku: cleanText(value.sku, 100),
    categoryId: cleanText(value.category?._ref, 128),
    categoryIds: Array.isArray(value.categories) ? value.categories.map((item: any) => cleanText(item?._ref, 128)).filter(Boolean).slice(0,10) : [],
    shortDescription: cleanText(value.shortDescription, 500),
    description: portableTextSummary(value.description),
    seo: isObject(value.seo) ? {
      h1: cleanText(value.seo.h1, 160),
      metaTitle: cleanText(value.seo.metaTitle, 70),
      metaDescription: cleanText(value.seo.metaDescription, 320),
    } : {},
    translations,
    mainImage: imageSummary(value.mainImage),
    gallery: Array.isArray(value.gallery) ? value.gallery.slice(0,10).map(imageSummary) : [],
    isActive: value.isActive !== false,
    variants: Array.isArray(value.saleVariants) ? value.saleVariants.slice(0,30).map((item: any) => ({
      key: cleanText(item?._key, 80), name: cleanText(item?.name, 100), sku: cleanText(item?.sku, 100),
      priceEUR: typeof item?.priceEUR === 'number' ? item.priceEUR : null,
      oldPriceEUR: typeof item?.oldPriceEUR === 'number' ? item.oldPriceEUR : null,
      stockStatus: cleanText(item?.stockStatus, 20), stockQuantity: typeof item?.stockQuantity === 'number' ? item.stockQuantity : null,
      saleHeightCm: typeof item?.saleHeightCm === 'number' ? item.saleHeightCm : null,
      containerVolumeL: typeof item?.containerVolumeL === 'number' ? item.containerVolumeL : null,
    })) : [],
  }
}

export const writeAudit = async (
  env: ManagerEnv,
  user: ManagerIdentity,
  input: { requestId: string; idempotencyKey: string; phase: 'started'|'result'; productId: string; productName: string; action: 'create'|'update'|'deactivate'|'reactivate'; changedFields: string[]; before: unknown; after: unknown; result: 'started'|'success'|'failed'; errorCode?: string },
) => {
  if (!env.DB) throw new Error('D1_NOT_CONFIGURED')
  await env.DB.prepare(`
    INSERT INTO manager_product_audit
      (id,request_id,idempotency_key,phase,actor_id,actor_role,product_id,product_name,action,changed_fields,before_data,after_data,result,error_code,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    newId(),input.requestId,input.idempotencyKey,input.phase,user.user_id,user.role,input.productId,
    cleanText(input.productName,160),input.action,JSON.stringify(input.changedFields.slice(0,40)),
    input.before ? JSON.stringify(input.before) : null,
    input.after ? JSON.stringify(input.after) : null,
    input.result,input.errorCode || null,nowIso(),
  ).run()
}

export const safeFailureCode = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('SANITY_MUTATION_FAILED_')) return 'sanity_mutation_failed'
  if (message.startsWith('SANITY_QUERY_FAILED_')) return 'sanity_query_failed'
  if (message === 'SANITY_VARIANT_VERIFY_FAILED') return 'sanity_variant_verify_failed'
  if (message === 'D1_NOT_CONFIGURED') return 'd1_not_configured'
  if (message === 'SANITY_NOT_CONFIGURED') return 'sanity_not_configured'
  return 'validation_or_internal_error'
}
