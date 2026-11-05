import { generateProductSeo } from '../../../src/lib/productSeo.mjs'
import { checkSameOrigin, json, parseBody, requireUser, type ManagerEnv } from './_lib'

type Catalog = 'irrigation' | 'plants'
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

const API_VERSION = '2024-01-01'
const BATCH_SIZE = 10
const LOCALES: Locale[] = ['bg', 'ru', 'en']

const getDataset = (catalog: Catalog, env: ManagerEnv) =>
  catalog === 'plants' ? env.SANITY_PLANTS_DATASET || 'plants' : env.SANITY_DATASET || 'production'

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

const fetchProductCount = (projectId: string, dataset: string, token?: string) =>
  sanityQuery<number>(projectId, dataset, 'count(*[_type == "product" && defined(name) && !(_id in path("drafts.**"))])', token)

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

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env, ['owner'])
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)

  const body = await parseBody(request)
  const mode = body?.mode
  const catalog = body?.catalog
  const offset = Number(body?.offset ?? 0)
  if (mode !== 'preview' && mode !== 'apply') return json({ error: 'Invalid product SEO mode.' }, 400)
  if (mode === 'apply' && body?.confirm !== true) return json({ error: 'Explicit owner confirmation is required before writing product SEO.' }, 400)
  if (catalog !== 'irrigation' && catalog !== 'plants') return json({ error: 'Invalid product catalogue.' }, 400)
  if (!Number.isInteger(offset) || offset < 0) return json({ error: 'Invalid offset.' }, 400)

  const projectId = env.SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs'
  const dataset = getDataset(catalog, env)
  const token = env.SANITY_API_TOKEN

  if (mode === 'apply' && !token) {
    return json({ error: 'SANITY_API_TOKEN is not configured in Cloudflare Pages.' }, 503)
  }

  try {
    const total = await fetchProductCount(projectId, dataset, mode === 'apply' ? token : undefined)
    if (offset > total) return json({ error: 'The requested offset is outside the product list.' }, 400)

    if (mode === 'preview') {
      const products = await fetchProducts(projectId, dataset, 0, 6)
      const sample: Array<Record<string, string>> = []
      let generatedFields = 0
      let overwrittenFields = 0
      let skippedLocales = 0

      products.forEach((product, index) => {
        for (const locale of LOCALES) {
          const generated = generateProductSeo(product, locale, index)
          if (!generated) {
            skippedLocales += 1
            continue
          }
          const existing = getExistingSeo(product, locale)
          const prefix = getSeoPrefix(locale)
          generatedFields += 3
          overwrittenFields += ['h1', 'metaTitle', 'metaDescription'].filter((field) =>
            typeof existing[field] === 'string' && existing[field].trim().length > 0,
          ).length
          sample.push({
            product: product.name,
            locale,
            h1: generated.h1,
            metaTitle: generated.metaTitle,
            metaDescription: generated.metaDescription,
            location: generated.location,
            fieldPath: prefix,
          })
        }
      })

      return json({
        mode,
        catalog,
        dataset,
        total,
        previewProducts: products.length,
        generatedFields,
        overwrittenFields,
        skippedLocales,
        sample,
      })
    }

    const products = await fetchProducts(projectId, dataset, offset, BATCH_SIZE, token)
    if (products.length === 0) {
      return json({ mode, catalog, dataset, total, processed: 0, generatedFields: 0, overwrittenFields: 0, skippedLocales: 0, nextOffset: offset, hasMore: false })
    }

    const mutations: Array<{ patch: { id: string; ifRevisionID: string; set: Record<string, string> } }> = []
    let generatedFields = 0
    let overwrittenFields = 0
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
        overwrittenFields += ['h1', 'metaTitle', 'metaDescription'].filter((field) =>
          typeof existing[field] === 'string' && existing[field].trim().length > 0,
        ).length
        const prefix = getSeoPrefix(locale)
        set[prefix + '.h1'] = generated.h1
        set[prefix + '.metaTitle'] = generated.metaTitle
        set[prefix + '.metaDescription'] = generated.metaDescription
        generatedFields += 3
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
      catalog,
      dataset,
      total,
      processed: products.length,
      generatedFields,
      overwrittenFields,
      skippedLocales,
      nextOffset,
      hasMore: nextOffset < total,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Product SEO generation failed.' }, 502)
  }
}
