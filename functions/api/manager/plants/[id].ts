import { checkSameOrigin, json, newId, requireUser, type ManagerEnv } from '../_lib'
import { auditSnapshot, buildPlantSet, cleanText, errorJson, parseJsonBody, requirePlantRole, safeFailureCode, sanityMutate, sanityQuery, verifyPlantAiProof, writeAudit, type PlantDocument } from '../plant-direct-lib'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i
const jsonString = (value: string) => JSON.stringify(value)

export const onRequestGet = async ({ request, env, params }: { request: Request; env: ManagerEnv; params: { id: string } }) => {
  if (!env.DB || !env.SANITY_API_TOKEN) return json({ error: 'Plant catalogue service is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Insufficient permissions.' }, 403)
  const id = cleanText(params.id, 128)
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(id) || id.startsWith('drafts.')) return errorJson('Invalid product ID.', 400)
  const ownerFields = auth.user.role === 'owner' ? ',plantCare,careGuide' : ''
  const query = '*[_type=="product" && _id==' + jsonString(id) + '][0]{_id,_rev,_type,name,slug,sku,productType,scientificName,category, "categoryId":category._ref, "categoryName":category->name, categories, shortDescription,description,mainImage{...,asset->{_id,url}},gallery[]{...,asset->{_id,url}},saleVariants,vatIncluded,isActive,isFeatured,sortOrder,seo,translations' + ownerFields + '}'
  try {
    const product = await sanityQuery<PlantDocument | null>(env, query)
    if (!product) return json({ error: 'Растението не е намерено.' }, 404)
    return json({ product })
  } catch {
    return json({ error: 'Не успяхме да заредим растението.' }, 502)
  }
}

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: ManagerEnv; params: { id: string } }) => {
  if (!env.DB || !env.SANITY_API_TOKEN) return json({ error: 'Plant catalogue service is not configured.' }, 503)
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Insufficient permissions.' }, 403)
  const id = cleanText(params.id, 128)
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(id) || id.startsWith('drafts.')) return errorJson('Invalid product ID.', 400)
  const body = await parseJsonBody(request)
  if (!body || !uuid.test(String(body.idempotencyKey || '')) || !body.product || typeof body.expectedRevision !== 'string') {
    return errorJson('Invalid product update request.', 400)
  }
  if (!await verifyPlantAiProof(request, body.aiProof, body.product)) return errorJson('Първо натиснете „Попълни с ИИ“ и проверете предложените данни.', 403)
  const idempotencyKey = String(body.idempotencyKey)
  let requestId = newId()
  let productName = ''
  let changedFields: string[] = []
  let before: unknown = null
  let after: unknown = null
  let action: 'update'|'deactivate'|'reactivate' = 'update'
  let auditStarted = false
  let mutationSucceeded = false

  try {
    const prior = await env.DB.prepare("SELECT product_id, request_id, product_name, action, changed_fields, before_data FROM manager_product_audit WHERE idempotency_key=? AND phase='started' LIMIT 1")
      .bind(idempotencyKey).first<{ product_id: string; request_id: string; product_name: string; action: string; changed_fields: string; before_data: string | null }>()
    if (prior && prior.product_id !== id) return errorJson('Idempotency key is already used for another product.', 409)
    if (prior) requestId = prior.request_id
    const completed = await env.DB.prepare("SELECT result FROM manager_product_audit WHERE idempotency_key=? AND phase='result' LIMIT 1")
      .bind(idempotencyKey).first<{ result: string }>()
    if (completed?.result === 'success') {
      const current = await sanityQuery<{_rev:string}|null>(env,'*[_type=="product" && _id=='+jsonString(id)+'][0]{_rev}')
      return json({ ok: true, revision: current?._rev || null, replayed: true })
    }
    if (completed) return errorJson('Тази операция вече е приключила с грешка. Обновете продуктът и започнете ново запазване.', 409)

    const current = await sanityQuery<PlantDocument | null>(env, '*[_type=="product" && _id==' + jsonString(id) + '][0]')
    if (!current) return json({ error: 'Растението не е намерено.' }, 404)
    const normalized = await buildPlantSet(env, body.product, auth.user.role, current, false)
    changedFields = normalized.changedFields
    if (!changedFields.length) return errorJson('Няма промени за запазване.', 400)
    productName = cleanText(normalized.set.name || current.name, 160)
    before = prior?.before_data ? JSON.parse(prior.before_data) : auditSnapshot(current)
    const nextActive = typeof normalized.set.isActive === 'boolean' ? normalized.set.isActive : current.isActive !== false
    action = current.isActive === false && nextActive ? 'reactivate' : current.isActive !== false && !nextActive ? 'deactivate' : 'update'
    if (prior && current._rev !== body.expectedRevision) {
      const alreadyApplied = Object.entries(normalized.set).every(([key,value]) => JSON.stringify((current as Record<string,unknown>)[key]) === JSON.stringify(value))
      if (alreadyApplied) {
        after = auditSnapshot(current)
        await writeAudit(env,auth.user,{requestId,idempotencyKey,phase:'result',productId:id,productName,action:prior.action as 'update'|'deactivate'|'reactivate',changedFields:prior.changed_fields ? JSON.parse(prior.changed_fields) : changedFields,before,after,result:'success'})
        return json({ok:true,documentId:id,revision:current._rev,requestId,replayed:true})
      }
      return json({error:'Растението е променено от друг служител. Обновете продуктът и приложете промените отново.',conflict:true},409)
    }
    if (current._rev !== body.expectedRevision) return json({ error: 'Растението е променено от друг служител. Обновете продуктът преди запазване.', conflict: true }, 409)
    if (normalized.set.slug && (normalized.set.slug as {current:string}).current !== current.slug?.current) {
      const slug = (normalized.set.slug as {current:string}).current
      const duplicate = await sanityQuery<string|null>(env,'*[_type=="product" && slug.current=='+jsonString(slug)+' && _id!='+jsonString(id)+' && _id!='+jsonString('drafts.'+id)+'][0]._id')
      if (duplicate) return errorJson('Този URL адрес вече се използва от друго растение.', 409)
    }
    if (!prior) {
      await writeAudit(env,auth.user,{requestId,idempotencyKey,phase:'started',productId:id,productName,action,changedFields,before,after:null,result:'started'})
    }
    auditStarted = true
    try {
      await sanityMutate(env,[{patch:{id,ifRevisionID:current._rev,set:normalized.set}}])
      mutationSucceeded = true
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('SANITY_MUTATION_FAILED_409')) {
        throw new Error('REVISION_CONFLICT')
      }
      throw error
    }
    const saved = await sanityQuery<PlantDocument|null>(env,'*[_type=="product" && _id=='+jsonString(id)+'][0]{_id,_rev,name,slug,sku,category,isActive,saleVariants}')
    if (!saved?._rev) throw new Error('SANITY_VERIFY_FAILED')
    after = auditSnapshot(saved)
    await writeAudit(env,auth.user,{requestId,idempotencyKey,phase:'result',productId:id,productName,action,changedFields,before,after,result:'success'})
    return json({ok:true,documentId:id,revision:saved._rev,requestId})
  } catch (error) {
    if (error instanceof Error && error.message === 'REVISION_CONFLICT') {
      if (auditStarted) {
        try {
          await writeAudit(env,auth.user,{requestId,idempotencyKey,phase:'result',productId:id,productName,action,changedFields,before,after:null,result:'failed',errorCode:'revision_conflict'})
        } catch {
          return json({error:'Конфликтът е засечен, но историята не успя да запише резултата. Запазете номера на операцията.',requestId,auditPending:true},503)
        }
      }
      return json({error:'Растението е променено от друг служител. Обновете продуктът и приложете промените отново.',conflict:true},409)
    }
    const code = safeFailureCode(error)
    if (auditStarted && mutationSucceeded) {
      console.error('[manager-plant-update-audit]',{requestId,code:'audit_success_write_pending'})
      return json({error:'Промяната може да е записана, но историята не потвърди резултата. Запазете номера на операцията и повторете същата операция без промени.',requestId,auditPending:true},503)
    }
    if (auditStarted) {
      try {
        await writeAudit(env,auth.user,{requestId,idempotencyKey,phase:'result',productId:id,productName,action,changedFields,before,after,result:'failed',errorCode:code})
      } catch {
        console.error('[manager-plant-update-audit]',{requestId,code:'audit_result_write_failed'})
        return json({error:'Не можем да потвърдим резултата в историята. Запазете номера на операцията.',requestId,auditPending:true},500)
      }
    }
    console.error('[manager-plant-update]',{requestId,code})
    return json({error:error instanceof Error?error.message:'Не успяхме да запазим растението.',requestId},500)
  }
}
