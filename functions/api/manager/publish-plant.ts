import { createClient } from '@sanity/client'

type Env = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SANITY_API_TOKEN?: string
}

type IntakeImage = { path: string; name: string; size: number; type: string }
type SubmissionRow = {
  id: string
  catalog: string
  operation: string
  status: string
  created_by: string
  payload: Record<string, unknown>
  idempotency_key: string
}
type SaleVariant = {
  name: string
  saleHeightCm: number | null
  containerVolumeL: number | null
  priceEUR: number | null
  stockStatus: 'inStock' | 'onRequest' | 'outOfStock'
  stockQuantity: number | null
}
type Publication = {
  name: string
  slug: string
  scientificName: string
  productType: string
  categoryId: string
  categoryName: string
  sku: string
  shortDescription: string
  description: string
  mainImageIndex: number
  imageAlts: string[]
  saleVariants: SaleVariant[]
  translations: Record<string, Record<string, string>>
  isFeatured: boolean
  seo: { title: string; description: string }
  sanityDocumentId?: string
  sanityAssetIds?: string[]
}

const bucket = 'florial-manager-intake'
const productTypes = new Set([
  'plant', 'tree', 'shrub', 'flower', 'perennial', 'indoor', 'citrus', 'palm', 'conifer',
  'fruit', 'succulent', 'climber', 'ornamentalGrass', 'groundcover', 'bulb', 'herb', 'aquatic', 'other',
])
const stockStatuses = new Set(['inStock', 'onRequest', 'outOfStock'])
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const parseObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null

const parseNumber = (value: unknown, label: string, minimum: number, integer = false): number | null => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < minimum || (integer && !Number.isInteger(number))) {
    throw new Error('Проверете стойността на полето „' + label + '“.')
  }
  return number
}

const safeFilename = (value: string, index: number) =>
  (value.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80) || 'plant-image-' + (index + 1) + '.jpg')

function validatePublication(input: unknown, images: IntakeImage[]): Publication {
  const source = parseObject(input)
  if (!source) throw new Error('Липсват данни за финалната карточка.')

  const name = cleanText(source.name, 160)
  const slug = cleanText(source.slug, 96)
  const productType = cleanText(source.productType, 40)
  const categoryId = cleanText(source.categoryId, 128)
  if (name.length < 2) throw new Error('Въведете име на растението.')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Невалиден URL адрес (slug).')
  if (!productTypes.has(productType)) throw new Error('Изберете валиден тип на растението.')
  if (!categoryId || !/^[a-zA-Z0-9_-]+$/.test(categoryId)) throw new Error('Изберете категория от каталога.')
  if (images.length < 1 || images.length > 8) throw new Error('За публикуване са необходими от 1 до 8 снимки.')
  if (images.some((image) => !image || typeof image.path !== 'string' || !image.name ||
      !imageTypes.has(image.type) || !Number.isFinite(image.size) || image.size <= 0 || image.size > 10 * 1024 * 1024)) {
    throw new Error('Една или повече снимки не отговарят на изискванията за формат или размер.')
  }

  const mainImageIndex = Number(source.mainImageIndex)
  if (!Number.isInteger(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= images.length) {
    throw new Error('Изберете основна снимка.')
  }
  const imageAlts = Array.isArray(source.imageAlts)
    ? source.imageAlts.slice(0, images.length).map((item) => cleanText(item, 240))
    : []
  while (imageAlts.length < images.length) imageAlts.push(name)

  const variantsInput = Array.isArray(source.saleVariants) ? source.saleVariants : []
  if (variantsInput.length !== 1) throw new Error('В тази версия е необходимо да има точно един вариант за продажба.')
  const variantSource = parseObject(variantsInput[0])
  if (!variantSource) throw new Error('Невалиден вариант за продажба.')
  const variantName = cleanText(variantSource.name, 100)
  if (variantName.length < 2) throw new Error('Въведете име на варианта за продажба.')
  const stockStatus = cleanText(variantSource.stockStatus, 30)
  if (!stockStatuses.has(stockStatus)) throw new Error('Изберете валиден статус на наличност.')
  const priceEUR = parseNumber(variantSource.priceEUR, 'Цена EUR', 0.01)
  const stockQuantity = parseNumber(variantSource.stockQuantity, 'Количество', 0, true)
  if (stockStatus === 'inStock' && (priceEUR === null || stockQuantity === null || stockQuantity < 1)) {
    throw new Error('За наличен продукт въведете цена и количество поне 1.')
  }

  const translations: Record<string, Record<string, string>> = {}
  for (const language of ['bg', 'en', 'ru']) {
    const translation = parseObject(parseObject(source.translations)?.[language])
    if (!translation) continue
    const fields = {
      name: cleanText(translation.name, 160),
      shortDescription: cleanText(translation.shortDescription, 500),
      description: cleanText(translation.description, 5000),
    }
    if (language === 'bg' || Object.values(fields).some(Boolean)) translations[language] = fields
  }
  translations.bg = {
    name,
    shortDescription: cleanText(source.shortDescription, 500),
    description: cleanText(source.description, 5000),
  }

  const seoSource = parseObject(source.seo) || {}
  return {
    name,
    slug,
    scientificName: cleanText(source.scientificName, 160),
    productType,
    categoryId,
    categoryName: cleanText(source.categoryName, 120),
    sku: cleanText(source.sku, 100),
    shortDescription: cleanText(source.shortDescription, 500),
    description: cleanText(source.description, 5000),
    mainImageIndex,
    imageAlts,
    saleVariants: [{
      name: variantName,
      saleHeightCm: parseNumber(variantSource.saleHeightCm, 'Височина', 0),
      containerVolumeL: parseNumber(variantSource.containerVolumeL, 'Обем на контейнера', 0.1),
      priceEUR,
      stockStatus: stockStatus as SaleVariant['stockStatus'],
      stockQuantity,
    }],
    translations,
    isFeatured: source.isFeatured === true,
    seo: {
      title: cleanText(seoSource.title, 160),
      description: cleanText(seoSource.description, 320),
    },
  }
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin) {
    try {
      if (new URL(origin).origin !== requestUrl.origin) return json({ error: 'Origin not allowed.' }, 403)
    } catch {
      return json({ error: 'Invalid origin.' }, 403)
    }
  }
  if (Number(request.headers.get('Content-Length') || 0) > 30000) return json({ error: 'Request is too large.' }, 413)

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Manager publishing service is not configured.' }, 503)

  const authorization = request.headers.get('Authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) return json({ error: 'Authentication required.' }, 401)

  const base = SUPABASE_URL.replace(/\/+$/, '')
  const authHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + accessToken,
  }
  const adminHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  }

  const userResponse = await fetch(base + '/auth/v1/user', { headers: authHeaders })
  if (!userResponse.ok) return json({ error: 'Invalid or expired session.' }, 401)
  const caller = await userResponse.json() as { id?: string }
  if (!caller.id) return json({ error: 'Invalid session.' }, 401)

  const profileResponse = await fetch(
    base + '/rest/v1/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(caller.id) + '&select=role,is_active',
    { headers: adminHeaders },
  )
  if (!profileResponse.ok) return json({ error: 'Unable to verify owner permissions.' }, 503)
  const profiles = await profileResponse.json() as Array<{ role: string; is_active: boolean }>
  if (profiles[0]?.role !== 'owner' || profiles[0]?.is_active !== true) return json({ error: 'Owner access required.' }, 403)

  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    const object = parseObject(parsed)
    if (!object) return json({ error: 'Invalid request body.' }, 400)
    body = object
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const action = body.action
  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
    return json({ error: 'Invalid submission ID.' }, 400)
  }
  if (action !== 'save' && action !== 'publish') return json({ error: 'Unknown action.' }, 400)

  const submissionResponse = await fetch(
    base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) +
      '&select=id,catalog,operation,status,created_by,payload,idempotency_key',
    { headers: adminHeaders },
  )
  if (!submissionResponse.ok) return json({ error: 'Unable to load submission.' }, 502)
  const submissions = await submissionResponse.json() as SubmissionRow[]
  const submission = submissions[0]
  if (!submission || submission.catalog !== 'plants' || submission.operation !== 'create') {
    return json({ error: 'Plant submission not found.' }, 404)
  }
  if (!['approved', 'publish_failed', 'published'].includes(submission.status)) {
    return json({ error: 'Only an approved plant submission can be prepared or published.' }, 409)
  }

  const payload = parseObject(submission.payload) || {}
  const images = Array.isArray(payload.images) ? payload.images as IntakeImage[] : []
  if (images.some((image) => !image || typeof image.path !== 'string' || !image.path.startsWith(submission.created_by + '/' + submissionId + '/'))) {
    return json({ error: 'A photo path does not belong to this submission.' }, 400)
  }

  if (action === 'save') {
    if (submission.status === 'published') return json({ error: 'This plant has already been published.' }, 409)
    let publication: Publication
    try {
      publication = validatePublication(body.publication, images)
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Invalid publication data.' }, 400)
    }
    const oldPublication = parseObject(payload.publication) || {}
    publication.sanityDocumentId = typeof oldPublication.sanityDocumentId === 'string' ? oldPublication.sanityDocumentId : undefined
    publication.sanityAssetIds = Array.isArray(oldPublication.sanityAssetIds)
      ? oldPublication.sanityAssetIds.filter((item): item is string => typeof item === 'string')
      : undefined
    const nextPayload = { ...payload, publication }
    const saveResponse = await fetch(
      base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status),
      {
        method: 'PATCH',
        headers: { ...adminHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
      },
    )
    if (!saveResponse.ok) return json({ error: 'Не успяхме да запазим финалната версия.' }, 502)
    const savedRows = await saveResponse.json() as Array<{ id: string }>
    if (!savedRows.length) return json({ error: 'Заявката се промени. Обновете екрана и опитайте отново.' }, 409)
    await fetch(base + '/rest/v1/catalog_submission_events', {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        submission_id: submissionId,
        actor_id: caller.id,
        event_type: 'publication_prepared',
        from_status: submission.status,
        to_status: submission.status,
        note: 'Власникът запази финалната версия на карточката.',
        metadata: { categoryId: publication.categoryId, slug: publication.slug },
      }),
    })
    return json({ ok: true, saved: true })
  }

  if (submission.status === 'published') {
    const published = parseObject(payload.publication)
    return json({ ok: true, alreadyPublished: true, documentId: published?.sanityDocumentId || null })
  }
  if (!env.SANITY_API_TOKEN) return json({ error: 'Липсва SANITY_API_TOKEN в Cloudflare Production. Добавете го като Secret, за да активирате публикуването.' }, 503)

  const lockResponse = await fetch(
    base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status),
    {
      method: 'PATCH',
      headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'publishing', publish_error: null, updated_at: new Date().toISOString() }),
    },
  )
  if (!lockResponse.ok) return json({ error: 'Не успяхме да започнем публикуването.' }, 502)
  const lockedRows = await lockResponse.json() as Array<{ id: string }>
  if (!lockedRows.length) return json({ error: 'Заявката вече се обработва. Обновете екрана.' }, 409)

  await fetch(base + '/rest/v1/catalog_submission_events', {
    method: 'POST',
    headers: { ...adminHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      submission_id: submissionId, actor_id: caller.id, event_type: 'publication_started',
      from_status: submission.status, to_status: 'publishing', note: 'Започна публикуване в Sanity.',
    }),
  })

  let publication = parseObject(payload.publication) as Publication | null
  try {
    if (!publication) throw new Error('Първо запазете финалната версия на карточката.')
    publication = validatePublication(publication, images)
    const documentId = typeof (payload.publication as Record<string, unknown>).sanityDocumentId === 'string'
      ? String((payload.publication as Record<string, unknown>).sanityDocumentId)
      : 'plant-' + crypto.randomUUID()
    const assetIds = Array.isArray((payload.publication as Record<string, unknown>).sanityAssetIds)
      ? ((payload.publication as Record<string, unknown>).sanityAssetIds as unknown[]).filter((item): item is string => typeof item === 'string')
      : []
    publication.sanityDocumentId = documentId
    publication.sanityAssetIds = assetIds

    const sanity = createClient({
      projectId: 'bxvcy0qs',
      dataset: 'plants',
      apiVersion: '2025-01-01',
      token: env.SANITY_API_TOKEN,
      useCdn: false,
    })

    const persistPublication = async () => {
      const nextPayload = { ...payload, publication }
      const response = await fetch(base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId), {
        method: 'PATCH',
        headers: { ...adminHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Не успяхме да запазим техническите данни за публикацията.')
    }
    await persistPublication()

    const category = await sanity.fetch(
      '*[_type == "category" && _id == $categoryId][0]{_id,name,parent->{_id,name,parent->{_id,name,parent->{_id,name}}}}',
      { categoryId: publication.categoryId },
    ) as { _id?: string; name?: string; parent?: { _id?: string; name?: string; parent?: unknown } } | null
    if (!category?._id || category._id === 'plants-root') throw new Error('Избраната категория не съществува или не може да се използва за растение.')
    publication.categoryName = cleanText(category.name, 120)
    await persistPublication()

    const slugCount = await sanity.fetch(
      'count(*[_type == "product" && slug.current == $slug && _id != $documentId])',
      { slug: publication.slug, documentId },
    ) as number
    if (slugCount > 0) throw new Error('Вече съществува растение с URL адрес „' + publication.slug + '“. Изберете друг slug.')

    const categoryRefs: Array<{ _type: 'reference'; _ref: string }> = []
    let categoryNode: { _id?: string; parent?: unknown } | null = category
    const seenCategories = new Set<string>()
    while (categoryNode?._id && !seenCategories.has(categoryNode._id)) {
      seenCategories.add(categoryNode._id)
      categoryRefs.push({ _type: 'reference', _ref: categoryNode._id })
      categoryNode = parseObject(categoryNode.parent) as { _id?: string; parent?: unknown } | null
    }
    if (!categoryRefs.some((reference) => reference._ref === 'plants-root')) {
      categoryRefs.push({ _type: 'reference', _ref: 'plants-root' })
    }

    for (let index = 0; index < images.length; index += 1) {
      if (publication.sanityAssetIds[index]) continue
      const storagePath = images[index].path.split('/').map((part) => encodeURIComponent(part)).join('/')
      const download = await fetch(base + '/storage/v1/object/' + bucket + '/' + storagePath, {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY },
      })
      if (!download.ok) throw new Error('Не удалось получить снимка ' + (index + 1) + ' от затвореното хранилище.')
      const contentType = (download.headers.get('content-type') || images[index].type).split(';')[0].trim().toLowerCase()
      if (!imageTypes.has(contentType)) throw new Error('Снимка ' + (index + 1) + ' е в неподдържан формат.')
      const blob = await download.blob()
      if (blob.size <= 0 || blob.size > 10 * 1024 * 1024) throw new Error('Снимка ' + (index + 1) + ' е празна или надвишава 10 MB.')
      const asset = await sanity.assets.upload('image', blob, {
        filename: safeFilename(images[index].name, index),
        contentType,
      })
      publication.sanityAssetIds[index] = asset._id
      await persistPublication()
    }

    const imageDocuments = publication.sanityAssetIds.map((assetId, index) => ({
      _type: 'image',
      _key: 'intake-image-' + index,
      asset: { _type: 'reference', _ref: assetId },
      alt: publication.imageAlts[index] || publication.name,
    }))
    const mainImage = imageDocuments[publication.mainImageIndex]
    const gallery = imageDocuments.filter((_image, index) => index !== publication.mainImageIndex)
    const variant = publication.saleVariants[0]
    const variantDocument: Record<string, unknown> = {
      _type: 'plantSaleVariant',
      _key: 'intake-variant',
      name: variant.name,
      stockStatus: variant.stockStatus,
    }
    if (publication.translations.en?.name) variantDocument.nameEn = publication.translations.en.name
    if (publication.translations.ru?.name) variantDocument.nameRu = publication.translations.ru.name
    if (publication.sku) variantDocument.sku = publication.sku
    if (variant.saleHeightCm !== null) variantDocument.saleHeightCm = variant.saleHeightCm
    if (variant.containerVolumeL !== null) variantDocument.containerVolumeL = variant.containerVolumeL
    if (variant.priceEUR !== null) variantDocument.priceEUR = variant.priceEUR
    if (variant.stockQuantity !== null) variantDocument.stockQuantity = variant.stockQuantity

    const document: Record<string, unknown> = {
      _type: 'product',
      name: publication.name,
      slug: { _type: 'slug', current: publication.slug },
      productType: publication.productType,
      category: { _type: 'reference', _ref: category._id },
      categories: categoryRefs,
      mainImage,
      gallery,
      saleVariants: [variantDocument],
      vatIncluded: true,
      stockStatus: variant.stockStatus,
      isFeatured: publication.isFeatured,
      isActive: true,
      translations: publication.translations,
    }
    if (publication.scientificName) document.scientificName = publication.scientificName
    if (publication.sku) document.sku = publication.sku
    if (publication.shortDescription) document.shortDescription = publication.shortDescription
    if (publication.description) document.description = publication.description
    if (variant.priceEUR !== null) document.priceEUR = variant.priceEUR
    if (variant.stockQuantity !== null) document.stockQuantity = variant.stockQuantity
    if (publication.seo.title || publication.seo.description) {
      document.seo = { title: publication.seo.title, description: publication.seo.description }
    }

    const existing = await sanity.getDocument(documentId)
    const { _type: documentType, ...documentFields } = document
    if (existing) await sanity.patch(documentId).set(documentFields).commit()
    else await sanity.create({ _id: documentId, _type: documentType, ...documentFields })

    const published = await sanity.getDocument(documentId) as Record<string, unknown> | null
    const publishedMainImage = parseObject(published?.mainImage)
    const publishedAsset = parseObject(publishedMainImage?.asset)
    const publishedCategory = parseObject(published?.category)
    const publishedSlug = parseObject(published?.slug)
    if (!published || published._type !== 'product' || published.name !== publication.name ||
        publishedSlug?.current !== publication.slug || publishedCategory?._ref !== category._id ||
        !publishedAsset?._ref || !Array.isArray(published.saleVariants) || published.saleVariants.length !== 1) {
      throw new Error('Sanity не потвърди всички основни полета на публикуваното растение.')
    }

    const finalPayload = { ...payload, publication }
    const finishResponse = await fetch(base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.publishing', {
      method: 'PATCH',
      headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'published',
        published_at: new Date().toISOString(),
        publish_error: null,
        payload: finalPayload,
        updated_at: new Date().toISOString(),
      }),
    })
    if (!finishResponse.ok) throw new Error('Растението е записано в Sanity, но статусът на заявката не беше обновен.')
    const finishedRows = await finishResponse.json() as Array<{ id: string }>
    if (!finishedRows.length) throw new Error('Растението е записано в Sanity, но заявката вече не е в очаквания статус.')

    await fetch(base + '/rest/v1/catalog_submission_events', {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        submission_id: submissionId, actor_id: caller.id, event_type: 'published',
        from_status: 'publishing', to_status: 'published',
        note: 'Растението е публикувано и проверено в Sanity.',
        metadata: { documentId, dataset: 'plants', slug: publication.slug },
      }),
    })
    return json({ ok: true, published: true, documentId })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 400) : 'Неизвестна грешка при публикуване.'
    await fetch(base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.publishing', {
      method: 'PATCH',
      headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'publish_failed', publish_error: message, updated_at: new Date().toISOString() }),
    })
    await fetch(base + '/rest/v1/catalog_submission_events', {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        submission_id: submissionId, actor_id: caller.id, event_type: 'publication_failed',
        from_status: 'publishing', to_status: 'publish_failed', note: message,
      }),
    })
    return json({ error: message }, 502)
  }
}
