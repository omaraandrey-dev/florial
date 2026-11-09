import { checkSameOrigin, json, newId, requireUser, type ManagerEnv } from './_lib'
import { auditSnapshot, buildPlantSet, cleanText, errorJson, parseJsonBody, requirePlantRole, safeFailureCode, sanityMutate, sanityQuery, writeAudit } from './plant-direct-lib'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const jsonString = (value: string) => JSON.stringify(value)

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB || !env.SANITY_API_TOKEN) return json({ error: 'Plant catalogue service is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Insufficient permissions.' }, 403)

  const url = new URL(request.url)
  const search = cleanText(url.searchParams.get('q'), 80)
  const categoryId = cleanText(url.searchParams.get('categoryId'), 128)
  const sort = url.searchParams.get('sort') === 'category' ? 'category->name asc, name asc' : 'name asc'
  const requestedLimit = Number(url.searchParams.get('limit') || 30)
  const limit = Number.isInteger(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 30
  const requestedOffset = Number(url.searchParams.get('offset') || 0)
  const offset = Number.isInteger(requestedOffset) ? Math.min(100000, Math.max(0, requestedOffset)) : 0

  const filters = ['_type=="product"', '!(_id in path("drafts.**"))']
  if (search) {
    const term = '*' + search.replace(/[\*?]/g, '') + '*'
    const match = jsonString(term)
    filters.push('(name match ' + match + ' || scientificName match ' + match + ' || sku match ' + match + ' || translations.bg.name match ' + match + ' || translations.ru.name match ' + match + ' || translations.en.name match ' + match + ')')
  }
  if (categoryId) {
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(categoryId)) return errorJson('Invalid category.', 400)
    filters.push('(category._ref==' + jsonString(categoryId) + ' || references(' + jsonString(categoryId) + '))')
  }
  const filter = filters.join(' && ')
  const query = '*[' + filter + ']|order(' + sort + ')[' + offset + '...' + (offset + limit + 1) + ']{_id,_rev,name,scientificName,sku,"slug":slug.current,"categoryId":category._ref,"categoryName":category->name,"categoryParent":category->parent->name,"thumbnail":mainImage.asset->url,"mainImageAlt":mainImage.alt,isActive,isFeatured,stockStatus,saleVariants[]{_key,name,priceEUR,oldPriceEUR,stockStatus,stockQuantity,saleHeightCm,containerVolumeL}}'
  const categoryQuery = '*[_type=="category" && !(_id in path("drafts.**"))]|order(parent->name asc,sortOrder asc,name asc){_id,name,"slug":slug.current,"parentId":parent._ref,"parentName":parent->name}'
  try {
    const [items, categories] = await Promise.all([
      sanityQuery<Array<Record<string, any>>>(env, query),
      sanityQuery<Array<Record<string, any>>>(env, categoryQuery),
    ])
    const hasMore = items.length > limit
    return json({
      items: items.slice(0, limit).map((item) => {
        const variants = Array.isArray(item.saleVariants) ? item.saleVariants : []
        const prices = variants.map((variant: any) => Number(variant.priceEUR)).filter((price: number) => Number.isFinite(price) && price > 0)
        const statuses = Array.from(new Set(variants.map((variant: any) => variant.stockStatus).filter(Boolean)))
        return {
          ...item,
          priceFromEUR: prices.length ? Math.min(...prices) : null,
          listStockStatus: statuses.length > 1 ? 'mixed' : statuses[0] || item.stockStatus || 'onRequest',
          variantCount: variants.length,
        }
      }),
      categories,
      nextOffset: hasMore ? offset + limit : null,
    })
  } catch (error) {
    const code = error instanceof Error && error.message.startsWith('SANITY_QUERY_FAILED_') ? 'sanity_query_failed' : 'plant_catalog_unavailable'
    console.error('[manager-plants-list]', { code })
    return json({ error: 'Не успяхме да заредим каталога с растения.' }, 502)
  }
}

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB || !env.SANITY_API_TOKEN) return json({ error: 'Plant catalogue service is not configured.' }, 503)
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Insufficient permissions.' }, 403)
  const body = await parseJsonBody(request)
  if (!body || !isValidKey(body.idempotencyKey) || !body.product) return errorJson('Invalid product request.', 400)

  const idempotencyKey = String(body.idempotencyKey)
  let requestId = newId()
  let productId = newId()
  let productName = ''
  let changedFields: string[] = []
  let after: unknown = null
  let auditStarted = false
  let mutationSucceeded = false
  try {
    const existing = await env.DB.prepare("SELECT product_id, request_id, product_name, result FROM manager_product_audit WHERE idempotency_key=? AND phase='started' LIMIT 1")
      .bind(idempotencyKey).first<{ product_id: string; request_id: string; product_name: string; result: string }>()
    if (existing) {
      productId = existing.product_id
      requestId = existing.request_id
      productName = existing.product_name
      const completed = await env.DB.prepare("SELECT result FROM manager_product_audit WHERE idempotency_key=? AND phase='result' LIMIT 1")
        .bind(idempotencyKey).first<{ result: string }>()
      if (completed?.result === 'success') return json({ ok: true, documentId: productId, replayed: true })
      if (completed) return errorJson('Тази операция вече е приключила с грешка. Започнете ново запазване.', 409)
    }

    const normalized = await buildPlantSet(env, body.product, auth.user.role, true)
    changedFields = normalized.changedFields
    productName = cleanText(normalized.set.name, 160)
    const slug = (normalized.set.slug as { current: string }).current
    const duplicate = await sanityQuery<string | null>(env, '*[_type=="product" && slug.current==' + jsonString(slug) + ' && !(_id in path("drafts.**"))][0]._id')
    if (duplicate && duplicate !== productId) return errorJson('Този URL адрес вече се използва от друго растение.', 409)

    if (!existing) {
      await writeAudit(env, auth.user, {
        requestId, idempotencyKey, phase: 'started', productId, productName, action: 'create',
        changedFields, before: null, after: null, result: 'started',
      })
      auditStarted = true
    } else auditStarted = true

    const document = { _id: productId, _type: 'product', ...normalized.set }
    await sanityMutate(env, [{ createIfNotExists: document }])
    mutationSucceeded = true
    const saved = await sanityQuery<Record<string, any> | null>(env, '*[_type=="product" && _id==' + jsonString(productId) + '][0]{_id,_rev,name,slug,sku,category,isActive,saleVariants}')
    if (!saved?._rev) throw new Error('SANITY_VERIFY_FAILED')
    after = auditSnapshot(saved)
    await writeAudit(env, auth.user, {
      requestId, idempotencyKey, phase: 'result', productId, productName, action: 'create',
      changedFields, before: null, after, result: 'success',
    })
    return json({ ok: true, documentId: productId, revision: saved._rev, requestId }, 201)
  } catch (error) {
    const code = safeFailureCode(error)
    if (auditStarted && mutationSucceeded) {
      console.error('[manager-plants-create-audit]', { requestId, code: 'audit_success_write_pending' })
      return json({ error: 'Растението може да е създадено, но историята не потвърди резултата. Повторете същата операция без да променяте данните.', requestId, auditPending: true }, 503)
    }
    if (auditStarted) {
      try {
        await writeAudit(env, auth.user, {
          requestId, idempotencyKey, phase: 'result', productId, productName, action: 'create',
          changedFields, before: null, after, result: 'failed', errorCode: code,
        })
      } catch {
        console.error('[manager-plants-create-audit]', { requestId, code: 'audit_result_write_failed' })
        return json({ error: 'Не можем да потвърдим резултата в историята. Запазете номера на операцията и се свържете със собственика.', requestId, auditPending: true }, 500)
      }
    }
    if (error instanceof Error && error.message.startsWith('SANITY_MUTATION_FAILED_')) {
      return json({ error: 'Sanity не успя да публикува растението. Опитайте отново.', requestId }, 502)
    }
    console.error('[manager-plants-create]', { requestId, code })
    return json({ error: error instanceof Error ? error.message : 'Не успяхме да създадем растението.', requestId }, 400)
  }
}

const isValidKey = (value: unknown) => typeof value === 'string' && uuid.test(value)
