import { generateCategorySeo, isBlankSeoValue, type CategoryCatalog, type CategorySeoLocale } from '../../../src/lib/categorySeo'
import { checkSameOrigin, hasPermission, json, parseBody, requireUser, type ManagerEnv } from './_lib'

type SeoValues = {
  h1?: string
  metaTitle?: string
  metaDescription?: string
  suggested?: { h1?: string; metaTitle?: string; metaDescription?: string }
}
type CategoryDocument = {
  _id: string
  _rev: string
  name: string
  slug?: string
  description?: unknown
  parent?: { name?: string } | null
  seo?: SeoValues | null
  translations?: Partial<Record<'ru' | 'en', { name?: string; description?: unknown; seo?: SeoValues }>>
}
type WorkItem = { dataset: string; catalog: CategoryCatalog; category: CategoryDocument }

const API_VERSION = '2024-01-01'
const BATCH_SIZE = 4
const SEO_FIELDS = ['h1', 'metaTitle', 'metaDescription'] as const

const fetchCategories = async (projectId: string, token: string, dataset: string): Promise<CategoryDocument[]> => {
  const query = '*[_type == "category" && defined(name) && !(_id in path("drafts.**"))] | order(sortOrder asc, name asc) { _id, _rev, name, "slug": coalesce(slug.current, slug), description, parent->{name}, seo{h1,metaTitle,metaDescription,suggested{h1,metaTitle,metaDescription}}, translations{ru{name,description,seo{h1,metaTitle,metaDescription,suggested{h1,metaTitle,metaDescription}}},en{name,description,seo{h1,metaTitle,metaDescription,suggested{h1,metaTitle,metaDescription}}}} }'
  const url = new URL('https://' + projectId + '.api.sanity.io/v' + API_VERSION + '/data/query/' + dataset)
  url.searchParams.set('query', query)
  const response = await fetch(url.toString(), { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } })
  if (!response.ok) throw new Error('Sanity query failed for dataset ' + dataset + ': ' + response.status)
  const result = await response.json() as { result?: CategoryDocument[] }
  return Array.isArray(result.result) ? result.result : []
}

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!hasPermission(auth.user, 'canManageCategorySeo')) return json({ error: 'Нямате право да управлявате SEO категориите.' }, 403)

  const body = await parseBody(request)
  const mode = body?.mode
  const offset = Number(body?.offset ?? 0)
  if (mode !== 'all' && mode !== 'missing') return json({ error: 'Invalid generation mode.' }, 400)
  if (!Number.isInteger(offset) || offset < 0) return json({ error: 'Invalid offset.' }, 400)

  const token = env.SANITY_API_TOKEN
  if (!token) return json({ error: 'SANITY_API_TOKEN is not configured in Cloudflare Pages.' }, 503)
  const projectId = env.SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs'
  const equipmentDataset = env.SANITY_DATASET || 'production'
  const plantsDataset = env.SANITY_PLANTS_DATASET || 'plants'

  try {
    const [equipment, plants] = await Promise.all([
      fetchCategories(projectId, token, equipmentDataset),
      fetchCategories(projectId, token, plantsDataset),
    ])
    const items: WorkItem[] = [
      ...equipment.map(category => ({ dataset: equipmentDataset, catalog: 'irrigation' as const, category })),
      ...plants.map(category => ({ dataset: plantsDataset, catalog: 'plants' as const, category })),
    ]
    if (offset > items.length) return json({ error: 'The requested offset is outside the category list.' }, 400)

    const batch = items.slice(offset, offset + BATCH_SIZE)
    const mutationsByDataset = new Map<string, Array<{ patch: { id: string; ifRevisionID: string; set: Record<string, unknown> } }>>()
    let generatedFields = 0
    let skipped = 0

    for (const item of batch) {
      const category = item.category
      const slug = category.slug || ''
      const set: Record<string, unknown> = {}
      let fieldsForCategory = 0

      const locales: CategorySeoLocale[] = ['bg', 'ru', 'en']
      for (const locale of locales) {
        const liveSeo = locale === 'bg' ? category.seo : category.translations?.[locale]?.seo
        const suggested = liveSeo?.suggested || {}
        const proposal = generateCategorySeo({
          _id: category._id,
          name: category.name,
          slug,
          description: category.description,
          parentName: category.parent?.name,
          catalog: item.catalog,
          translations: category.translations,
        }, locale)

        const nextSuggested: { h1?: string; metaTitle?: string; metaDescription?: string; generatedAt?: string; generatorVersion?: string; status?: string } = { ...suggested }
        let localeChanged = false
        for (const field of SEO_FIELDS) {
          if (mode === 'all') {
            nextSuggested[field] = proposal[field]
            localeChanged = true
            fieldsForCategory += 1
          } else if (isBlankSeoValue(liveSeo?.[field]) && isBlankSeoValue(suggested[field])) {
            nextSuggested[field] = proposal[field]
            localeChanged = true
            fieldsForCategory += 1
          }
        }

        if (localeChanged) {
          nextSuggested.generatedAt = new Date().toISOString()
          nextSuggested.generatorVersion = 'rules-1.0.0'
          nextSuggested.status = 'needsReview'
          const prefix = locale === 'bg' ? 'seo' : 'translations.' + locale + '.seo'
          set[prefix + '.suggested'] = nextSuggested
        }
      }

      if (Object.keys(set).length) {
        const mutations = mutationsByDataset.get(item.dataset) || []
        mutations.push({ patch: { id: category._id, ifRevisionID: category._rev, set } })
        mutationsByDataset.set(item.dataset, mutations)
        generatedFields += fieldsForCategory
      } else {
        skipped += 1
      }
    }

    for (const [dataset, mutations] of mutationsByDataset) {
      const url = 'https://' + projectId + '.api.sanity.io/v' + API_VERSION + '/data/mutate/' + dataset
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ mutations, returnIds: true }),
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error('Sanity write failed for ' + dataset + ': ' + response.status + (detail ? ' — ' + detail.slice(0, 300) : ''))
      }
    }

    const nextOffset = offset + batch.length
    return json({ total: items.length, processed: batch.length, generatedFields, skipped, nextOffset, hasMore: nextOffset < items.length, mode })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Category SEO generation failed.' }, 502)
  }
}
