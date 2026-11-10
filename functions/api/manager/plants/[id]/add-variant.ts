import { checkSameOrigin, json, newId, requireUser, type ManagerEnv } from '../../_lib'
import { appendPlantGalleryImage, appendPlantSaleVariant } from '../../plant-duplicate-lib'
import {
  auditSnapshot, cleanText, errorJson, isObject, parseJsonBody, requirePlantRole,
  safeFailureCode, sanityMutate, sanityQuery, verifyPlantAiProof, writeAudit,
} from '../../plant-direct-lib'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i
const jsonString = (value: string) => JSON.stringify(value)
const assetPattern = /^image-[A-Za-z0-9-]+$/
const variantKeyPattern = /^[A-Za-z0-9_-]{8,80}$/

export const onRequestPost = async ({ request, env, params }: { request: Request; env: ManagerEnv; params: { id: string } }) => {
  if (!env.DB || !env.SANITY_API_TOKEN) return json({ error: 'Plant catalogue service is not configured.' }, 503)
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!requirePlantRole(auth.user)) return json({ error: 'Insufficient permissions.' }, 403)

  const id = cleanText(params.id, 128)
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(id) || id.startsWith('drafts.')) return errorJson('Invalid product ID.', 400)
  const body = await parseJsonBody(request)
  if (!body || !uuid.test(String(body.idempotencyKey || '')) || typeof body.expectedRevision !== 'string' || !isObject(body.variant) || !isObject(body.image)) {
    return errorJson('Invalid add-variant request.', 400)
  }

  const proofAssetId = cleanText(body.proofImageAssetId, 160)
  const imageAssetId = cleanText(body.image.assetId, 160)
  if (!assetPattern.test(proofAssetId) || imageAssetId !== proofAssetId || !await verifyPlantAiProof(request, body.aiProof, { mainImage: { assetId: proofAssetId } })) {
    return errorJson('Първо проверете снимката с Google и опитайте отново.', 403)
  }

  const variantName = cleanText(body.variant.name, 100)
  const priceEUR = Number(body.variant.priceEUR)
  const variantKey = cleanText(body.variant._key, 80)
  if (variantName.length < 2 || !variantKeyPattern.test(variantKey) || !Number.isFinite(priceEUR) || priceEUR <= 0 || priceEUR > 10000000) {
    return errorJson('Въведете валиден размер и цена в EUR.', 400)
  }

  const idempotencyKey = String(body.idempotencyKey)
  const requestId = newId()
  let operationId = requestId
  let productName = ''
  let changedFields = ['saleVariants']
  let before: unknown = null
  let after: unknown = null
  let auditStarted = false
  let mutationSucceeded = false

  try {
    const prior = await env.DB.prepare("SELECT product_id, request_id, product_name, action, changed_fields, before_data FROM manager_product_audit WHERE idempotency_key=? AND phase='started' LIMIT 1")
      .bind(idempotencyKey).first<{ product_id: string; request_id: string; product_name: string; action: string; changed_fields: string; before_data: string | null }>()
    if (prior && prior.product_id !== id) return errorJson('Idempotency key is already used for another product.', 409)
    if (prior) operationId = prior.request_id

    const completed = await env.DB.prepare("SELECT result FROM manager_product_audit WHERE idempotency_key=? AND phase='result' LIMIT 1")
      .bind(idempotencyKey).first<{ result: string }>()
    if (completed?.result === 'success') {
      const current = await sanityQuery<Record<string, any> | null>(env, '*[_type=="product" && _id==' + jsonString(id) + '][0]{_rev,mainImage{asset->{_id}},gallery[]{asset->{_id}}}')
      const replayMainId = cleanText(current?.mainImage?.asset?._id, 160)
      const replayGalleryHasImage = Array.isArray(current?.gallery) && current.gallery.some((item: any) => cleanText(item?.asset?._id, 160) === imageAssetId)
      return json({ ok: true, documentId: id, revision: current?._rev || null, replayed: true, imageAdded: false, imageAlreadyPresent: replayMainId === imageAssetId || replayGalleryHasImage })
    }
    if (completed) return errorJson('Тази операция вече е приключила с грешка. Обновете карточката и опитайте отново.', 409)

    const current = await sanityQuery<Record<string, any> | null>(env, '*[_type=="product" && _id==' + jsonString(id) + '][0]')
    if (!current) return json({ error: 'Растението не е намерено.' }, 404)
    productName = cleanText(current.name, 160)
    const variants = Array.isArray(current.saleVariants) ? current.saleVariants : []
    const currentGallery = Array.isArray(current.gallery) ? current.gallery : []
    const mainAssetId = cleanText(current.mainImage?.asset?._ref || current.mainImage?.asset?._id, 160)
    const galleryHasImage = currentGallery.some((item: any) => cleanText(item?.asset?._ref || item?.asset?._id, 160) === imageAssetId)
    const mainHasImage = mainAssetId === imageAssetId
    const alreadyHasVariant = variants.some((item: any) => item?._key === variantKey)

    if (prior && alreadyHasVariant && (galleryHasImage || mainHasImage || currentGallery.length + (mainAssetId ? 1 : 0) >= 10)) {
      before = prior.before_data ? JSON.parse(prior.before_data) : null
      after = auditSnapshot(current)
      await writeAudit(env, auth.user, {
        requestId: operationId, idempotencyKey, phase: 'result', productId: id, productName,
        action: 'update', changedFields: prior.changed_fields ? JSON.parse(prior.changed_fields) : changedFields,
        before, after, result: 'success',
      })
      return json({ ok: true, documentId: id, revision: current._rev, replayed: true, imageAdded: galleryHasImage, imageAlreadyPresent: mainHasImage || galleryHasImage })
    }

    if (current._rev !== body.expectedRevision) return json({ error: 'Карточката е променена от друг служител. Отворете я отново и опитайте пак.', conflict: true }, 409)
    if (variants.length >= 30) return errorJson('Карточката вече съдържа максималните 30 размера.', 409)

    const asset = await sanityQuery<string | null>(env, '*[_type=="sanity.imageAsset" && _id==' + jsonString(imageAssetId) + '][0]._id')
    if (!asset) return errorJson('Снимката не е намерена в Sanity. Качете я отново.', 400)

    const nextVariants = appendPlantSaleVariant(variants, { key: variantKey, name: variantName, priceEUR })
    const galleryResult = appendPlantGalleryImage(mainAssetId, currentGallery, {
      assetId: imageAssetId,
      alt: cleanText(body.image.alt, 240),
      altEn: cleanText(body.image.altEn, 240),
      altRu: cleanText(body.image.altRu, 240),
      key: 'image-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    })
    const imageAdded = galleryResult.imageAdded
    const imageAlreadyPresent = galleryResult.imageAlreadyPresent
    const set: Record<string, unknown> = { saleVariants: nextVariants }
    if (imageAdded) {
      set.gallery = galleryResult.gallery
      changedFields.push('gallery')
    }

    const beforeSnapshot = auditSnapshot(current)
    before = prior?.before_data ? JSON.parse(prior.before_data) : beforeSnapshot
    if (prior && current._rev !== body.expectedRevision) return json({ error: 'Карточката е променена от друг служител. Отворете я отново и опитайте пак.', conflict: true }, 409)

    if (!prior) {
      await writeAudit(env, auth.user, {
        requestId: operationId, idempotencyKey, phase: 'started', productId: id, productName,
        action: 'update', changedFields, before, after: null, result: 'started',
      })
    }
    auditStarted = true

    try {
      await sanityMutate(env, [{ patch: { id, ifRevisionID: current._rev, set } }])
      mutationSucceeded = true
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('SANITY_MUTATION_FAILED_409')) throw new Error('REVISION_CONFLICT')
      throw error
    }

    const saved = await sanityQuery<Record<string, any> | null>(env, '*[_type=="product" && _id==' + jsonString(id) + '][0]')
    if (!saved?._rev) throw new Error('SANITY_VERIFY_FAILED')
    after = auditSnapshot(saved)
    await writeAudit(env, auth.user, {
      requestId: operationId, idempotencyKey, phase: 'result', productId: id, productName,
      action: 'update', changedFields, before, after, result: 'success',
    })
    return json({ ok: true, documentId: id, revision: saved._rev, imageAdded, imageAlreadyPresent })
  } catch (error) {
    if (error instanceof Error && error.message === 'REVISION_CONFLICT') {
      if (auditStarted) {
        try {
          await writeAudit(env, auth.user, {
            requestId: operationId, idempotencyKey, phase: 'result', productId: id, productName,
            action: 'update', changedFields, before, after: null, result: 'failed', errorCode: 'revision_conflict',
          })
        } catch {
          return json({ error: 'Конфликтът е засечен, но историята не успя да запише резултата. Запазете номера на операцията.', requestId: operationId, auditPending: true }, 503)
        }
      }
      return json({ error: 'Карточката е променена от друг служител. Отворете я отново и опитайте пак.', conflict: true }, 409)
    }
    const code = safeFailureCode(error)
    if (auditStarted && mutationSucceeded) {
      console.error('[manager-plant-add-variant-audit]', { requestId: operationId, code: 'audit_success_write_pending' })
      return json({ error: 'Размерът може да е добавен, но историята не потвърди резултата. Запазете номера на операцията и повторете същата операция без промени.', requestId: operationId, auditPending: true }, 503)
    }
    if (auditStarted) {
      try {
        await writeAudit(env, auth.user, {
          requestId: operationId, idempotencyKey, phase: 'result', productId: id, productName,
          action: 'update', changedFields, before, after, result: 'failed', errorCode: code,
        })
      } catch {
        return json({ error: 'Не можем да потвърдим резултата в историята. Запазете номера на операцията.', requestId: operationId, auditPending: true }, 500)
      }
    }
    console.error('[manager-plant-add-variant]', { requestId: operationId, code })
    return json({ error: error instanceof Error ? error.message : 'Не успяхме да добавим размера.', requestId: operationId }, 500)
  }
}
