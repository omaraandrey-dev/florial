export type GeminiPlantCategory = { id: string; name: string }

export const sanitizeGeminiProviderMessage = (value: unknown) =>
  (typeof value === 'string' ? value : '')
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]')
    .replace(/((?:api[_-]?key|key)\s*[=:]\s*)[^\s,;]+/gi, '$1[redacted]')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 320)

export const classifyGeminiProviderError = (httpStatus: number, providerStatus = '') => {
  const upstreamStatus = providerStatus.trim().toUpperCase().slice(0, 80)
  if (httpStatus === 429 || upstreamStatus === 'RESOURCE_EXHAUSTED') {
    return { code: 'GEMINI_RATE_LIMIT', hint: 'Google Gemini достигна лимита или квотата за този проект. Проверете квотата и billing в Google AI Studio / Google Cloud.', providerStatus: upstreamStatus || 'RESOURCE_EXHAUSTED', retryable: true }
  }
  if (httpStatus === 401 || httpStatus === 403 || upstreamStatus === 'PERMISSION_DENIED' || upstreamStatus === 'UNAUTHENTICATED') {
    return { code: 'GEMINI_ACCESS_DENIED', hint: 'Google отказа достъп до Gemini. Проверете дали GEMINI_API_KEY е валиден, дали Gemini API е активиран и дали ограниченията на ключа позволяват този API.', providerStatus: upstreamStatus || 'PERMISSION_DENIED', retryable: false }
  }
  if (httpStatus === 404 || upstreamStatus === 'NOT_FOUND') {
    return { code: 'GEMINI_MODEL_NOT_FOUND', hint: 'Google не намира модела или endpoint за този проект. Проверете името на модела и достъпа до него.', providerStatus: upstreamStatus || 'NOT_FOUND', retryable: false }
  }
  if (httpStatus === 400 || httpStatus === 422 || upstreamStatus === 'INVALID_ARGUMENT' || upstreamStatus === 'FAILED_PRECONDITION') {
    return { code: 'GEMINI_INVALID_REQUEST', hint: 'Google отхвърли формата на заявката (възможно е несъвместимо поле или response schema). Нужна е проверка на параметрите на Gemini заявката.', providerStatus: upstreamStatus || 'INVALID_ARGUMENT', retryable: false }
  }
  if (httpStatus === 408 || httpStatus === 504 || upstreamStatus === 'DEADLINE_EXCEEDED') {
    return { code: 'GEMINI_PROVIDER_TIMEOUT', hint: 'Заявката към Google Gemini изтече по време. Опитайте отново по-късно.', providerStatus: upstreamStatus || 'DEADLINE_EXCEEDED', retryable: true }
  }
  if (httpStatus >= 500 || upstreamStatus === 'UNAVAILABLE' || upstreamStatus === 'INTERNAL') {
    return { code: 'GEMINI_PROVIDER_UNAVAILABLE', hint: 'Услугата Google Gemini временно е недостъпна или претоварена. Опитайте отново по-късно.', providerStatus: upstreamStatus || 'UNAVAILABLE', retryable: true }
  }
  return { code: 'GEMINI_PROVIDER_ERROR', hint: 'Google Gemini върна неочаквана грешка. Предайте HTTP статуса и ID на заявката за допълнителна проверка.', providerStatus: upstreamStatus || 'UNKNOWN', retryable: false }
}

const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export const classifyGeminiFinishReason = (finishReason: unknown, promptBlockReason: unknown = '') => {
  const reason = text(finishReason, 48).toUpperCase()
  const promptReason = text(promptBlockReason, 48).toUpperCase()
  if ((promptReason && promptReason !== 'BLOCK_REASON_UNSPECIFIED') || ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'RECITATION'].includes(reason)) {
    return { code: 'GEMINI_SAFETY_BLOCKED', hint: 'Google прекрати отговора по правилата за безопасност. Проверете снимката или формулировката и опитайте отново.', finishReason: reason || null, promptBlockReason: promptReason || null }
  }
  if (reason === 'MAX_TOKENS') {
    return { code: 'GEMINI_MAX_TOKENS', hint: 'Google достигна лимита на генерирането и прекрати JSON преди завършване. Структурираните данни може да са непълни.', finishReason: reason, promptBlockReason: null }
  }
  return null
}

export const summarizeGeminiUsage = (value: unknown) => {
  if (!isObject(value)) return null
  const summary: Record<string, number> = {}
  for (const key of ['promptTokenCount', 'candidatesTokenCount', 'totalTokenCount', 'cachedContentTokenCount']) {
    const count = value[key]
    if (typeof count === 'number' && Number.isFinite(count) && count >= 0) summary[key] = count
  }
  return Object.keys(summary).length ? summary : null
}

export const extractGeminiStreamText = (payload: unknown): string => {
  if (!isObject(payload) || !Array.isArray(payload.candidates)) return ''
  const candidate = payload.candidates[0]
  if (!isObject(candidate) || !isObject(candidate.content) || !Array.isArray(candidate.content.parts)) return ''
  return candidate.content.parts.filter((part: unknown) => isObject(part) && typeof part.text === 'string').map((part: any) => part.text).join('')
}

export const extractGeminiText = (payload: unknown): string => {
  if (!isObject(payload) || !Array.isArray(payload.candidates)) throw new Error('GEMINI_EMPTY_RESPONSE')
  const candidate = payload.candidates[0]
  if (!isObject(candidate) || !isObject(candidate.content) || !Array.isArray(candidate.content.parts)) {
    throw new Error('GEMINI_EMPTY_RESPONSE')
  }
  return candidate.content.parts
    .filter((part: unknown) => isObject(part) && typeof part.text === 'string')
    .map((part: any) => part.text)
    .join('\n')
    .trim()
}

export const normalizeGeminiPlantResult = (
  value: unknown,
  categories: GeminiPlantCategory[],
  productTypes: string[],
) => {
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { throw new Error('GEMINI_INVALID_JSON') }
  }
  if (!isObject(parsed)) throw new Error('GEMINI_INVALID_JSON')

  const localized = (source: unknown) => {
    const item = isObject(source) ? source : {}
    return {
      name: text(item.name, 160),
      shortDescription: text(item.shortDescription, 500),
      description: text(item.description, 8000),
    }
  }
  const seo = (source: unknown) => {
    const item = isObject(source) ? source : {}
    return {
      h1: text(item.h1, 160),
      metaTitle: text(item.metaTitle, 70),
      metaDescription: text(item.metaDescription, 320),
    }
  }
  const descriptions = isObject(parsed.descriptions) ? parsed.descriptions : {}
  const seoSource = isObject(parsed.seo) ? parsed.seo : {}
  const altSource = isObject(parsed.imageAlt) ? parsed.imageAlt : {}
  const care = isObject(parsed.plantCare) ? parsed.plantCare : {}
  const confidence = ['high', 'medium', 'low'].includes(String(parsed.confidence)) ? String(parsed.confidence) : 'low'
  const productType = productTypes.includes(String(parsed.productType)) ? String(parsed.productType) : 'plant'
  const categoryId = text(parsed.categoryId, 128)
  const allowedCategoryId = categories.some((category) => category.id === categoryId) ? categoryId : ''
  const scientificCandidates = Array.isArray(parsed.scientificCandidates)
    ? parsed.scientificCandidates.slice(0, 3).map((candidate: unknown) => {
        const item = isObject(candidate) ? candidate : {}
        const scientificName = text(item.scientificName, 160)
        return {
          scientificName: /^[A-Z][A-Za-z-]+ [a-z][A-Za-z-]+$/.test(scientificName) ? scientificName : '',
          confidence: ['high', 'medium', 'low'].includes(String(item.confidence)) ? String(item.confidence) : 'low',
          reason: text(item.reason, 240),
        }
      }).filter((candidate: { scientificName: string }) => candidate.scientificName)
    : []

  return {
    plantName: text(parsed.plantName, 160),
    confidence,
    scientificCandidates,
    productType,
    categoryId: allowedCategoryId,
    visibleDescription: text(parsed.visibleDescription, 240),
    descriptions: {
      bg: localized(descriptions.bg),
      ru: localized(descriptions.ru),
      en: localized(descriptions.en),
    },
    seo: {
      bg: seo(seoSource.bg),
      ru: seo(seoSource.ru),
      en: seo(seoSource.en),
    },
    imageAlt: {
      bg: text(altSource.bg, 180),
      ru: text(altSource.ru, 180),
      en: text(altSource.en, 180),
    },
    plantCare: {
      light: text(care.light, 32),
      waterNeeds: text(care.waterNeeds, 32),
      minWinterTempC: text(care.minWinterTempC, 32),
      adultHeightCm: text(care.adultHeightCm, 32),
      foliageType: text(care.foliageType, 32),
      floweringSeason: Array.isArray(care.floweringSeason) ? care.floweringSeason.slice(0, 5).map((item: unknown) => text(item, 24)) : [],
      plantingSeason: Array.isArray(care.plantingSeason) ? care.plantingSeason.slice(0, 5).map((item: unknown) => text(item, 24)) : [],
      blackSeaCoast: 'needsVerification',
    },
    careGuide: text(parsed.careGuide, 5000),
  }
}

export const classifyGeminiTransportError = (phase: 'connect' | 'stream') => phase === 'connect'
  ? { code: 'GEMINI_PROVIDER_CONNECT_FAILED', hint: 'Cloudflare не успя да установи връзка с Google Gemini. Проверете отново след малко.', providerStatus: 'NETWORK_CONNECT_FAILED', retryable: true }
  : { code: 'GEMINI_PROVIDER_STREAM_INTERRUPTED', hint: 'Google започна отговор, но потокът прекъсна преди да завърши. Опитайте отново.', providerStatus: 'STREAM_INTERRUPTED', retryable: true }


export type GeminiSseDiagnostics = {
  eventCount: number
  malformedEventCount: number
  ignoredLineCount: number
  dataChars: number
}

export const createGeminiSseParser = (onPayload: (payload: unknown) => void) => {
  let buffer = ''
  let dataLines: string[] = []
  let eventCount = 0
  let malformedEventCount = 0
  let ignoredLineCount = 0
  let dataChars = 0
  let firstLine = true
  let finished = false

  const dispatch = () => {
    if (!dataLines.length) return
    const raw = dataLines.join('\n')
    dataLines = []
    if (raw.trim() === '[DONE]') return
    eventCount += 1
    dataChars += raw.length
    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      malformedEventCount += 1
      return
    }
    onPayload(payload)
  }

  const consumeLine = (rawLine: string) => {
    let line = rawLine
    if (firstLine) {
      firstLine = false
      if (line.charCodeAt(0) === 0xFEFF) line = line.slice(1)
    }
    if (line === '') {
      dispatch()
      return
    }
    if (line.startsWith(':')) return
    if (line.startsWith('data:')) {
      let value = line.slice(5)
      if (value.startsWith(' ')) value = value.slice(1)
      dataLines.push(value)
      return
    }
    ignoredLineCount += 1
  }

  const process = (final: boolean) => {
    let index = 0
    while (index < buffer.length) {
      const code = buffer.charCodeAt(index)
      if (code !== 10 && code !== 13) {
        index += 1
        continue
      }
      if (code === 13 && index === buffer.length - 1 && !final) break
      const line = buffer.slice(0, index)
      const delimiterLength = code === 13 && buffer.charCodeAt(index + 1) === 10 ? 2 : 1
      buffer = buffer.slice(index + delimiterLength)
      index = 0
      consumeLine(line)
    }
    if (final) {
      if (buffer.length) consumeLine(buffer)
      buffer = ''
      dispatch()
    }
  }

  const getStats = (): GeminiSseDiagnostics => ({
    eventCount,
    malformedEventCount,
    ignoredLineCount,
    dataChars,
  })

  return {
    push(chunk: string) {
      if (finished) throw new Error('GEMINI_SSE_PARSER_FINISHED')
      buffer += chunk
      process(false)
    },
    finish(): GeminiSseDiagnostics {
      if (!finished) {
        process(true)
        finished = true
      }
      return getStats()
    },
    getStats,
  }
}

export const describeGeminiJsonError = (value: string): string => {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? 'JSON синтаксисът е валиден, но резултатът не може да бъде нормализиран.'
      : 'JSON синтаксисът е валиден, но коренът на отговора не е обект.'
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Невалиден JSON'
    const position = message.match(/(?:position|at)\s+(\d+)/i)?.[1] || (/unexpected end/i.test(message) ? String(value.length) : '')
    return (position ? 'Невалиден JSON около позиция ' + position + '.' : 'Невалиден JSON: ' + message)
      .replace(/[\r\n\t]+/g, ' ')
      .slice(0, 160)
  }
}
