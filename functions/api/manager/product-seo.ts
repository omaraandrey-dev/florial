import { generateProductSeo, getMissingProductSeoFields } from '../../../src/lib/productSeo.mjs'
import { checkSameOrigin, json, parseBody, requireUser, type ManagerEnv } from './_lib'

type Locale = 'bg' | 'ru' | 'en'
type ProductDocument = {
  _id: string
  _rev: string
  name: string
  slug?: string
  shortDescription?: string
  description?: unknown
  scientificName?: string
  productType?: string
  seo?: Record<string, any> | null
  translations?: Partial<Record<'ru' | 'en', {
    name?: string
    shortDescription?: string
    description?: unknown
    seo?: Record<string, any>
  }>>
}

type SeoGapStats = {
  productsWithMissingFields: number
  missingH1BG: number
  missingMetaTitleBG: number
  missingMetaDescriptionBG: number
  missingH1RU: number
  missingMetaTitleRU: number
  missingMetaDescriptionRU: number
  missingH1EN: number
  missingMetaTitleEN: number
  missingMetaDescriptionEN: number
  availableBgProducts: number
  availableRuProducts: number
  availableEnProducts: number
}

const API_VERSION = '2024-01-01'
const BATCH_SIZE = 10
const PREVIEW_SIZE = 6
const LOCALES: Locale[] = ['bg', 'ru', 'en']
const SEO_FIELDS = ['h1', 'metaTitle', 'metaDescription'] as const
const getDataset = (env: ManagerEnv) => env.SANITY_DATASET || 'production'

const sanityQuery = async <T,>(
  projectId: string,
  dataset: string,
  query: string,
  token?: string,
): Promise<T> => {
  const url = new URL('https://' + projectId + '.api.sanity.io/v' + API_VERSION + '/data/query/' + dataset)
  url.searchParams.set('query', query)
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
  })
  if (!response.ok) throw new Error('Sanity query failed for ' + dataset + ': ' + response.status)
  const body = await response.json() as { result?: T }
  return body.result as T
}

const PRODUCT_FILTER = '_type == "product" && defined(name) && !(_id in path("drafts.**"))'
const countProducts = (condition = '') =>
  'count(*[' + PRODUCT_FILTER + (condition ? ' && (' + condition + ')' : '') + '])'

const fetchProductCount = (projectId: string, dataset: string, token?: string) =>
  sanityQuery<number>(projectId, dataset, countProducts(), token)

const fetchSeoGapStats = (projectId: string, dataset: string): Promise<SeoGapStats> => {
  const missing = (path: string) => '(!defined(' + path + ') || ' + path + ' == "")'
  const fields = [
    ['missingH1BG', 'seo.h1', ''],
    ['missingMetaTitleBG', 'seo.metaTitle', ''],
    ['missingMetaDescriptionBG', 'seo.metaDescription', ''],
    ['missingH1RU', 'translations.ru.seo.h1', 'defined(translations.ru.name)'],
    ['missingMetaTitleRU', 'translations.ru.seo.metaTitle', 'defined(translations.ru.name)'],
    ['missingMetaDescriptionRU', 'translations.ru.seo.metaDescription', 'defined(translations.ru.name)'],
    ['missingH1EN', 'translations.en.seo.h1', 'defined(translations.en.name)'],
    ['missingMetaTitleEN', 'translations.en.seo.metaTitle', 'defined(translations.en.name)'],
    ['missingMetaDescriptionEN', 'translations.en.seo.metaDescription', 'defined(translations.en.name)'],
  ] as const
  const entries = fields.map(([key, path, localeFilter]) =>
    '"' + key + '":' + countProducts([localeFilter, missing(path)].filter(Boolean).join(' && ')),
  )
  const anyMissing = fields.map(([, path, localeFilter]) =>
    '(' + [localeFilter, missing(path)].filter(Boolean).join(' && ') + ')',
  ).join(' || ')
  const query = '{' +
    '"productsWithMissingFields":' + countProducts(anyMissing) + ',' +
    '"availableBgProducts":' + countProducts() + ',' +
    '"availableRuProducts":' + countProducts('defined(translations.ru.name)') + ',' +
    '"availableEnProducts":' + countProducts('defined(translations.en.name)') + ',' +
    entries.join(',') +
    '}'
  return sanityQuery<SeoGapStats>(projectId, dataset, query)
}

const fetchProducts = (projectId: string, dataset: string, offset: number, limit: number, token?: string) => {
  const query = '*[_type == "product" && defined(name) && !(_id in path("drafts.**"))] | order(_id asc)[' + offset + '...' + (offset + limit) + ']{' +
    '_id,_rev,name,"slug":coalesce(slug.current,slug),shortDescription,description,scientificName,productType,' +
    '"brandName":brand->name,"categoryName":category->name,seo,' +
    'translations{ru{name,shortDescription,description,seo},en{name,shortDescription,description,seo}}' +
    '}'
  return sanityQuery<ProductDocument[]>(projectId, dataset, query, token)
}

const getExistingSeo = (product: ProductDocument, locale: Locale) =>
  locale === 'bg' ? product.seo || {} : product.translations?.[locale]?.seo || {}

const getSeoPrefix = (locale: Locale) => locale === 'bg' ? 'seo' : 'translations.' + locale + '.seo'

const getPreviewStats = (stats: SeoGapStats) => {
  const fieldCounts = {
    bg: { h1: stats.missingH1BG, metaTitle: stats.missingMetaTitleBG, metaDescription: stats.missingMetaDescriptionBG },
    ru: { h1: stats.missingH1RU, metaTitle: stats.missingMetaTitleRU, metaDescription: stats.missingMetaDescriptionRU },
    en: { h1: stats.missingH1EN, metaTitle: stats.missingMetaTitleEN, metaDescription: stats.missingMetaDescriptionEN },
  }
  const missingFields = Object.values(fieldCounts).reduce((total, locale) =>
    total + Object.values(locale).reduce((sum, count) => sum + count, 0), 0)
  const availableFields = (stats.availableBgProducts + stats.availableRuProducts + stats.availableEnProducts) * SEO_FIELDS.length
  return { fieldCounts, missingFields, preservedFields: Math.max(0, availableFields - missingFields) }
}

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env, ['owner'])
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)

  const body = await parseBody(request)
  const mode = body?.mode
  const catalog = body?.catalog
  const offset = Number(body?.offset ?? 0)
  if (mode !== 'preview' && mode !== 'apply') return json({ error: 'Invalid product SEO mode.' }, 400)
  if (catalog !== 'irrigation') return json({ error: 'Only the irrigation equipment catalogue is enabled for this SEO operation.' }, 400)
  if (body?.strategy !== 'missing-only') return json({ error: 'The missing-only strategy must be selected explicitly.' }, 400)
  if (mode === 'apply' && body?.confirm !== true) return json({ error: 'Explicit owner confirmation is required before writing product SEO.' }, 400)
  if (!Number.isInteger(offset) || offset < 0) return json({ error: 'Invalid offset.' }, 400)

  const projectId = env.SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs'
  const dataset = getDataset(env)
  const token = env.SANITY_API_TOKEN

  if (mode === 'apply' && !token) {
    return json({ error: 'SANITY_API_TOKEN is not configured in Cloudflare Pages.' }, 503)
  }

  try {
    const total = await fetchProductCount(projectId, dataset, mode === 'apply' ? token : undefined)
    if (offset > total) return json({ error: 'The requested offset is outside the product list.' }, 400)

    if (mode === 'preview') {
      const [products, stats] = await Promise.all([
        fetchProducts(projectId, dataset, 0, PREVIEW_SIZE),
        fetchSeoGapStats(projectId, dataset),
      ])
      const sample: Array<Record<string, unknown>> = []
      let sampleFieldsToFill = 0
      let sampleFieldsPreserved = 0
      let skippedLocales = 0

      products.forEach((product, index) => {
        for (const locale of LOCALES) {
          const generated = generateProductSeo(product, locale, index)
          if (!generated) {
            skippedLocales += 1
            continue
          }
          const missing = getMissingProductSeoFields(getExistingSeo(product, locale), generated)
          const fieldsToFill = Object.keys(missing)
          const fieldsToPreserve = SEO_FIELDS.filter((field) => !fieldsToFill.includes(field))
          sampleFieldsToFill += fieldsToFill.length
          sampleFieldsPreserved += fieldsToPreserve.length
          sample.push({
            product: product.name,
            locale,
            h1: generated.h1,
            metaTitle: generated.metaTitle,
            metaDescription: generated.metaDescription,
            location: generated.location,
            fieldsToFill,
            fieldsToPreserve,
          })
        }
      })

      const totals = getPreviewStats(stats)
      return json({
        mode,
        strategy: 'missing-only',
        catalog,
        dataset,
        total,
        productsWithMissingFields: stats.productsWithMissingFields,
        missingFields: totals.missingFields,
        preservedFields: totals.preservedFields,
        missingFieldCounts: totals.fieldCounts,
        previewProducts: products.length,
        sampleFieldsToFill,
        sampleFieldsPreserved,
        skippedLocales,
        sample,
      })
    }

    const products = await fetchProducts(projectId, dataset, offset, BATCH_SIZE, token)
    if (products.length === 0) {
      return json({ mode, strategy: 'missing-only', catalog, dataset, total, processed: 0, generatedFields: 0, preservedFields: 0, nextOffset: offset, hasMore: false })
    }

    const mutations: Array<{ patch: { id: string; ifRevisionID: string; set: Record<string, string> } }> = []
    let generatedFields = 0
    let preservedFields = 0
    let skippedLocales = 0

    products.forEach((product, index) => {
      const set: Record<string, string> = {}
      for (const locale of LOCALES) {
        const generated = generateProductSeo(product, locale, offset + index)
        if (!generated) {
          skippedLocales += 1
          continue
        }
        const existing = getExistingSeo(product, locale)
        const missing = getMissingProductSeoFields(existing, generated)
        const prefix = getSeoPrefix(locale)
        for (const field of SEO_FIELDS) {
          if (Object.prototype.hasOwnProperty.call(missing, field)) {
            const value = missing[field]
            if (typeof value === 'string') {
              set[prefix + '.' + field] = value
              generatedFields += 1
            }
          } else {
            preservedFields += 1
          }
        }
      }
      if (Object.keys(set).length) {
        mutations.push({ patch: { id: product._id, ifRevisionID: product._rev, set } })
      }
    })

    if (mutations.length) {
      const url = 'https://' + projectId + '.api.sanity.io/v' + API_VERSION + '/data/mutate/' + dataset
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ mutations, returnIds: true }),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error('Sanity write failed for ' + dataset + ': ' + response.status + (detail ? ' — ' + detail.slice(0, 300) : ''))
      }
    }

    const nextOffset = offset + products.length
    return json({
      mode,
      strategy: 'missing-only',
      catalog,
      dataset,
      total,
      processed: products.length,
      generatedFields,
      preservedFields,
      skippedLocales,
      nextOffset,
      hasMore: nextOffset < total,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Product SEO generation failed.' }, 502)
  }
}
