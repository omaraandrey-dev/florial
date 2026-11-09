import { json, newId, nowIso, type ManagerEnv, type ManagerIdentity } from './_lib'

export const PLANTS_PROJECT = 'bxvcy0qs'
export const PLANTS_DATASET = 'plants'
export const PRODUCT_TYPES = new Set([
  'plant','tree','shrub','flower','perennial','indoor','citrus','palm','conifer','fruit','succulent',
  'climber','ornamentalGrass','groundcover','bulb','herb','aquatic','other',
])
export const STOCK_STATUSES = new Set(['inStock','onRequest','outOfStock'])
export type PlantVariant = {
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

const numberValue = (value: unknown, label: string, min: number, integer = false): number | null => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed))) {
    throw new Error('Проверете стойността на полето „' + label + '“.')
  }
  return parsed
}

const portableText = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  const text = cleanText(value, 12_000)
  if (!text) return []
  return [{
    _type: 'block',
    _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12), text, marks: [] }],
  }]
}

const imageObject = (value: unknown) => {
  if (!isObject(value) || !/^image-[A-Za-z0-9-]+$/.test(String(value.assetId || ''))) {
    throw new Error('Една от снимките няма валиден Sanity asset.')
  }
  const fields = {
    _type: 'image',
    _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
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
    if (stockStatus === 'inStock' && (stockQuantity === null || stockQuantity < 1)) {
      throw new Error('За вариант „В наличност“ въведете количество поне 1.')
    }
    const oldPriceEUR = numberValue(item.oldPriceEUR, 'Стара цена', 0)
    if (oldPriceEUR !== null && oldPriceEUR <= priceEUR) throw new Error('Старата цена трябва да е по-висока от текущата.')
    return {
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
  isCreate = false,
): Promise<{ set: Record<string, unknown>; changedFields: string[] }> => {
  if (!isObject(input)) throw new Error('Липсват данни за растението.')
  if (role !== 'owner' && ('plantCare' in input || 'careGuide' in input)) {
    throw new Error('Биологичните характеристики са достъпни само за собственика.')
  }
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
  if ('categoryId' in input) {
    const categoryId = cleanText(input.categoryId, 128)
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(categoryId)) throw new Error('Изберете категория от каталога.')
    const category = await sanityQuery<{ _id: string } | null>(env, '*[_type=="category" && _id==' + JSON.stringify(categoryId) + '][0]{_id}')
    if (!category) throw new Error('Избраната категория не е намерена в каталога с растения.')
    set.category = { _type: 'reference', _ref: categoryId }
    set.categories = [{ _type: 'reference', _ref: categoryId }]
  }
  if ('description' in input) set.description = portableText(input.description)
  if ('mainImage' in input) set.mainImage = imageObject(input.mainImage)
  if ('gallery' in input) {
    if (!Array.isArray(input.gallery) || input.gallery.length > 10) throw new Error('Максимумът е 10 допълнителни снимки.')
    set.gallery = input.gallery.map(imageObject)
  }
  if ('saleVariants' in input) {
    const variants = normalizeVariants(input.saleVariants)
    set.saleVariants = variants
    set.stockStatus = variants.some(item => item.stockStatus === 'inStock') ? 'inStock'
      : variants.some(item => item.stockStatus === 'onRequest') ? 'onRequest' : 'outOfStock'
    // Root-level legacy price/oldPrice/stockQuantity deliberately remain untouched.
  }
  if ('seo' in input) {
    if (!isObject(input.seo)) throw new Error('Невалидни SEO данни.')
    set.seo = {
      h1: cleanText(input.seo.h1, 160),
      metaTitle: cleanText(input.seo.metaTitle, 70),
      metaDescription: cleanText(input.seo.metaDescription, 320),
      noIndex: input.seo.noIndex === true,
      keywords: Array.isArray(input.seo.keywords) ? input.seo.keywords.slice(0, 20).map((item: unknown) => cleanText(item, 60)).filter(Boolean) : [],
    }
  }
  if ('translations' in input) {
    if (!isObject(input.translations)) throw new Error('Невалидни преводи.')
    const translations: Record<string, unknown> = {}
    for (const language of ['bg','ru','en']) {
      const item = input.translations[language]
      if (!isObject(item)) continue
      const seo = isObject(item.seo) ? item.seo : {}
      translations[language] = {
        name: cleanText(item.name, 160),
        shortDescription: cleanText(item.shortDescription, 1200),
        description: portableText(item.description),
        seo: {
          h1: cleanText(seo.h1, 160),
          metaTitle: cleanText(seo.metaTitle, 70),
          metaDescription: cleanText(seo.metaDescription, 320),
          noIndex: seo.noIndex === true,
          keywords: Array.isArray(seo.keywords) ? seo.keywords.slice(0, 20).map((entry: unknown) => cleanText(entry, 60)).filter(Boolean) : [],
        },
      }
    }
    set.translations = translations
  }
  if (role === 'owner' && 'plantCare' in input && isObject(input.plantCare)) set.plantCare = input.plantCare
  if (role === 'owner' && 'careGuide' in input) set.careGuide = portableText(input.careGuide)
  if (isCreate) {
    if (!set.name || !set.slug || !set.productType || !set.category || !set.mainImage || !set.saleVariants) {
      throw new Error('За публикуване попълнете име, URL, тип, категория, основна снимка и поне един размер.')
    }
    set.vatIncluded = true
    set.isActive = true
  }
  if ('name' in set && !('slug' in set) && isCreate) throw new Error('Липсва URL адрес на растението.')
  return { set, changedFields: Object.keys(set).sort() }
}

export const auditSnapshot = (value: Record<string, any> | null) => {
  if (!value) return null
  return {
    name: cleanText(value.name, 160),
    slug: cleanText(value.slug?.current, 96),
    sku: cleanText(value.sku, 100),
    categoryId: cleanText(value.category?._ref, 128),
    isActive: value.isActive !== false,
    variants: Array.isArray(value.saleVariants) ? value.saleVariants.slice(0,30).map((item: any) => ({
      key: cleanText(item?._key, 80), name: cleanText(item?.name, 100), priceEUR: typeof item?.priceEUR === 'number' ? item.priceEUR : null,
      stockStatus: cleanText(item?.stockStatus, 20), stockQuantity: typeof item?.stockQuantity === 'number' ? item.stockQuantity : null,
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
    input.before ? JSON.stringify(input.before).slice(0,12000) : null,
    input.after ? JSON.stringify(input.after).slice(0,12000) : null,
    input.result,input.errorCode || null,nowIso(),
  ).run()
}

export const safeFailureCode = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('SANITY_MUTATION_FAILED_')) return 'sanity_mutation_failed'
  if (message.startsWith('SANITY_QUERY_FAILED_')) return 'sanity_query_failed'
  if (message === 'D1_NOT_CONFIGURED') return 'd1_not_configured'
  if (message === 'SANITY_NOT_CONFIGURED') return 'sanity_not_configured'
  return 'validation_or_internal_error'
}
