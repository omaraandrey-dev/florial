import { checkSameOrigin, json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, errorJson, isObject, parseJsonBody, PRODUCT_TYPES } from '../plant-direct-lib'
import { extractGeminiText, normalizeGeminiPlantResult } from './gemini-test-lib'

const MODEL = 'gemini-3.8-flash'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_TIMEOUT_MS = 15_000
const MODEL_TIMEOUT_MS = 120_000

const responseSchema = {
  type: 'OBJECT',
  properties: {
    plantName: { type: 'STRING' },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    scientificCandidates: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          scientificName: { type: 'STRING' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
          reason: { type: 'STRING' },
        },
        required: ['scientificName', 'confidence', 'reason'],
      },
    },
    productType: { type: 'STRING', enum: Array.from(PRODUCT_TYPES) },
    categoryId: { type: 'STRING' },
    visibleDescription: { type: 'STRING' },
    descriptions: {
      type: 'OBJECT',
      properties: {
        bg: { type: 'OBJECT', properties: { shortDescription: { type: 'STRING' }, description: { type: 'STRING' } }, required: ['shortDescription', 'description'] },
        ru: { type: 'OBJECT', properties: { shortDescription: { type: 'STRING' }, description: { type: 'STRING' } }, required: ['shortDescription', 'description'] },
        en: { type: 'OBJECT', properties: { shortDescription: { type: 'STRING' }, description: { type: 'STRING' } }, required: ['shortDescription', 'description'] },
      },
      required: ['bg', 'ru', 'en'],
    },
    seo: {
      type: 'OBJECT',
      properties: {
        bg: { type: 'OBJECT', properties: { h1: { type: 'STRING' }, metaTitle: { type: 'STRING' }, metaDescription: { type: 'STRING' } }, required: ['h1', 'metaTitle', 'metaDescription'] },
        ru: { type: 'OBJECT', properties: { h1: { type: 'STRING' }, metaTitle: { type: 'STRING' }, metaDescription: { type: 'STRING' } }, required: ['h1', 'metaTitle', 'metaDescription'] },
        en: { type: 'OBJECT', properties: { h1: { type: 'STRING' }, metaTitle: { type: 'STRING' }, metaDescription: { type: 'STRING' } }, required: ['h1', 'metaTitle', 'metaDescription'] },
      },
      required: ['bg', 'ru', 'en'],
    },
    imageAlt: {
      type: 'OBJECT',
      properties: { bg: { type: 'STRING' }, ru: { type: 'STRING' }, en: { type: 'STRING' } },
      required: ['bg', 'ru', 'en'],
    },
    plantCare: {
      type: 'OBJECT',
      properties: {
        light: { type: 'STRING', enum: ['sun', 'partialShade', 'shade', 'unknown'] },
        waterNeeds: { type: 'STRING', enum: ['low', 'medium', 'high', 'unknown'] },
        minWinterTempC: { type: 'STRING' },
        adultHeightCm: { type: 'STRING' },
        foliageType: { type: 'STRING', enum: ['evergreen', 'deciduous', 'unknown'] },
        floweringSeason: { type: 'ARRAY', items: { type: 'STRING', enum: ['spring', 'summer', 'autumn', 'winter'] } },
        plantingSeason: { type: 'ARRAY', items: { type: 'STRING', enum: ['spring', 'summer', 'autumn', 'winter', 'yearRound'] } },
      },
      required: ['light', 'waterNeeds', 'minWinterTempC', 'adultHeightCm', 'foliageType', 'floweringSeason', 'plantingSeason'],
    },
    careGuide: { type: 'STRING' },
  },
  required: ['plantName', 'confidence', 'scientificCandidates', 'productType', 'categoryId', 'visibleDescription', 'descriptions', 'seo', 'imageAlt', 'plantCare', 'careGuide'],
}

const imageBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

const readPlantImage = async (value: unknown) => {
  if (!isObject(value) || !/^image-[A-Za-z0-9-]+$/.test(cleanText(value.assetId, 160))) {
    throw new Error('GEMINI_IMAGE_INVALID')
  }
  const rawUrl = cleanText(value.url, 2000)
  let url: URL
  try { url = new URL(rawUrl) } catch { throw new Error('GEMINI_IMAGE_INVALID') }
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/bxvcy0qs/plants/')) {
    throw new Error('GEMINI_IMAGE_INVALID')
  }
  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS), cache: 'no-store' })
  if (!response.ok) throw new Error('GEMINI_IMAGE_DOWNLOAD_FAILED')
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error('GEMINI_IMAGE_TYPE_INVALID')
  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > MAX_IMAGE_BYTES) throw new Error('GEMINI_IMAGE_TOO_LARGE')
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('GEMINI_IMAGE_TOO_LARGE')
  return { mimeType: contentType, data: imageBase64(bytes) }
}

const failure = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''
  if (/GEMINI_IMAGE_INVALID/.test(message)) return { code: 'GEMINI_IMAGE_INVALID', hint: 'Основната снимка не е валиден Sanity asset за каталога с растения.' }
  if (/GEMINI_IMAGE_DOWNLOAD_FAILED|GEMINI_IMAGE_TYPE_INVALID|GEMINI_IMAGE_TOO_LARGE|TimeoutError|GEMINI_IMAGE_DOWNLOAD_TIMEOUT/.test(message)) return { code: 'GEMINI_IMAGE_UNAVAILABLE', hint: 'Снимката не може да бъде заредена за Gemini. Проверете снимката и опитайте отново.' }
  if (/GEMINI_RATE_LIMIT|429/.test(message)) return { code: 'GEMINI_RATE_LIMIT', hint: 'Достигнат е текущият лимит на Gemini. Изчакайте възстановяване на квотата и опитайте отново.' }
  if (/GEMINI_TIMEOUT|AbortError/.test(message)) return { code: 'GEMINI_TIMEOUT', hint: 'Gemini не отговори в рамките на две минути. Опитайте отново по-късно.' }
  if (/GEMINI_INVALID_JSON|GEMINI_EMPTY_RESPONSE/.test(message)) return { code: 'GEMINI_INVALID_RESPONSE', hint: 'Gemini върна непълен или невалиден структуриран отговор.' }
  return { code: 'GEMINI_PROVIDER_ERROR', hint: 'Gemini временно не успя да обработи заявката. Проверете API ключа и лимитите в Google AI Studio.' }
}

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const requestId = crypto.randomUUID()
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  if (!env.DB) return json({ error: 'Manager database is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (auth.user.role !== 'owner') return json({ error: 'Тестът Gemini е достъпен само за Owner.' }, 403)
  if (!env.GEMINI_API_KEY) return json({ error: 'Добавете GEMINI_API_KEY в Cloudflare Pages → Settings → Variables and Secrets (Production), тип Secret.' }, 503)
  const body = await parseJsonBody(request)
  if (!body || !isObject(body.product) || !body.mainImage) return errorJson('Добавете основна снимка и данни за растението.', 400)

  try {
    const product = body.product
    const categories = Array.isArray(body.categories)
      ? body.categories.slice(0, 100).map((item: unknown) => isObject(item) ? ({ id: cleanText(item.id, 128), name: cleanText(item.name, 120) }) : null).filter((item): item is { id: string; name: string } => Boolean(item && item.id && item.name))
      : []
    const image = await readPlantImage(body.mainImage)
    const productName = cleanText(product.name, 160)
    const productType = PRODUCT_TYPES.has(cleanText(product.productType, 40)) ? cleanText(product.productType, 40) : 'plant'
    const categoryName = cleanText(product.categoryName, 120)
    const shortDescription = cleanText(product.shortDescription, 500)
    const description = cleanText(product.description, 3000)
    const prompt = [
      'You are a cautious botanical visual assistant and senior horticultural editor for Florial, a Bulgarian garden centre.',
      'Analyse the attached product photograph together with seller input. This is a TEST ONLY. Never claim a botanical species is scientifically verified.',
      'IDENTITY: Suggest a Bulgarian commercial/common name only when the visible evidence supports it. Use confidence high only for a clear, distinctive identification; medium for a plausible identification; low if uncertain. If uncertain, leave plantName empty. Do not invent cultivars or Latin names. Return up to three plausible botanical candidates with short reasons and confidence; candidates are hypotheses only.',
      'PRODUCT TYPE: Choose only one supplied allowed product type. CATEGORY: Choose categoryId only from this exact list; otherwise return an empty string: ' + JSON.stringify(categories),
      'SELLER INPUT: name=' + (productName || 'not supplied') + '; scientificName=' + cleanText(product.scientificName, 160) + '; type=' + productType + '; category=' + (categoryName || 'not supplied') + '; short description=' + (shortDescription || 'none') + '; description=' + (description || 'none'),
      'VISUAL DESCRIPTION: Describe only the main visible plant, not shelves, other plants or unrelated background. Do not infer exact sale height, container volume, price, stock, cultivar, age, winter hardiness or coastal suitability.',
      'LANGUAGES: Bulgarian is the source language and must sound like native Bulgarian horticultural commerce copy. Produce fluent Russian and English versions, not literal translations.',
      'DESCRIPTIONS: Write practical, specific product descriptions. Target 2,000–3,000 characters BG and 1,500–2,300 characters RU and EN. Include appearance, foliage, flowering/fruiting where supported, growth habit, typical mature size when reliable, light, soil/drainage, watering, feeding, pruning, planting, containers, landscape uses and relevant Bulgarian Black Sea climate limitations. Do not pad or repeat.',
      'CARE: Never invent exact watering schedules, fertilizer quantities, winter temperatures, toxicity or pet safety. If uncertain, use unknown/empty. For plantCare use light sun|partialShade|shade|unknown; waterNeeds low|medium|high|unknown; foliageType evergreen|deciduous|unknown. Put minWinterTempC and adultHeightCm as strings only when defensible; otherwise empty. blackSeaCoast is always needsVerification.',
      'SEO: Create H1, metaTitle (max 70 chars) and metaDescription (max 320 chars) separately in BG/RU/EN. Bulgarian metaDescription begins with Продажба. Use local SEO naturally: primary Несебър; optionally Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас. Never mention Созопол. Do not claim stock, delivery price, free delivery, same-day delivery or installation.',
      'IMAGE ALT: Describe only visible content, max 180 characters each. Bulgarian ALT begins Купи [plant name] в Несебър — when a reliable name is available; otherwise describe the visible plant without inventing a name.',
      'SAFETY: Never invent price, SKU, sale size, container volume, availability or cultivar. Photo-based candidates are not proof. If plant identity is unclear, do not write species-specific care facts. Return all required JSON fields, using empty strings/arrays for unknown values.',
    ].join('\n\n')

    let apiResponse: Response
    try {
      apiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: image }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema },
      }),
        signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') throw new Error('GEMINI_TIMEOUT')
      throw error
    }
    if (!apiResponse.ok) {
      const providerError = apiResponse.status === 429 ? 'GEMINI_RATE_LIMIT' : 'GEMINI_HTTP_' + apiResponse.status
      console.error('[manager-plants-gemini-test]', { requestId, status: apiResponse.status })
      throw new Error(providerError)
    }
    const payload = await apiResponse.json() as unknown
    const modelText = extractGeminiText(payload)
    const normalized = normalizeGeminiPlantResult(modelText, categories, Array.from(PRODUCT_TYPES))
    return json({ ok: true, model: MODEL, requestId, result: normalized })
  } catch (error) {
    const safe = failure(error)
    console.error('[manager-plants-gemini-test]', { requestId, code: safe.code, errorType: error instanceof Error ? error.name : 'unknown' })
    const status = safe.code === 'GEMINI_RATE_LIMIT' ? 429 : safe.code === 'GEMINI_IMAGE_INVALID' ? 400 : 502
    return json({ error: safe.hint, code: safe.code, requestId, retryable: safe.code === 'GEMINI_TIMEOUT' || safe.code === 'GEMINI_RATE_LIMIT' }, status)
  }
}
