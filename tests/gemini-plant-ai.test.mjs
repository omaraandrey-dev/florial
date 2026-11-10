import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyGeminiFinishReason, classifyGeminiProviderError, classifyGeminiTransportError, geminiProviderRetryDelayMs, isRetryableGeminiHttpStatus, createGeminiSseParser, describeGeminiJsonError, extractGeminiStreamText, extractGeminiText, normalizeGeminiPlantResult, sanitizeGeminiProviderMessage, summarizeGeminiUsage } from '../functions/api/manager/plants/gemini-test-lib.ts'

const categories = [{ id: 'cat-shrubs', name: 'Храсти' }]
const productTypes = ['plant', 'shrub', 'tree']

test('extracts generated text from Gemini candidate parts', () => {
  assert.equal(extractGeminiText({ candidates: [{ content: { parts: [{ text: '{"plantName":"Лавровишня"}' }] } }] }), '{"plantName":"Лавровишня"}')
})

test('rejects an empty Gemini candidate response', () => {
  assert.throws(() => extractGeminiText({ candidates: [] }), /GEMINI_EMPTY_RESPONSE/)
})

test('normalizes structured plant output and accepts only supplied category IDs', () => {
  const result = normalizeGeminiPlantResult({
    plantName: 'Лавровишня',
    confidence: 'high',
    productType: 'shrub',
    categoryId: 'cat-shrubs',
    scientificCandidates: [{ scientificName: 'Prunus laurocerasus', confidence: 'high', reason: 'Листата съответстват.' }],
    descriptions: { bg: { name: 'Лавровишня', shortDescription: 'Кратко', description: 'Описание' } },
    seo: { bg: { h1: 'Лавровишня', metaTitle: 'Лавровишня | Florial' } },
    imageAlt: { bg: 'Купи Лавровишня в Несебър' },
    plantCare: { light: 'partialShade', waterNeeds: 'medium' },
  }, categories, productTypes)
  assert.equal(result.plantName, 'Лавровишня')
  assert.equal(result.categoryId, 'cat-shrubs')
  assert.equal(result.productType, 'shrub')
  assert.equal(result.scientificCandidates[0].scientificName, 'Prunus laurocerasus')
  assert.equal(result.plantCare.blackSeaCoast, 'needsVerification')
  assert.equal(result.descriptions.bg.name, 'Лавровишня')
  assert.equal(result.descriptions.bg.description, 'Описание')
  assert.equal(result.descriptions.ru.description, '')
})

test('does not accept invented categories or unsupported product types', () => {
  const result = normalizeGeminiPlantResult({ categoryId: 'invented', productType: 'unknown-type', confidence: 'certain' }, categories, productTypes)
  assert.equal(result.categoryId, '')
  assert.equal(result.productType, 'plant')
  assert.equal(result.confidence, 'low')
})

test('never treats malformed Latin names as botanical candidates', () => {
  const result = normalizeGeminiPlantResult({ scientificCandidates: [{ scientificName: 'maybe a plant', confidence: 'high' }] }, categories, productTypes)
  assert.deepEqual(result.scientificCandidates, [])
})


test('classifies Gemini authentication and permission errors without exposing provider payloads', () => {
  const result = classifyGeminiProviderError(403, 'PERMISSION_DENIED')
  assert.equal(result.code, 'GEMINI_ACCESS_DENIED')
  assert.equal(result.providerStatus, 'PERMISSION_DENIED')
  assert.equal(result.retryable, false)
  assert.match(result.hint, /GEMINI_API_KEY/)
})

test('classifies Gemini invalid request and schema errors', () => {
  const result = classifyGeminiProviderError(400, 'INVALID_ARGUMENT')
  assert.equal(result.code, 'GEMINI_INVALID_REQUEST')
  assert.match(result.hint, /response schema/)
})

test('classifies model access, quota and transient provider errors', () => {
  assert.equal(classifyGeminiProviderError(404, 'NOT_FOUND').code, 'GEMINI_MODEL_NOT_FOUND')
  assert.equal(classifyGeminiProviderError(429, 'RESOURCE_EXHAUSTED').code, 'GEMINI_RATE_LIMIT')
  assert.equal(classifyGeminiProviderError(503, 'UNAVAILABLE').code, 'GEMINI_PROVIDER_UNAVAILABLE')
  assert.equal(classifyGeminiProviderError(504, 'DEADLINE_EXCEEDED').code, 'GEMINI_PROVIDER_TIMEOUT')
})

 
test('sanitizes and bounds provider error messages before showing them in Manager', () => {
  const result = sanitizeGeminiProviderMessage('Invalid request with key=AIza123456789012345678901234567890 and schema field X')
  assert.doesNotMatch(result, /AIza123456789012345678901234567890/)
  assert.match(result, /\[redacted\]/)
  assert.ok(sanitizeGeminiProviderMessage('x'.repeat(500)).length <= 320)
})

test('extracts streamed text fragments and safely ignores non-content SSE chunks', () => {
  assert.equal(extractGeminiStreamText({ candidates: [{ content: { parts: [{ text: '{"plantName":' }] } }] }), '{"plantName":')
  assert.equal(extractGeminiStreamText({ usageMetadata: { totalTokenCount: 10 } }), '')
})

test('classifies upstream connection and stream interruptions separately', () => {
  const connect = classifyGeminiTransportError('connect')
  const stream = classifyGeminiTransportError('stream')
  assert.equal(connect.code, 'GEMINI_PROVIDER_CONNECT_FAILED')
  assert.equal(connect.providerStatus, 'NETWORK_CONNECT_FAILED')
  assert.equal(connect.retryable, true)
  assert.equal(stream.code, 'GEMINI_PROVIDER_STREAM_INTERRUPTED')
  assert.equal(stream.providerStatus, 'STREAM_INTERRUPTED')
  assert.equal(stream.retryable, true)
})

test('classifies Gemini output-token limit and safety termination', () => {
  assert.equal(classifyGeminiFinishReason('MAX_TOKENS').code, 'GEMINI_MAX_TOKENS')
  assert.equal(classifyGeminiFinishReason('SAFETY').code, 'GEMINI_SAFETY_BLOCKED')
  assert.equal(classifyGeminiFinishReason('STOP'), null)
  assert.equal(classifyGeminiFinishReason('STOP', 'IMAGE_SAFETY').code, 'GEMINI_SAFETY_BLOCKED')
})

test('summarizes only numeric Gemini usage metadata', () => {
  assert.deepEqual(summarizeGeminiUsage({ promptTokenCount: 120, candidatesTokenCount: 900, totalTokenCount: 1020, secret: 'ignored' }), {
    promptTokenCount: 120, candidatesTokenCount: 900, totalTokenCount: 1020,
  })
  assert.equal(summarizeGeminiUsage({}), null)
})


test('parses Gemini SSE events across arbitrary chunks and all standard line endings', () => {
  const payloads = []
  const parser = createGeminiSseParser((payload) => payloads.push(payload))
  parser.push('\uFEFFdata: {"candidates":')
  parser.push('[{"content":{"parts":[{"text":"first"}]}}]}\r')
  parser.push('\r\ndata: {"candidates":[{"content":{"parts":[{"text":"second"}]}}]}\n\n')
  parser.push(': heartbeat\r')
  parser.push('data: {"usageMetadata":{"totalTokenCount":12}}\r\r')
  const stats = parser.finish()
  assert.equal(payloads.length, 3)
  assert.equal(stats.eventCount, 3)
  assert.equal(stats.malformedEventCount, 0)
  assert.equal(stats.dataChars > 0, true)
  assert.equal(stats.ignoredLineCount, 0)
})

test('flushes the final Gemini SSE event when the stream ends without a blank separator', () => {
  const payloads = []
  const parser = createGeminiSseParser((payload) => payloads.push(payload))
  parser.push('data: {"candidates":[{"content":{"parts":[{"text":"tail"}]}}]}')
  const stats = parser.finish()
  assert.equal(payloads.length, 1)
  assert.equal(stats.eventCount, 1)
})

test('counts malformed Gemini SSE events without aborting later valid events', () => {
  const payloads = []
  const parser = createGeminiSseParser((payload) => payloads.push(payload))
  parser.push('data: {bad json}\n\ndata: {"usageMetadata":{"totalTokenCount":7}}\n\n')
  const stats = parser.finish()
  assert.equal(payloads.length, 1)
  assert.equal(stats.eventCount, 2)
  assert.equal(stats.malformedEventCount, 1)
})

test('reports JSON parse position without echoing the provider response', () => {
  const diagnostic = describeGeminiJsonError('{"plantName":')
  assert.match(diagnostic, /позиция/)
  assert.ok(diagnostic.length <= 160)
  assert.equal(describeGeminiJsonError('[]'), 'JSON синтаксисът е валиден, но коренът на отговора не е обект.')
})

test('retries only transient Gemini server overload responses with bounded backoff', () => {
  assert.equal(isRetryableGeminiHttpStatus(502), true)
  assert.equal(isRetryableGeminiHttpStatus(503), true)
  assert.equal(isRetryableGeminiHttpStatus(504), true)
  assert.equal(isRetryableGeminiHttpStatus(429), false)
  assert.equal(isRetryableGeminiHttpStatus(400), false)
  assert.equal(isRetryableGeminiHttpStatus(403), false)
  assert.equal(geminiProviderRetryDelayMs(1), 900)
  assert.equal(geminiProviderRetryDelayMs(2), 1800)
  assert.equal(geminiProviderRetryDelayMs(3), 0)
})
