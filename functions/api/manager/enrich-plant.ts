import { d1RestFetch } from './_rest'
import type { ManagerEnv } from './_lib'
type Env = ManagerEnv

type IntakeImage = { path: string; url?: string; assetId?: string; name: string; size: number; type: string }
type SubmissionRow = {
  id: string; catalog: string; operation: string; status: string; created_by: string; updated_at: string
  payload: Record<string, unknown>
}
type ScientificCandidate = { scientificName: string; confidence: string; reason: string }

const visionModel = '@cf/meta/llama-3.2-11b-vision-instruct'
const textModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})
const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const textValue = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
function latinBinomial(value: unknown) {
  const candidate = textValue(value, 120)
  const match = candidate.match(/\b([A-Z][A-Za-z-]+)\s+([a-z][A-Za-z-]+)\b/)
  return match ? match[1] + ' ' + match[2] : ''
}
function normalizeScientificCandidates(value: unknown): ScientificCandidate[] {
  const seen = new Set<string>()
  return (Array.isArray(value) ? value : [])
    .slice(0, 6)
    .map((entry) => object(entry) || {})
    .map((entry) => ({
      scientificName: latinBinomial(entry.scientificName),
      confidence: ['high', 'medium', 'low'].includes(String(entry.confidence).toLowerCase()) ? String(entry.confidence).toLowerCase() : 'low',
      reason: textValue(entry.reason, 240),
    }))
    .filter((entry) => {
      const key = entry.scientificName.toLocaleLowerCase('en')
      if (!entry.scientificName || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 3)
}
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
  if (/deprecated|removed|unknown model|model.*not found/.test(lower)) {
    return { code: 'AI_MODEL_UNAVAILABLE', hint: 'Cloudflare не принимает выбранную модель. Проверьте актуальный каталог Workers AI; запрос остановлен без изменения данных карточки.' }
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
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
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
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  if (!env.AI?.run) return json({ error: 'AI binding is not configured for this Cloudflare Pages environment.' }, 503)

  const fetch = (input: RequestInfo | URL, init?: RequestInit) => d1RestFetch(env, request, input, init)
  const base = 'https://florial-d1.local'
  const D1_INTERNAL_HEADER = 'D1-compat'
  const adminHeaders = { apikey: D1_INTERNAL_HEADER, Authorization: 'Bearer ' + D1_INTERNAL_HEADER, 'Content-Type': 'application/json' }
  const accessToken = 'cookie-session'
  const userResponse = await fetch(base + '/internal-d1/auth/user', {
    headers: { apikey: D1_INTERNAL_HEADER, Authorization: 'Bearer ' + accessToken },
  })
  if (!userResponse.ok) return json({ error: 'Invalid or expired session.' }, 401)
  const caller = await userResponse.json() as { id?: string }
  if (!caller.id) return json({ error: 'Invalid session.' }, 401)
  const profileResponse = await fetch(
    base + '/internal-d1/data/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(caller.id) + '&select=role,is_active,permissions',
    { headers: adminHeaders },
  )
  if (!profileResponse.ok) return json({ error: 'Unable to verify owner permissions.' }, 503)
  const profiles = await profileResponse.json() as Array<{ role: string; is_active: boolean; permissions?: { canEditPlantCard?: boolean } }>
  const profile = profiles[0]
  if (!profile || profile.is_active !== true || profile.role !== 'owner' && (profile.role !== 'manager' || profile.permissions?.canEditPlantCard !== true)) return json({ error: 'Нямате право да подготвяте и редактирате карточки растения.' }, 403)

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
    base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) +
      '&select=id,catalog,operation,status,created_by,updated_at,payload',
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
  const reviewInput = object(body.reviewInput) || {}
  if (existingDraft) {
    const existingCandidates = normalizeScientificCandidates(existingDraft.scientificNameCandidates)
    if (existingCandidates.length > 0) return json({ ok: true, draft: existingDraft, reused: true })
    try {
      const plantName = textValue(reviewInput.name ?? existingDraft.name ?? payload.name ?? submission.title, 160)
      const candidateResponse = await env.AI.run(textModel, {
        messages: [
          { role: 'system', content: 'You are a cautious botanical nomenclature assistant. Return valid JSON only. Never invent a cultivar or claim certainty.' },
          { role: 'user', content: [
            'Suggest up to 3 possible Latin species binomials based ONLY on the seller-provided common/display name and seller text. Do not use photographs or visual assumptions.',
            'Plant name: ' + plantName,
            'Plant type: ' + textValue(reviewInput.productType ?? existingDraft.productType ?? payload.productType, 40),
            'Category: ' + textValue(reviewInput.categoryName ?? existingDraft.categoryName ?? payload.categoryName, 120),
            'Seller description: ' + textValue(reviewInput.description ?? existingDraft.description ?? payload.description, 700),
            'If the name is incomplete or ambiguous, offer distinct candidates with medium/low confidence and explain the uncertainty in Russian. If there is no defensible candidate, return an empty array.',
            'Each candidate must have a Latin binomial, confidence high|medium|low, and a short reason in Russian.',
            'JSON shape: {"candidates":[{"scientificName":"Thuja occidentalis","confidence":"medium","reason":"Возможное соответствие; требуется проверка по GBIF и фотографии."}]}',
          ].join('\n') },
        ],
        response_format: { type: 'json_object' }, max_tokens: 900, temperature: 0.1,
      })
      const suggested = parseModelJson(candidateResponse)
      const candidates = normalizeScientificCandidates(suggested.candidates)
      const nextDraft = { ...existingDraft, scientificNameCandidates: candidates }
      const nextPayload = { ...payload, aiDraft: nextDraft }
      const save = await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) +
        '&status=eq.' + encodeURIComponent(submission.status) + '&updated_at=eq.' + encodeURIComponent(submission.updated_at), {
        method: 'PATCH', headers: { ...adminHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
      })
      if (!save.ok) return json({ error: 'Не удалось сохранить варианты ботанического имени.', diagnostic: { stage: 'save_botanical_candidates', httpStatus: save.status } }, 502)
      const savedRows = await save.json() as Array<{ id: string }>
      if (!savedRows.length) return json({ error: 'Заявка изменилась. Обновите страницу и повторите запрос.' }, 409)
      return json({ ok: true, draft: nextDraft, reused: true, botanicalCandidatesGenerated: true })
    } catch (error) {
      return json({ error: 'Не удалось предложить латинские названия. Существующий AI-черновик не изменён.', diagnostic: {
        stage: 'generate_botanical_candidates', code: 'BOTANICAL_CANDIDATES_FAILED',
        technical: errorDetails(error).slice(0, 350),
      } }, 502)
    }
  }
  const originalVariant = (Array.isArray(payload.saleVariants) ? object(payload.saleVariants[0]) : null) || {}
  const reviewedVariant = Array.isArray(reviewInput.saleVariants) ? object(reviewInput.saleVariants[0]) : null
  const variant = reviewedVariant || originalVariant
  const sellerImages = Array.isArray(payload.images) ? payload.images as IntakeImage[] : []
  const images = Array.isArray(payload.reviewImages) ? payload.reviewImages as IntakeImage[] : sellerImages
  if (images.length > 8) return json({ error: 'The submission can contain no more than 8 selected photos.' }, 400)
  if (images.some((image) => !sellerImages.some((sellerImage) => sellerImage.path === image?.path))) {
    return json({ error: 'A selected photo does not belong to the original seller submission.' }, 400)
  }
  if (images.some((image) => !image || typeof image.assetId !== 'string' || !/^image-[A-Za-z0-9-]+$/.test(image.assetId) ||
      typeof (image.url || image.path) !== 'string' || !/^https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/plants\//i.test(image.url || image.path))) {
    return json({ error: 'A photo path does not belong to this submission.' }, 400)
  }

  let stage: AiStage = 'validate'
  let imageIndex = -1
  try {
    const name = textValue(reviewInput.name ?? payload.name ?? submission.title, 160)
    const latinName = textValue(reviewInput.scientificName ?? payload.latinName, 160)
    const sellerProductType = textValue(reviewInput.productType ?? payload.productType, 40)
    const categoryId = textValue(reviewInput.categoryId ?? payload.categoryId, 128)
    const categoryName = textValue(reviewInput.categoryName ?? payload.categoryName, 120)
    const sku = textValue(reviewInput.sku ?? payload.sku, 100)
    const sellerDescription = textValue(reviewInput.description ?? payload.description, 1200)
    const imageDescriptions: Array<{ bg: string; en: string; ru: string }> = []
    // Only the first selected photo (main image) is sent to Workers AI Vision.
    // Other seller photos remain attached to the submission/product but are not analysed.
    const imagesForAi = images.slice(0, 1)
    for (let index = 0; index < imagesForAi.length; index += 1) {
      const image = images[index]
      imageIndex = index
      stage = 'download_image'
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size <= 0 || image.size > 10 * 1024 * 1024) {
        throw new Error('Photo ' + (index + 1) + ' has an unsupported format or size.')
      }
      const imageUrl = image.url || image.path
      if (!/^https:\/\//i.test(imageUrl)) throw new Error('Photo ' + (index + 1) + ' has no valid Sanity asset URL.')
      const download = await fetch(imageUrl)
      if (!download.ok) throw new Error('Could not read photo ' + (index + 1) + ' from Sanity Assets.')
      const contentType = (download.headers.get('content-type') || image.type).split(';')[0].trim().toLowerCase()
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error('Photo ' + (index + 1) + ' is not a supported image.')
      const bytes = new Uint8Array(await download.arrayBuffer())
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('Photo ' + (index + 1) + ' is empty or too large.')
      const dataUrl = 'data:' + contentType + ';base64,' + bytesToBase64(bytes)
      stage = 'analyze_image'
      let response: unknown
      try { response = await env.AI.run(visionModel, {
        messages: [
          { role: 'system', content: 'Describe visible image details for accessible alt text. Do not identify a plant species. Do not invent details. Reply with one concise sentence in Bulgarian only, without JSON, labels, quotes or markdown.' },
          { role: 'user', content: 'The seller says the plant is "' + name + '"' + (latinName ? ' (' + latinName + ')' : '') +
            '. Describe only what is visibly apparent in this photo. Write one natural Bulgarian alt description, maximum 180 characters. Do not mention image number or SEO keywords.' },
        ],
        image: dataUrl,
      }) } catch (error) { throw new Error('AI_IMAGE_REQUEST: ' + errorDetails(error)) }
      stage = 'parse_image_result'
      const rawAlt = modelText(response).trim()
        .replace(/```(?:text|json)?/gi, '')
        .replace(/^["'“”]+|["'“”]+$/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 180)
      if (!rawAlt) throw new Error('AI image model returned an empty description.')
      imageDescriptions.push({
        bg: rawAlt,
        en: name + ' — plant photo',
        ru: name + ' — фотография растения',
      })
    }

    imageIndex = -1
    const prompt = `Prepare a high-quality, detailed, locally optimized plant product listing for Florial, a Bulgarian garden and plant retailer.
LANGUAGE: Bulgarian is the source language and must read like polished native Bulgarian horticultural commerce copy. Then write genuinely fluent Russian and English versions adapted to each language, not literal translations.
OWNER-VERIFIED INPUT (the only authority for commercial facts): name: ${name}; botanical name: ${latinName || 'not supplied'}; seller-selected plant type: ${sellerProductType || 'not supplied'}; category: ${categoryName}; owner description: ${sellerDescription}; SKU: ${sku || 'not supplied'}; sale variant: ${textValue(variant.name, 100)}; sale height cm: ${variant.saleHeightCm ?? 'not supplied'}; pot volume L: ${variant.containerVolumeL ?? 'not supplied'}; price EUR: ${variant.priceEUR ?? 'not supplied'}; stock status: ${textValue(variant.stockStatus, 40)}; stock quantity: ${variant.stockQuantity ?? 'not supplied'}.
VISIBLE PHOTO OBSERVATIONS (visual evidence only; never identify a species from photos alone): ${imageDescriptions.length ? imageDescriptions.map((item, index) => 'Photo ' + (index + 1) + ': ' + item.bg).join(' | ') : 'No photos were selected. Do not infer visual details.'}.
FLORIAL LOCAL SERVICE AREA — use these exact boundaries:
- Main local reference: Несебър (Nesebar).
- Service and sales area: Несебър, Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас.
- Бургас is the outermost city in this service area.
- NEVER mention Созопол / Sozopol or imply service farther south.
LOCAL SEO:
- Make it clear naturally that the plant is offered by Florial in Несебър and the nearby service area.
- In the Bulgarian description, include one natural local-availability sentence where relevant. Vary nearby towns, e.g. Равда, Слънчев бряг, Свети Влас, Кошарица or Поморие. Do not insert the entire town list into every paragraph.
- Use Несебър as the primary location signal in the Bulgarian SEO title and meta description. Add only 1–3 additional service-area towns when it fits naturally.
- Localize SEO title and meta description separately for BG, RU and EN, using the natural local place names in each language.
- Never claim free/same-day delivery, stock availability, installation, or delivery prices unless owner input explicitly confirms it.
HORTICULTURAL CONTENT:
- Full description normally about 2,500–3,500 characters in BG and 2,000–3,000 characters in RU and EN. Do not pad or repeat just to hit a length. If reliable species information is limited, write a shorter accurate description and say what needs checking.
- Write a substantial, useful product description with clear paragraphs and short section headings. Cover when applicable and known: botanical identity and plant group; appearance, foliage, flowering/fruiting and seasonal interest; growth habit and typical mature size; light; soil and drainage; watering and drought tolerance; feeding, pruning and maintenance; planting and container growing; landscape uses in private gardens, courtyards, hotels and commercial green areas; suitability and practical considerations for the Bulgarian Black Sea climate.
- Explain practical benefits and limitations for buyers. Avoid generic sales filler, unsupported superlatives and keyword repetition.
- Distinguish verified sale height/container volume from typical mature size.
- For coastal adaptation, discuss defensible factors such as summer heat, sun, wind, salt influence, drainage and winter cold. Do not claim the species is suitable for the coast without a sound botanical basis.
FACTUAL SAFETY:
- Never change or fabricate price, stock, sale size, pot volume, SKU, category or delivery terms.
- Do not identify a species solely from photos. If botanical identity is uncertain, keep scientificName empty and use cautious generic copy.
- Never fill scientificName with a guessed value. If the owner supplied a botanical name, preserve that exact input; otherwise scientificName must be an empty string.
- Add scientificNameCandidates: up to 3 possible Latin binomials based ONLY on the seller's entered plant name, selected plant type, category and seller description. Ignore all photo observations for this field. If the common name is incomplete or ambiguous, offer distinct plausible species with medium/low confidence or return an empty array. Never invent a cultivar. Each candidate must contain scientificName, confidence (high|medium|low), and a short reason in Russian. These are suggestions only, not verified names.
- Do not invent precise hardiness, minimum winter temperature, adult height, flowering months, toxicity, pet safety or care requirements. You may suggest minWinterTempC, adultHeightCm and blackSeaCoast only when well-established for the confirmed botanical species; these are AI suggestions and MUST be checked by the owner before publication. Otherwise return null / "needsVerification".
- Care fields are suggestions for owner verification. If uncertain use null. Do not add irrigation product slugs.
SHORT COPY AND IMAGES:
- Short descriptions: max 300 characters per language.
- Create imageAlts, imageAltsEn and imageAltsRu arrays with one concise translation per selected photo, based only on visible observations; max 180 characters per item and preserve photo order. ALT describes the image; do not add city keywords artificially.
SEO:
- BG seo.title and seo.description are Bulgarian SEO title and meta description. Target title 50–65 characters and meta 140–160 characters; hard limits 160 and 320.
- translations.en.seo and translations.ru.seo each contain their own localized title and meta description.
- Each SEO description identifies Florial as a local plant offer in Nesebar / Несебър and nearby towns naturally, without keyword stuffing.
Return only valid JSON with this shape:
{"name":"","scientificName":"","scientificNameCandidates":[{"scientificName":"Thuja occidentalis","confidence":"medium","reason":"Возможное соответствие общему названию; вид требует проверки"}],"productType":"plant|tree|shrub|flower|perennial|indoor|citrus|palm|conifer|fruit|succulent|climber|ornamentalGrass|groundcover|bulb|herb|aquatic|other","shortDescription":"","description":"","translations":{"en":{"name":"","shortDescription":"","description":"","seo":{"title":"","description":""}},"ru":{"name":"","shortDescription":"","description":"","seo":{"title":"","description":""}}},"imageAlts":[],"imageAltsEn":[],"imageAltsRu":[],"seo":{"title":"","description":""},"plantCare":{"light":"sun|partialShade|shade|null","waterNeeds":"low|medium|high|null","minWinterTempC":null,"blackSeaCoast":"suitable|notSuitable|needsVerification","adultHeightCm":null,"foliageType":"evergreen|deciduous|null","floweringSeason":[],"plantingSeason":[]},"careGuide":""}
careGuide should be a useful Bulgarian care guide with practical points where known: planting, watering, light, soil/drainage, feeding, pruning and winter protection. Avoid unsupported exact schedules or quantities. If species identity is uncertain, state that detailed care must be confirmed after verifying the botanical name.`
    stage = 'generate_text'
    let textResponse: unknown
    try { textResponse = await env.AI.run(textModel, {
      messages: [
      { role: 'system', content: 'You are a careful horticultural product copywriter for Bulgaria. Return valid JSON only. Never invent facts or commercial data.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 8192,
    temperature: 0.2,
    }) } catch (error) { throw new Error('AI_TEXT_REQUEST: ' + errorDetails(error)) }
    stage = 'parse_text_result'
    const generated = parseModelJson(textResponse)
    const care = object(generated.plantCare) || {}
    const scientificNameCandidates = normalizeScientificCandidates(generated.scientificNameCandidates)
    const publication = {
      name: textValue(generated.name, 160) || name,
      slug: slugify(textValue(generated.name, 160) || name) || 'plant-' + submissionId.slice(0, 8),
      scientificName: latinName,
      scientificNameCandidates,
      productType: sellerProductType || textValue(generated.productType, 40) || 'plant',
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
        bg: { name: textValue(generated.name, 160) || name, shortDescription: textValue(generated.shortDescription, 500), description: textValue(generated.description, 5000), seo: { title: textValue(object(generated.seo)?.title, 160), description: textValue(object(generated.seo)?.description, 320) } },
        en: object(generated.translations) && object(object(generated.translations)?.en) || {},
        ru: object(generated.translations) && object(object(generated.translations)?.ru) || {},
      },
      isFeatured: false,
      seo: { title: textValue(object(generated.seo)?.title, 160), description: textValue(object(generated.seo)?.description, 320) },
      plantCare: {
        light: ['sun', 'partialShade', 'shade'].includes(String(care.light)) ? care.light : null,
        waterNeeds: ['low', 'medium', 'high'].includes(String(care.waterNeeds)) ? care.waterNeeds : null,
        minWinterTempC: typeof care.minWinterTempC === 'number' && Number.isFinite(care.minWinterTempC) && care.minWinterTempC >= -60 && care.minWinterTempC <= 30 ? care.minWinterTempC : null,
        blackSeaCoast: ['suitable', 'notSuitable', 'needsVerification'].includes(String(care.blackSeaCoast)) ? care.blackSeaCoast : 'needsVerification',
        adultHeightCm: typeof care.adultHeightCm === 'number' && Number.isFinite(care.adultHeightCm) && care.adultHeightCm >= 0 && care.adultHeightCm <= 100000 ? care.adultHeightCm : null,
        foliageType: ['evergreen', 'deciduous'].includes(String(care.foliageType)) ? care.foliageType : null,
        floweringSeason: Array.isArray(care.floweringSeason) ? care.floweringSeason.filter((v) => ['spring', 'summer', 'autumn', 'winter'].includes(String(v))) : [],
        plantingSeason: Array.isArray(care.plantingSeason) ? care.plantingSeason.filter((v) => ['spring', 'summer', 'autumn', 'winter', 'yearRound'].includes(String(v))) : [],
      },
      careGuide: textValue(generated.careGuide, 4000),
      aiReviewNote: 'ИИ подготви разширени локализирани описания и SEO за Несебър и зоната на Florial. Латинските имена в scientificNameCandidates са само предложения по името на продавача; изберете подходящо и проверете го с GBIF и снимките. Проверете всички грижи, възрастните размери, зимоустойчивостта и пригодността за Черноморието преди публикуване. Предложените от ИИ стойности не са потвърдени факти.',
    }
    stage = 'save_draft'
    const nextPayload = { ...payload, aiDraft: publication, plantCareResearch: null }
    const save = await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status), {
      method: 'PATCH', headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
    })
    if (!save.ok) throw new Error('AI draft was generated but could not be saved.')
    const savedRows = await save.json() as Array<{ id: string }>
    if (!savedRows.length) return json({ error: 'The submission changed. Reload and try again.' }, 409)
    await fetch(base + '/internal-d1/data/catalog_submission_events', {
      method: 'POST', headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ submission_id: submissionId, actor_id: caller.id, event_type: 'ai_draft_generated',
        from_status: submission.status, to_status: submission.status,
        note: 'ИИ създаде чернова за текстове, alt и характеристики; чака проверка от собственика.',
        metadata: { models: { vision: visionModel, text: textModel }, imageCount: imagesForAi.length, totalSelectedImageCount: images.length, scientificNameCandidateCount: scientificNameCandidates.length } }),
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
    await fetch(base + '/internal-d1/data/catalog_submission_events', {
      method: 'POST', headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        submission_id: submissionId, actor_id: caller.id, event_type: 'ai_draft_failed',
        from_status: submission.status, to_status: submission.status,
        note: 'AI подготовката е прекъсната на етап: ' + stageLabel + '. Код: ' + classification.code + '.',
        metadata: { diagnosticId, stage: failedStage, stageLabel, code: classification.code, imageNumber,
          model: failedStage === 'generate_text' || failedStage === 'parse_text_result' ? textModel : visionModel,
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
