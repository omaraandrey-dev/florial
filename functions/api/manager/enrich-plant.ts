type Env = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }
}

type IntakeImage = { path: string; name: string; size: number; type: string }
type SubmissionRow = {
  id: string; catalog: string; operation: string; status: string; created_by: string
  payload: Record<string, unknown>
}

const bucket = 'florial-manager-intake'
const model = '@cf/meta/llama-3.2-11b-vision-instruct'
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})
const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const textValue = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
type AiStage = 'validate' | 'download_image' | 'analyze_image' | 'parse_image_result' | 'generate_text' | 'parse_text_result' | 'save_draft'
const stageLabels: Record<AiStage, string> = {
  validate: 'Проверка заявки и доступа',
  download_image: 'Загрузка фотографии из хранилища',
  analyze_image: 'Анализ фотографии моделью AI',
  parse_image_result: 'Разбор ответа AI по фотографии',
  generate_text: 'Генерация текстов и характеристик',
  parse_text_result: 'Проверка и разбор текстового ответа AI',
  save_draft: 'Сохранение AI-черновика в заявке',
}
function errorDetails(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 700)
  try { return JSON.stringify(error).slice(0, 700) } catch { return String(error).slice(0, 700) }
}
function classifyAiError(message: string) {
  const lower = message.toLowerCase()
  if (/license|licence|accept.*(term|policy)|prompt.*agree|llama.*agree/.test(lower)) {
    return { code: 'MODEL_LICENSE_REQUIRED', hint: 'Cloudflare сообщает, что для этой модели необходимо принять лицензию Meta. Генерация остановлена; бесплатная квота не является причиной этой ошибки.' }
  }
  if (/neurons|daily.*limit|quota|exceeded.*limit|too many requests|429/.test(lower)) {
    return { code: 'AI_QUOTA_OR_RATE_LIMIT', hint: 'Модель отклонила запрос из-за лимита или ограничения частоты. Проверьте Usage в Workers AI.' }
  }
  if (/binding|not configured/.test(lower)) {
    return { code: 'AI_BINDING_MISSING', hint: 'В этой среде не найдена привязка Cloudflare Workers AI.' }
  }
  return { code: 'AI_REQUEST_FAILED', hint: 'Сбой запроса к модели. Технический ответ сохранён в диагностике.' }
}

function slugify(value: string) {
  const transliteration: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
    ё: 'yo', ы: 'y', э: 'e',
  }
  return value.toLocaleLowerCase('bg-BG')
    .split('')
    .map((character) => transliteration[character] ?? character)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}
function modelText(response: unknown) {
  const result = object(response)
  const value = result?.response ?? result?.result ?? result?.output_text ?? result?.text
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value)
  throw new Error('AI model returned an empty response.')
}
function parseModelJson(response: unknown) {
  const raw = modelText(response).trim().replace(/^\uFEFF/, '')
  const clean = raw.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '')
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI model did not return valid JSON.')
  return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== requestUrl.origin) return json({ error: 'Origin not allowed.' }, 403) }
    catch { return json({ error: 'Invalid origin.' }, 403) }
  }
  if (Number(request.headers.get('Content-Length') || 0) > 10000) return json({ error: 'Request is too large.' }, 413)
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Manager service is not configured.' }, 503)
  if (!env.AI?.run) return json({ error: 'AI binding is not configured for this Cloudflare Pages environment.' }, 503)

  const authorization = request.headers.get('Authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) return json({ error: 'Authentication required.' }, 401)
  const base = env.SUPABASE_URL.replace(/\/+$/, '')
  const adminHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  }
  const userResponse = await fetch(base + '/auth/v1/user', {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + accessToken },
  })
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
    const parsed = object(await request.json())
    if (!parsed) return json({ error: 'Invalid request body.' }, 400)
    body = parsed
  } catch { return json({ error: 'Invalid request body.' }, 400) }
  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
    return json({ error: 'Invalid submission ID.' }, 400)
  }
  const submissionResponse = await fetch(
    base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) +
      '&select=id,catalog,operation,status,created_by,payload',
    { headers: adminHeaders },
  )
  if (!submissionResponse.ok) return json({ error: 'Unable to load submission.' }, 502)
  const rows = await submissionResponse.json() as SubmissionRow[]
  const submission = rows[0]
  if (!submission || submission.catalog !== 'plants' || submission.operation !== 'create') return json({ error: 'Plant submission not found.' }, 404)
  if (!['submitted', 'in_review', 'approved', 'publish_failed'].includes(submission.status)) {
    return json({ error: 'Only a plant submission under owner review can be enriched.' }, 409)
  }

  const payload = object(submission.payload) || {}
  const existingDraft = object(payload.aiDraft)
  if (existingDraft) return json({ ok: true, draft: existingDraft, reused: true })
  const reviewInput = object(body.reviewInput) || {}
  const originalVariant = (Array.isArray(payload.saleVariants) ? object(payload.saleVariants[0]) : null) || {}
  const reviewedVariant = Array.isArray(reviewInput.saleVariants) ? object(reviewInput.saleVariants[0]) : null
  const variant = reviewedVariant || originalVariant
  const images = Array.isArray(payload.images) ? payload.images as IntakeImage[] : []
  if (images.length < 1 || images.length > 8) return json({ error: 'The submission must contain between 1 and 8 photos.' }, 400)
  const prefix = submission.created_by + '/' + submissionId + '/'
  if (images.some((image) => !image || typeof image.path !== 'string' || !image.path.startsWith(prefix) ||
      !/^[0-9a-f-]{36}_[A-Za-z0-9._-]+$/.test(image.path.slice(prefix.length)) &&
      !/^[0-9a-f-]{36}-[A-Za-z0-9._-]+$/.test(image.path.slice(prefix.length)))) {
    return json({ error: 'A photo path does not belong to this submission.' }, 400)
  }

  let stage: AiStage = 'validate'
  let imageIndex = -1
  try {
    const name = textValue(reviewInput.name ?? payload.name ?? submission.title, 160)
    const latinName = textValue(reviewInput.scientificName ?? payload.latinName, 160)
    const categoryId = textValue(reviewInput.categoryId ?? payload.categoryId, 128)
    const categoryName = textValue(reviewInput.categoryName ?? payload.categoryName, 120)
    const sku = textValue(reviewInput.sku ?? payload.sku, 100)
    const sellerDescription = textValue(reviewInput.description ?? payload.description, 1200)
    const imageDescriptions: Array<{ bg: string; en: string; ru: string }> = []
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index]
      imageIndex = index
      stage = 'download_image'
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size <= 0 || image.size > 10 * 1024 * 1024) {
        throw new Error('Photo ' + (index + 1) + ' has an unsupported format or size.')
      }
      const path = image.path.split('/').map((part) => encodeURIComponent(part)).join('/')
      const download = await fetch(base + '/storage/v1/object/' + bucket + '/' + path, {
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
      })
      if (!download.ok) throw new Error('Could not read photo ' + (index + 1) + ' from private storage.')
      const contentType = (download.headers.get('content-type') || image.type).split(';')[0].trim().toLowerCase()
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error('Photo ' + (index + 1) + ' is not a supported image.')
      const bytes = new Uint8Array(await download.arrayBuffer())
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('Photo ' + (index + 1) + ' is empty or too large.')
      const dataUrl = 'data:' + contentType + ';base64,' + bytesToBase64(bytes)
      stage = 'analyze_image'
      let response: unknown
      try { response = await env.AI.run(model, {
        messages: [
          { role: 'system', content: 'Describe visible image details for accessible alt text. Do not identify a plant species. Do not invent details. Reply with one concise sentence in Bulgarian only, without JSON, labels, quotes or markdown.' },
          { role: 'user', content: 'The seller says the plant is "' + name + '"' + (latinName ? ' (' + latinName + ')' : '') +
            '. Describe only what is visibly apparent in this photo. Write one natural Bulgarian alt description, maximum 180 characters. Do not mention image number or SEO keywords.' },
        ],
        image: dataUrl,
      }) } catch (error) { throw new Error('AI_IMAGE_REQUEST: ' + errorDetails(error)) }
      stage = 'parse_image_result'
      const rawAlt = modelText(response).trim()
        .replace(/^\`\`\`(?:text|json)?\\s*/i, '')
        .replace(/\\s*\`\`\`$/, '')
        .replace(/^["'“”]+|["'“”]+$/g, '')
        .replace(/\\s+/g, ' ')
        .slice(0, 180)
      if (!rawAlt) throw new Error('AI image model returned an empty description.')
      imageDescriptions.push({
        bg: rawAlt,
        en: name + ' — plant photo',
        ru: name + ' — фотография растения',
      })
    }

    const prompt = `Prepare a draft plant product listing for Florial, a Bulgarian garden store.
Owner-checked input (authoritative commercial data): name: ${name}; botanical name: ${latinName || 'not supplied'}; category: ${categoryName}; owner description: ${sellerDescription}; SKU: ${sku || 'not supplied'}; sale variant: ${textValue(variant.name, 100)}; sale height cm: ${variant.saleHeightCm ?? 'not supplied'}; pot volume L: ${variant.containerVolumeL ?? 'not supplied'}; price EUR: ${variant.priceEUR ?? 'not supplied'}; stock status: ${textValue(variant.stockStatus, 40)}; stock quantity: ${variant.stockQuantity ?? 'not supplied'}.
Visual observations from the product photos (use only these visible details; do not infer species): ${imageDescriptions.map((item, index) => 'Photo ' + (index + 1) + ': ' + item.bg).join(' | ')}.
Rules: never change, infer or fabricate price, stock, sale size, pot volume, SKU, or category. Do not identify a species solely from photos. If the botanical identity is uncertain, keep scientificName empty and use cautious generic copy. Generate natural, commercially useful BG, RU and EN names, short descriptions (max 300 chars), and descriptions (max 1400 chars). Bulgarian is the source language. Create imageAlts, imageAltsEn and imageAltsRu arrays with one concise translation per photo, based only on the visual observations above; each item max 180 characters and preserve the same photo order. Do not claim frost hardiness, minimum winter temperature, adult height, or suitability for the Bulgarian Black Sea coast unless the fact is certain from established botanical knowledge; in this MVP always set minWinterTempC and adultHeightCm to null and blackSeaCoast to "needsVerification". Care fields may be suggested but must be marked for owner verification; if uncertain use null. Do not add irrigation product slugs.
Return only valid JSON with this shape:
{"name":"","scientificName":"","productType":"plant|tree|shrub|flower|perennial|indoor|citrus|palm|conifer|fruit|succulent|climber|ornamentalGrass|groundcover|bulb|herb|aquatic|other","shortDescription":"","description":"","translations":{"en":{"name":"","shortDescription":"","description":""},"ru":{"name":"","shortDescription":"","description":""}},"imageAlts":[],"imageAltsEn":[],"imageAltsRu":[],"seo":{"title":"","description":""},"plantCare":{"light":"sun|partialShade|shade|null","waterNeeds":"low|medium|high|null","minWinterTempC":null,"blackSeaCoast":"needsVerification","adultHeightCm":null,"foliageType":"evergreen|deciduous|null","floweringSeason":[],"plantingSeason":[]},"careGuide":""}
careGuide should be a short Bulgarian care note with cautious wording. Use only known general care; if species is uncertain, say it should be tailored after confirming the botanical name.`
    stage = 'generate_text'
    let textResponse: unknown
    try { textResponse = await env.AI.run(model, { messages: [
      { role: 'system', content: 'You are a careful horticultural product copywriter for Bulgaria. Return valid JSON only. Never invent facts or commercial data.' },
      { role: 'user', content: prompt },
    ] }) } catch (error) { throw new Error('AI_TEXT_REQUEST: ' + errorDetails(error)) }
    stage = 'parse_text_result'
    const generated = parseModelJson(textResponse)
    const care = object(generated.plantCare) || {}
    const publication = {
      name: textValue(generated.name, 160) || name,
      slug: slugify(textValue(generated.name, 160) || name) || 'plant-' + submissionId.slice(0, 8),
      scientificName: textValue(generated.scientificName, 160) || latinName,
      productType: textValue(generated.productType, 40) || 'plant',
      categoryId,
      categoryName,
      sku,
      shortDescription: textValue(generated.shortDescription, 500),
      description: textValue(generated.description, 5000),
      mainImageIndex: 0,
      imageAlts: imageDescriptions.map((item, index) => textValue((generated.imageAlts as unknown[] | undefined)?.[index], 180) || item.bg),
      imageAltsEn: imageDescriptions.map((item, index) => textValue((generated.imageAltsEn as unknown[] | undefined)?.[index], 180) || item.en),
      imageAltsRu: imageDescriptions.map((item, index) => textValue((generated.imageAltsRu as unknown[] | undefined)?.[index], 180) || item.ru),
      saleVariants: [{
        name: textValue(variant.name, 100) || 'Стандартен размер',
        saleHeightCm: typeof variant.saleHeightCm === 'number' ? variant.saleHeightCm : null,
        containerVolumeL: typeof variant.containerVolumeL === 'number' ? variant.containerVolumeL : null,
        priceEUR: typeof variant.priceEUR === 'number' ? variant.priceEUR : null,
        stockStatus: ['inStock', 'onRequest', 'outOfStock'].includes(String(variant.stockStatus)) ? variant.stockStatus : 'onRequest',
        stockQuantity: typeof variant.stockQuantity === 'number' ? variant.stockQuantity : 0,
      }],
      translations: {
        bg: { name: textValue(generated.name, 160) || name, shortDescription: textValue(generated.shortDescription, 500), description: textValue(generated.description, 5000) },
        en: object(generated.translations) && object(object(generated.translations)?.en) || {},
        ru: object(generated.translations) && object(object(generated.translations)?.ru) || {},
      },
      isFeatured: false,
      seo: { title: textValue(object(generated.seo)?.title, 160), description: textValue(object(generated.seo)?.description, 320) },
      plantCare: {
        light: ['sun', 'partialShade', 'shade'].includes(String(care.light)) ? care.light : null,
        waterNeeds: ['low', 'medium', 'high'].includes(String(care.waterNeeds)) ? care.waterNeeds : null,
        minWinterTempC: null,
        blackSeaCoast: 'needsVerification',
        adultHeightCm: null,
        foliageType: ['evergreen', 'deciduous'].includes(String(care.foliageType)) ? care.foliageType : null,
        floweringSeason: Array.isArray(care.floweringSeason) ? care.floweringSeason.filter((v) => ['spring', 'summer', 'autumn', 'winter'].includes(String(v))) : [],
        plantingSeason: Array.isArray(care.plantingSeason) ? care.plantingSeason.filter((v) => ['spring', 'summer', 'autumn', 'winter', 'yearRound'].includes(String(v))) : [],
      },
      careGuide: textValue(generated.careGuide, 4000),
      aiReviewNote: 'ИИ подготви текст и предложени грижи. Проверете ботаническата идентичност, светлината, поливането, листната маса и сезоните преди публикуване. Зимоустойчивостта, минималната температура и пригодността за Черноморието са оставени за проверка.',
    }
    stage = 'save_draft'
    const nextPayload = { ...payload, aiDraft: publication }
    const save = await fetch(base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status), {
      method: 'PATCH', headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
    })
    if (!save.ok) throw new Error('AI draft was generated but could not be saved.')
    const savedRows = await save.json() as Array<{ id: string }>
    if (!savedRows.length) return json({ error: 'The submission changed. Reload and try again.' }, 409)
    await fetch(base + '/rest/v1/catalog_submission_events', {
      method: 'POST', headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ submission_id: submissionId, actor_id: caller.id, event_type: 'ai_draft_generated',
        from_status: submission.status, to_status: submission.status,
        note: 'ИИ създаде чернова за текстове, alt и характеристики; чака проверка от собственика.',
        metadata: { model, imageCount: images.length } }),
    })
    return json({ ok: true, draft: publication })
  } catch (error) {
    const technical = errorDetails(error)
    const failedStage = stage
    const aiError = technical.startsWith('AI_IMAGE_REQUEST: ') || technical.startsWith('AI_TEXT_REQUEST: ')
      ? technical.replace(/^AI_(IMAGE|TEXT)_REQUEST: /, '')
      : technical
    const classification = classifyAiError(aiError)
    const diagnosticId = crypto.randomUUID()
    const stageLabel = stageLabels[failedStage]
    const imageNumber = imageIndex >= 0 ? imageIndex + 1 : null
    await fetch(base + '/rest/v1/catalog_submission_events', {
      method: 'POST', headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        submission_id: submissionId, actor_id: caller.id, event_type: 'ai_draft_failed',
        from_status: submission.status, to_status: submission.status,
        note: 'AI подготовката е прекъсната на етап: ' + stageLabel + '. Код: ' + classification.code + '.',
        metadata: { diagnosticId, stage: failedStage, stageLabel, code: classification.code, imageNumber, model,
          technical: technical.slice(0, 700) },
      }),
    }).catch(() => undefined)
    return json({
      error: 'Не удалось подготовить проект документа с помощью ИИ.',
      diagnostic: {
        id: diagnosticId, stage: failedStage, stageLabel, code: classification.code,
        imageNumber, hint: classification.hint,
        technical: technical.slice(0, 350),
      },
    }, 502)
  }
}
