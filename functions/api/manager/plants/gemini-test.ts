import { checkSameOrigin, json, requireUser, type ManagerEnv } from '../_lib'
import { cleanText, errorJson, isObject, parseJsonBody, PRODUCT_TYPES } from '../plant-direct-lib'
import { classifyGeminiProviderError, classifyGeminiTransportError, extractGeminiStreamText, normalizeGeminiPlantResult, sanitizeGeminiProviderMessage } from './gemini-test-lib'

const MODEL = 'gemini-3.8-flash'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_TIMEOUT_MS = 15_000
const MODEL_TIMEOUT_MS = 300_000

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
  if (!isObject(value) || !/^image-[A-Za-z0-9-]+$/.test(cleanText(value.assetId, 160))) throw new Error('GEMINI_IMAGE_INVALID')
  const rawUrl = cleanText(value.url, 2000)
  let url: URL
  try { url = new URL(rawUrl) } catch { throw new Error('GEMINI_IMAGE_INVALID') }
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/bxvcy0qs/plants/')) throw new Error('GEMINI_IMAGE_INVALID')
  let response: Response
  try { response = await fetch(url.toString(), { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS), cache: 'no-store' }) }
  catch (error) { if (error instanceof Error && error.name === 'TimeoutError') throw new Error('GEMINI_IMAGE_DOWNLOAD_TIMEOUT'); throw error }
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
  if (/GEMINI_IMAGE_DOWNLOAD_FAILED|GEMINI_IMAGE_TYPE_INVALID|GEMINI_IMAGE_TOO_LARGE|GEMINI_IMAGE_DOWNLOAD_TIMEOUT/.test(message)) return { code: 'GEMINI_IMAGE_UNAVAILABLE', hint: 'Снимката не може да бъде заредена за Gemini. Проверете снимката и опитайте отново.' }
  if (/GEMINI_RATE_LIMIT|429/.test(message)) return { code: 'GEMINI_RATE_LIMIT', hint: 'Достигнат е текущият лимит на Gemini. Изчакайте възстановяване на квотата и опитайте отново.' }
  if (/GEMINI_PROVIDER_CONNECT_FAILED/.test(message)) return { code: 'GEMINI_PROVIDER_CONNECT_FAILED', hint: 'Cloudflare не успя да установи връзка с Google Gemini. Проверете отново след малко.' }
  if (/GEMINI_PROVIDER_STREAM_INTERRUPTED/.test(message)) return { code: 'GEMINI_PROVIDER_STREAM_INTERRUPTED', hint: 'Google започна отговор, но потокът прекъсна преди да завърши. Опитайте отново.' }
  if (/GEMINI_TIMEOUT|AbortError|TimeoutError/.test(message)) return { code: 'GEMINI_TIMEOUT', hint: 'Gemini не отговори в рамките на пет минути. Опитайте отново по-късно.' }
  if (/GEMINI_INVALID_JSON|GEMINI_EMPTY_RESPONSE/.test(message)) return { code: 'GEMINI_INVALID_RESPONSE', hint: 'Gemini върна непълен или невалиден структуриран отговор.' }
  return { code: 'GEMINI_PROVIDER_ERROR', hint: 'Gemini временно не успя да обработи заявката. Проверете API ключа и лимитите в Google AI Studio.' }
}

const streamResponse = (requestId: string, mode: 'photo' | 'text', run: (send: (event: Record<string, unknown>) => void) => Promise<void>) => {
  const encoder = new TextEncoder()
  const streamStartedAt = Date.now()
  let currentStage = 'stream_open'
  let heartbeat: ReturnType<typeof setInterval> | undefined
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: Record<string, unknown>) => {
        if (event.type === 'progress' && typeof event.stage === 'string') currentStage = event.stage
        try { controller.enqueue(encoder.encode('data: ' + JSON.stringify(event) + '\n\n')) } catch { /* client disconnected */ }
      }
      heartbeat = setInterval(() => {
        send({ type: 'heartbeat', requestId, mode, stage: currentStage, elapsedMs: Date.now() - streamStartedAt })
      }, 3000)
      void run(send).catch((error) => {
        const safe = failure(error)
        console.error('[manager-plants-gemini-test]', { requestId, mode, stage: currentStage, code: safe.code, errorType: error instanceof Error ? error.name : 'unknown' })
        send({ type: 'error', ...safe, requestId, mode, stage: currentStage })
      }).finally(() => {
        if (heartbeat) clearInterval(heartbeat)
        try { controller.close() } catch { /* already closed */ }
      })
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat)
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  })
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
  const mode = body?.mode === 'text' ? 'text' : 'photo'
  if (!body || !isObject(body.product)) return errorJson('Въведете име на растение или добавете основна снимка.', 400)
  const product = body.product
  const productName = cleanText(product.name, 160)
  if (mode === 'text' && !productName) return errorJson('Въведете име на растение за Gemini Text.', 400)
  if (mode === 'photo' && !body.mainImage) return errorJson('Добавете основна снимка за Gemini Photo.', 400)

  const categories = Array.isArray(body.categories)
    ? body.categories.slice(0, 100).map((item: unknown) => isObject(item) ? ({ id: cleanText(item.id, 128), name: cleanText(item.name, 120) }) : null).filter((item): item is { id: string; name: string } => Boolean(item && item.id && item.name))
    : []
  const productType = PRODUCT_TYPES.has(cleanText(product.productType, 40)) ? cleanText(product.productType, 40) : 'plant'
  const categoryName = cleanText(product.categoryName, 120)
  const shortDescription = cleanText(product.shortDescription, 500)
  const description = cleanText(product.description, 3000)

  return streamResponse(requestId, mode, async (send) => {
    const startedAt = Date.now()
    const progress = (stage: string, message: string) => send({ type: 'progress', stage, message, elapsedMs: Date.now() - startedAt, requestId, mode })
    try {
      progress('request_received', mode === 'photo' ? 'Заявката Gemini Photo е приета. Подготвяме снимката.' : 'Заявката Gemini Text е приета. Снимка не се изпраща.')
      const parts: Array<Record<string, unknown>> = []
      if (mode === 'photo') {
        progress('image_download', 'Зареждаме основната снимка от Sanity CDN.')
        const image = await readPlantImage(body.mainImage)
        parts.push({ text: 'IMAGE INPUT: Analyse the attached product photograph together with seller input.' }, { inlineData: image })
      } else {
        parts.push({ text: 'TEXT-ONLY INPUT: No photograph or image data is attached or available. Identify and research the plant from the supplied name and botanical knowledge only.' })
      }

      const identityInstructions = mode === 'photo'
        ? 'IDENTITY: Suggest a Bulgarian commercial/common name only when the visible evidence supports it. Use confidence high only for a clear, distinctive identification; medium for a plausible identification; low if uncertain. If uncertain, leave plantName empty. Do not invent cultivars or Latin names. Return up to three plausible botanical candidates with short reasons and confidence; candidates are hypotheses only.'
        : 'IDENTITY: The seller-supplied plant name is the target subject, not a visual clue. Resolve the most likely botanical species or taxon from established botanical knowledge. Preserve the common Bulgarian name as plantName when appropriate. Return up to three plausible scientific candidates with confidence and short reasons. If a common name can refer to several species, explain the ambiguity in candidate reasons and do not invent a cultivar. Confidence describes the match between the supplied name and botanical identity, not visual certainty. Do not pretend that a photograph was analysed or that an external database was queried.'
      const prompt = [
        'You are a cautious botanical research assistant and senior horticultural editor for Florial, a Bulgarian garden centre. This is a TEST ONLY. Never claim a botanical species is scientifically verified.',
        identityInstructions,
        'PRODUCT TYPE: Choose only one supplied allowed product type. CATEGORY: Choose categoryId only from this exact list; otherwise return an empty string: ' + JSON.stringify(categories),
        'SELLER INPUT: name=' + productName + '; scientificName=' + cleanText(product.scientificName, 160) + '; type=' + productType + '; category=' + (categoryName || 'not supplied') + '; short description=' + (shortDescription || 'none') + '; description=' + (description || 'none'),
        mode === 'photo'
          ? 'VISUAL DESCRIPTION: Describe only the main visible plant, not shelves, other plants or unrelated background. Do not infer exact sale height, container volume, price, stock, cultivar, age, winter hardiness or coastal suitability.'
          : 'BOTANICAL DESCRIPTION: Base the plant-specific description on reliable, established botanical knowledge. Clearly distinguish typical species traits from cultivar-specific or local growing claims. Do not infer the seller stock size, container volume, price, stock, age or cultivar. visibleDescription must be an empty string because no image was supplied.',
        'LANGUAGES: Bulgarian is the source language and must sound like native Bulgarian horticultural commerce copy. Produce fluent Russian and English versions, not literal translations.',
        'DESCRIPTIONS: Write practical, specific product descriptions. Target 2,000–3,000 characters BG and 1,500–2,300 characters RU and EN. Include appearance, foliage, flowering/fruiting where supported, growth habit, typical mature size when reliable, light, soil/drainage, watering, feeding, pruning, planting, containers, landscape uses and relevant Bulgarian Black Sea climate limitations. Do not pad or repeat.',
        'CARE: Never invent exact watering schedules, fertilizer quantities, winter temperatures, toxicity or pet safety. If uncertain, use unknown/empty. For plantCare use light sun|partialShade|shade|unknown; waterNeeds low|medium|high|unknown; foliageType evergreen|deciduous|unknown. Put minWinterTempC and adultHeightCm as strings only when defensible; otherwise empty. blackSeaCoast is always needsVerification.',
        'SEO: Create H1, metaTitle (max 70 chars) and metaDescription (max 320 chars) separately in BG/RU/EN. Bulgarian metaDescription begins with Продажба. Use local SEO naturally: primary Несебър; optionally Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие and Бургас. Never mention Созопол. Do not claim stock, delivery price, free delivery, same-day delivery or installation.',
        mode === 'photo'
          ? 'IMAGE ALT: Describe only visible content, max 180 characters each. Bulgarian ALT begins Купи [plant name] в Несебър — when a reliable name is available; otherwise describe the visible plant without inventing a name.'
          : 'IMAGE ALT: No image was supplied. Return empty strings for imageAlt.bg, imageAlt.ru and imageAlt.en; do not invent or describe an image.',
        'SAFETY: Never invent price, SKU, sale size, container volume, availability or cultivar. Botanical candidates are hypotheses, not scientific proof. If plant identity is unclear, do not write species-specific care facts. Return all required JSON fields, using empty strings/arrays for unknown values.',
      ].join('\n\n')
      parts.unshift({ text: prompt })
      progress('google_connect', 'Свързваме се с Google Gemini 3.8 Flash. Изчакваме първия фрагмент отговора.')

      let apiResponse: Response
      try {
        apiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':streamGenerateContent?alt=sse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema },
          }),
          signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') throw new Error('GEMINI_TIMEOUT')
        const diagnostic = classifyGeminiTransportError('connect')
        console.error('[manager-plants-gemini-test]', { requestId, mode, stage: 'provider_connect', code: diagnostic.code, errorType: error instanceof Error ? error.name : 'unknown' })
        send({ type: 'error', ...diagnostic, requestId, mode, stage: 'provider_connect', elapsedMs: Date.now() - startedAt })
        return
      }

      const providerContentType = (apiResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      console.info('[manager-plants-gemini-test]', { requestId, mode, stage: 'provider_headers', providerHttpStatus: apiResponse.status, providerContentType })
      send({ type: 'progress', stage: 'provider_headers', message: 'Google отговори. Проверяваме статуса и потока.', requestId, mode, providerHttpStatus: apiResponse.status, providerContentType, elapsedMs: Date.now() - startedAt })
      if (!apiResponse.ok) {
        const providerPayload = await apiResponse.json().catch(() => null) as unknown
        const providerError = isObject(providerPayload) && isObject(providerPayload.error) ? providerPayload.error : {}
        const diagnostic = classifyGeminiProviderError(apiResponse.status, cleanText(providerError.status, 80))
        console.error('[manager-plants-gemini-test]', { requestId, mode, providerHttpStatus: apiResponse.status, providerStatus: diagnostic.providerStatus, code: diagnostic.code })
        send({
          type: 'error',
          error: diagnostic.hint,
          code: diagnostic.code,
          requestId,
          providerHttpStatus: apiResponse.status,
          providerStatus: diagnostic.providerStatus,
          providerMessage: sanitizeGeminiProviderMessage(providerError.message),
          retryable: diagnostic.retryable,
        })
        return
      }
      if (!apiResponse.body) throw new Error('GEMINI_EMPTY_RESPONSE')

      const reader = apiResponse.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventData: string[] = []
      let modelText = ''
      let firstChunk = true
      const consumeEvent = () => {
        if (!eventData.length) return
        const raw = eventData.join('\n')
        eventData = []
        if (raw === '[DONE]') return
        let chunk: unknown
        try { chunk = JSON.parse(raw) } catch { return }
        const delta = extractGeminiStreamText(chunk)
        if (!delta) return
        if (firstChunk) {
          firstChunk = false
          progress('first_token', 'Google изпрати първия фрагмент от отговора. Получаваме продължението.')
        }
        modelText += delta
        send({ type: 'delta', text: delta, chars: modelText.length, elapsedMs: Date.now() - startedAt })
      }
      const consumeLine = (line: string) => {
        if (!line) { consumeEvent(); return }
        if (line.startsWith('data:')) eventData.push(line.slice(5).trimStart())
      }

      progress('streaming', 'Получаваме отговора на Gemini на отделни фрагменти.')
      let providerBytesReceived = 0
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          providerBytesReceived += value?.byteLength || 0
          buffer += decoder.decode(value, { stream: true })
          let newline = buffer.indexOf('\n')
          while (newline >= 0) {
            consumeLine(buffer.slice(0, newline).replace(/\r$/, ''))
            buffer = buffer.slice(newline + 1)
            newline = buffer.indexOf('\n')
          }
        }
      } catch (error) {
        const diagnostic = classifyGeminiTransportError('stream')
        console.error('[manager-plants-gemini-test]', { requestId, mode, stage: 'provider_stream', providerHttpStatus: apiResponse.status, providerContentType, providerBytesReceived, modelCharsReceived: modelText.length, code: diagnostic.code, errorType: error instanceof Error ? error.name : 'unknown' })
        send({ type: 'error', ...diagnostic, requestId, mode, stage: 'provider_stream', providerHttpStatus: apiResponse.status, providerContentType, providerBytesReceived, modelCharsReceived: modelText.length, elapsedMs: Date.now() - startedAt })
        return
      }
      buffer += decoder.decode()
      if (buffer) consumeLine(buffer.replace(/\r$/, ''))
      consumeEvent()
      if (!modelText.trim()) throw new Error('GEMINI_EMPTY_RESPONSE')

      progress('normalizing', 'Потокът приключи. Проверяваме JSON и подготвяме структурираните полета.')
      const normalized = normalizeGeminiPlantResult(modelText, categories, Array.from(PRODUCT_TYPES))
      if (mode === 'text') {
        normalized.visibleDescription = ''
        normalized.imageAlt = { bg: '', ru: '', en: '' }
      }
      send({ type: 'result', ok: true, mode, model: MODEL, requestId, elapsedMs: Date.now() - startedAt, result: normalized })
      progress('completed', 'Анализ завершён. Результат показан ниже и не записан в каталог.')
    } catch (error) {
      const safe = failure(error)
      console.error('[manager-plants-gemini-test]', { requestId, mode, code: safe.code, errorType: error instanceof Error ? error.name : 'unknown' })
      send({ type: 'error', ...safe, requestId, retryable: safe.code === 'GEMINI_TIMEOUT' || safe.code === 'GEMINI_RATE_LIMIT' })
    }
  })
}
