type Env = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }
}
type IntakeImage = { path: string; name?: string; size?: number; type?: string }
type SubmissionRow = { id: string; catalog: string; operation: string; status: string; created_by: string; updated_at: string; payload: Record<string, unknown> }
type GbifMatch = { confidence?: number; matchType?: string; rank?: string; status?: string; canonicalName?: string; scientificName?: string; usageKey?: number }
const textModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const visionModel = '@cf/meta/llama-3.2-11b-vision-instruct'
const bucket = 'florial-manager-intake'
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const textValue = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
function modelText(response: unknown) {
  const result = object(response)
  const value = result?.response ?? result?.result ?? result?.output_text ?? result?.text
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value)
  throw new Error('AI model returned an empty response.')
}
function parseModelJson(response: unknown) {
  const raw = modelText(response).trim().replace(/^\uFEFF/, '')
  const clean = raw.replace(/^\s*\x60{3}(?:json)?/i, '').replace(/\x60{3}\s*$/, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI model returned invalid JSON.')
  return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>
}
function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
function speciesBinomial(value: string) { return value.match(/^([A-Z][A-Za-z-]*\s+[a-z][A-Za-z-]*)/)?.[1] || '' }
function normalizedName(value: string) { return value.toLocaleLowerCase('en').replace(/\s+/g, ' ').trim() }
function acceptedSpecies(match: GbifMatch | null) {
  return !!match && match.matchType === 'EXACT' && typeof match.confidence === 'number' && match.confidence >= 95 && match.rank === 'SPECIES' && match.status === 'ACCEPTED' && typeof match.usageKey === 'number'
}
async function matchGbif(name: string): Promise<GbifMatch | null> {
  if (!name) return null
  const response = await fetch('https://api.gbif.org/v1/species/match?name=' + encodeURIComponent(name) + '&kingdom=Plantae&verbose=true', {
    headers: { Accept: 'application/json', 'User-Agent': 'Florial/1.0 (+https://florial-bg.com)' },
  })
  if (!response.ok) throw new Error('GBIF временно недоступен. Повторите проверку позже.')
  return await response.json() as GbifMatch
}
function gbifSummary(match: GbifMatch | null) {
  if (!match) return null
  return {
    canonicalName: textValue(match.canonicalName ?? match.scientificName, 180),
    rank: textValue(match.rank, 40),
    confidence: typeof match.confidence === 'number' ? match.confidence : 0,
    matchType: textValue(match.matchType, 40),
    taxonomicStatus: textValue(match.status, 40),
    usageKey: typeof match.usageKey === 'number' ? match.usageKey : null,
    accepted: acceptedSpecies(match),
    url: typeof match.usageKey === 'number' ? 'https://www.gbif.org/species/' + match.usageKey : '',
  }
}
function boundedPlantCare(value: unknown) {
  const source = object(value) || {}
  const care: Record<string, unknown> = {}
  if (['sun', 'partialShade', 'shade'].includes(String(source.light))) care.light = source.light
  if (['low', 'medium', 'high'].includes(String(source.waterNeeds))) care.waterNeeds = source.waterNeeds
  if (typeof source.minWinterTempC === 'number' && Number.isFinite(source.minWinterTempC) && source.minWinterTempC >= -40 && source.minWinterTempC <= 20) care.minWinterTempC = source.minWinterTempC
  if (typeof source.adultHeightCm === 'number' && Number.isFinite(source.adultHeightCm) && source.adultHeightCm >= 1 && source.adultHeightCm <= 100000) care.adultHeightCm = source.adultHeightCm
  if (['evergreen', 'deciduous'].includes(String(source.foliageType))) care.foliageType = source.foliageType
  if (Array.isArray(source.floweringSeason)) { const v = source.floweringSeason.filter((x) => ['spring', 'summer', 'autumn', 'winter'].includes(String(x))); if (v.length) care.floweringSeason = v }
  if (Array.isArray(source.plantingSeason)) { const v = source.plantingSeason.filter((x) => ['spring', 'summer', 'autumn', 'winter', 'yearRound'].includes(String(x))); if (v.length) care.plantingSeason = v }
  care.blackSeaCoast = 'needsVerification'
  return care
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== requestUrl.origin) return json({ error: 'Origin not allowed.' }, 403) }
    catch { return json({ error: 'Invalid origin.' }, 403) }
  }
  if (Number(request.headers.get('Content-Length') || 0) > 5000) return json({ error: 'Request is too large.' }, 413)
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Manager service is not configured.' }, 503)
  if (!env.AI?.run) return json({ error: 'AI binding is not configured for this Cloudflare Pages environment.' }, 503)

  const authorization = request.headers.get('Authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) return json({ error: 'Authentication required.' }, 401)
  const base = env.SUPABASE_URL.replace(/\/+$/, '')
  const adminHeaders = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
  const userResponse = await fetch(base + '/auth/v1/user', { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + accessToken } })
  if (!userResponse.ok) return json({ error: 'Invalid or expired session.' }, 401)
  const caller = await userResponse.json() as { id?: string }
  if (!caller.id) return json({ error: 'Invalid session.' }, 401)
  const profileResponse = await fetch(base + '/rest/v1/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(caller.id) + '&select=role,is_active', { headers: adminHeaders })
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
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) return json({ error: 'Invalid submission ID.' }, 400)
  const submissionResponse = await fetch(base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&select=id,catalog,operation,status,created_by,updated_at,payload', { headers: adminHeaders })
  if (!submissionResponse.ok) return json({ error: 'Unable to load submission.' }, 502)
  const rows = await submissionResponse.json() as SubmissionRow[]
  const submission = rows[0]
  if (!submission || submission.catalog !== 'plants' || submission.operation !== 'create') return json({ error: 'Plant submission not found.' }, 404)
  if (!['submitted', 'in_review', 'approved', 'publish_failed'].includes(submission.status)) return json({ error: 'Only a plant submission under owner review can be researched.' }, 409)
  const payload = object(submission.payload) || {}
  if (!object(payload.aiDraft)) return json({ error: 'Сначала подгответе основната AI-карта.' }, 409)

  const reviewInput = object(body.reviewInput) || {}
  const plantName = textValue(reviewInput.name ?? payload.name ?? submission.id, 160)
  const scientificName = textValue(reviewInput.scientificName ?? payload.latinName, 160)
  const sellerBinomial = speciesBinomial(scientificName) || scientificName
  const sellerImages = Array.isArray(payload.images) ? payload.images as IntakeImage[] : []
  const selectedImages = Array.isArray(payload.reviewImages) ? payload.reviewImages as IntakeImage[] : sellerImages
  if (!selectedImages.length) return json({ error: 'Для проверки ботанического имени нужна хотя бы одна фотография растения.' }, 400)
  if (selectedImages.length > 8 || selectedImages.some((image) => !image || !sellerImages.some((original) => original.path === image.path))) return json({ error: 'Список фотографий заявки некорректен. Обновите карточку и повторите проверку.' }, 400)
  const prefix = submission.created_by + '/' + submissionId + '/'
  if (selectedImages.some((image) => {
    if (typeof image.path !== 'string' || !image.path.startsWith(prefix)) return true
    const filename = image.path.slice(prefix.length)
    return !/^[0-9a-f-]{36}[-_][A-Za-z0-9._-]+$/i.test(filename)
  })) return json({ error: 'Путь фотографии не относится к этой заявке.' }, 400)

  const visualResults: Array<Record<string, unknown>> = []
  const visualNames: Array<{ name: string; confidence: string; count: number; evidence: string[] }> = []
  const imagesToAnalyse = selectedImages.slice(0, 3)
  try {
    for (let index = 0; index < imagesToAnalyse.length; index += 1) {
      const image = imagesToAnalyse[index]
      const path = image.path.split('/').map((part) => encodeURIComponent(part)).join('/')
      const download = await fetch(base + '/storage/v1/object/' + bucket + '/' + path, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } })
      if (!download.ok) return json({ error: 'Не удалось открыть фотографию ' + (index + 1) + ' из закрытого хранилища.' }, 502)
      const contentType = (download.headers.get('content-type') || image.type || '').split(';')[0].trim().toLowerCase()
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) return json({ error: 'Для ботанического распознавания используйте JPG, PNG или WebP. Преобразуйте HEIC в JPG и загрузите фото повторно.' }, 400)
      const bytes = new Uint8Array(await download.arrayBuffer())
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) return json({ error: 'Фотография ' + (index + 1) + ' пуста или превышает 10 MB.' }, 400)
      const visionResponse = await env.AI.run(visionModel, {
        messages: [
          { role: 'system', content: 'You are a cautious botanical image-assessment assistant. Independently assess the visible plant; do not assume the seller botanical name is correct. A photograph is not sufficient to confirm a species. Never claim certainty, never identify a cultivar from an image, and return valid JSON only.' },
          { role: 'user', content: 'Plant name entered by seller (may be wrong): ' + (scientificName || 'not provided') + '. Independently inspect this plant photograph. Return JSON with: likelyScientificName (a Latin binomial only if you can reasonably suggest one, otherwise null), commonName, confidence (high, medium, or low), alternatives (up to 2 objects with scientificName and short reason), visualEvidence (up to 3 short visible botanical clues). If exact species cannot be distinguished from this photo, return likelyScientificName null and confidence low. Do not guess cultivar or variety.' },
        ],
        image: 'data:' + contentType + ';base64,' + bytesToBase64(bytes),
        max_tokens: 500,
        temperature: 0.1,
      })
      const visual = parseModelJson(visionResponse)
      const likelyName = textValue(visual.likelyScientificName, 120)
      const binomial = speciesBinomial(likelyName)
      const confidenceRaw = String(visual.confidence || 'low').toLowerCase()
      const visualConfidence = ['high', 'medium', 'low'].includes(confidenceRaw) ? confidenceRaw : 'low'
      const alternatives = Array.isArray(visual.alternatives) ? visual.alternatives.slice(0, 2).map((entry) => {
        const candidate = object(entry) || {}
        return { scientificName: textValue(candidate.scientificName, 120), reason: textValue(candidate.reason, 180) }
      }).filter((entry) => entry.scientificName) : []
      const evidence = Array.isArray(visual.visualEvidence) ? visual.visualEvidence.slice(0, 3).map((entry) => textValue(entry, 180)).filter(Boolean) : []
      visualResults.push({ imageNumber: index + 1, likelyScientificName: binomial || '', commonName: textValue(visual.commonName, 120), confidence: visualConfidence, alternatives, visualEvidence: evidence })
      if (binomial) {
        const existing = visualNames.find((entry) => normalizedName(entry.name) === normalizedName(binomial))
        if (existing) {
          existing.count += 1
          if (['high', 'medium', 'low'].indexOf(visualConfidence) < ['high', 'medium', 'low'].indexOf(existing.confidence)) existing.confidence = visualConfidence
          existing.evidence.push(...evidence)
        } else visualNames.push({ name: binomial, confidence: visualConfidence, count: 1, evidence: [...evidence] })
      }
      for (const alternative of alternatives) {
        const alternativeBinomial = speciesBinomial(alternative.scientificName)
        if (alternativeBinomial && !visualNames.some((entry) => normalizedName(entry.name) === normalizedName(alternativeBinomial))) visualNames.push({ name: alternativeBinomial, confidence: 'low', count: 0, evidence: [alternative.reason] })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/license|licence|acceptable use|prompt.*agree/i.test(message)) return json({ error: 'Cloudflare требует предварительно принять лицензию Meta для модели распознавания изображений. Фото-проверка пока недоступна; данные заявки не изменены.' }, 503)
    return json({ error: 'Не удалось проанализировать фотографию растения. Повторите попытку позже. Данные заявки не изменены.' }, 502)
  }

  const rankedVisual = visualNames.filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count || ['high', 'medium', 'low'].indexOf(a.confidence) - ['high', 'medium', 'low'].indexOf(b.confidence))
  const visualCandidate = rankedVisual[0] || null
  const visualDisagreement = rankedVisual.length > 1 && rankedVisual[0].count === rankedVisual[1].count
  let sellerMatch: GbifMatch | null = null
  let visualMatch: GbifMatch | null = null
  try {
    if (sellerBinomial) sellerMatch = await matchGbif(sellerBinomial)
    if (visualCandidate && !visualDisagreement) visualMatch = await matchGbif(visualCandidate.name)
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Не удалось проверить название через GBIF.' }, 502) }

  const sellerAccepted = acceptedSpecies(sellerMatch)
  const visualAccepted = acceptedSpecies(visualMatch)
  const sellerCanonical = textValue(sellerMatch?.canonicalName ?? sellerMatch?.scientificName, 180)
  const visualCanonical = textValue(visualMatch?.canonicalName ?? visualMatch?.scientificName, 180)
  const visualHasUsefulConfidence = !!visualCandidate && visualCandidate.confidence !== 'low'
  const photoMatchesSeller = sellerAccepted && visualAccepted && visualHasUsefulConfidence && normalizedName(sellerCanonical) === normalizedName(visualCanonical)
  const photoMismatch = !!visualCandidate && !visualDisagreement && visualHasUsefulConfidence && sellerAccepted && visualAccepted && !photoMatchesSeller
  const photoAssessment = visualDisagreement ? 'multiple' : photoMatchesSeller ? 'match' : photoMismatch ? 'mismatch' : !sellerAccepted && visualAccepted ? 'candidate_only' : 'inconclusive'

  let careMatch: GbifMatch | null = null
  let careTaxon = ''
  let careIsProvisional = false
  if (photoMismatch || photoAssessment === 'candidate_only') {
    if (visualAccepted && visualCandidate && visualCandidate.confidence !== 'low') {
      careMatch = visualMatch; careTaxon = visualCanonical; careIsProvisional = true
    }
  } else if (sellerAccepted) {
    careMatch = sellerMatch; careTaxon = sellerCanonical; careIsProvisional = photoAssessment !== 'match'
  }

  let plantCare: Record<string, unknown> = {}
  let fieldConfidence: Record<string, string> = {}
  if (careMatch && careTaxon) {
    const prompt = [
      'Prepare cautious horticultural characteristics for this accepted plant species. This is a suggestion for a human horticulturist, not a verified care database.',
      'Plant common/display name: ' + plantName,
      'Seller botanical name: ' + (scientificName || 'not supplied'),
      'Selected accepted GBIF species for this suggestion: ' + careTaxon,
      'Basis: ' + (careIsProvisional ? 'provisional candidate suggested from the plant photograph; owner must confirm species identity' : 'seller botanical name accepted by GBIF and visually consistent with the photograph') + '.',
      'GBIF verifies taxonomic identity only. It does NOT provide horticultural traits. Do not cite GBIF for light, watering, flowering, mature height, winter hardiness or planting season. Do not claim the photo confirms the species.',
      'Return JSON only. Provide only traits well established for this species and not cultivar-specific. For uncertain fields use null or empty arrays. Never invent values.',
      'light: sun, partialShade or shade; waterNeeds: low, medium or high.',
      'minWinterTempC: numeric only when a defensible species-level threshold is widely established; otherwise null. Do not convert USDA zones to a precise temperature.',
      'adultHeightCm: typical mature species height only; if cultivar-dependent or highly variable, null.',
      'foliageType: evergreen or deciduous only if established.',
      'floweringSeason: spring, summer, autumn, winter; empty if unknown or not applicable.',
      'plantingSeason: spring, summer, autumn, winter, yearRound; account for container-grown plants and Bulgarian climate; empty if uncertain.',
      'blackSeaCoast must always be needsVerification. No verified local coastal trial data was supplied.',
      'Return confidence for each trait as high, medium or low; this is model self-assessment, not independent evidence.',
      '{"plantCare":{"light":null,"waterNeeds":null,"minWinterTempC":null,"adultHeightCm":null,"foliageType":null,"floweringSeason":[],"plantingSeason":[],"blackSeaCoast":"needsVerification"},"confidence":{"light":"low","waterNeeds":"low","minWinterTempC":"low","adultHeightCm":"low","foliageType":"low","floweringSeason":"low","plantingSeason":"low"}}',
    ].join('\n')
    try {
      const response = await env.AI.run(textModel, {
        messages: [
          { role: 'system', content: 'You are a careful horticultural reference assistant. Return valid JSON only. Never invent a citation or claim a source you did not access.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' }, max_tokens: 1400, temperature: 0.1,
      })
      const generated = parseModelJson(response)
      plantCare = boundedPlantCare(generated.plantCare)
      const confidenceInput = object(generated.confidence) || {}
      for (const key of ['light', 'waterNeeds', 'minWinterTempC', 'adultHeightCm', 'foliageType', 'floweringSeason', 'plantingSeason']) {
        const value = String(confidenceInput[key] || 'low')
        fieldConfidence[key] = ['high', 'medium', 'low'].includes(value) ? value : 'low'
      }
    } catch { return json({ error: 'Таксономический кандидат определён, но AI не смог подготовить характеристики. Данные заявки не изменены.' }, 502) }
  }

  const identityStatus = photoMismatch ? 'photo_name_mismatch' : photoAssessment === 'candidate_only' ? 'photo_candidate_suggested' : photoMatchesSeller ? 'verified' : sellerAccepted ? 'taxonomy_verified_photo_inconclusive' : 'needs_review'
  const displayMatch = careMatch || (sellerAccepted ? sellerMatch : null)
  const visualCandidates = [...rankedVisual.slice(0, 3), ...visualNames.filter((entry) => entry.count === 0).slice(0, 2)].map((entry) => ({ scientificName: entry.name, confidence: entry.confidence, photoCount: entry.count, visualEvidence: entry.evidence.slice(0, 4) }))
  const careDraft = {
    identity: {
      status: identityStatus, submittedName: scientificName, sellerGbif: gbifSummary(sellerMatch),
      visualCandidates, visualResults, visualSuggestedScientificName: visualDisagreement ? '' : visualCandidate?.name || '',
      visualGbif: gbifSummary(visualMatch), photoAssessment, imageCountAnalysed: imagesToAnalyse.length,
      canonicalName: careTaxon || (sellerAccepted ? sellerCanonical : ''),
      rank: displayMatch?.rank || '',
      confidence: displayMatch?.confidence || 0,
      matchType: displayMatch?.matchType || '',
      url: typeof displayMatch?.usageKey === 'number' ? 'https://www.gbif.org/species/' + displayMatch.usageKey : '',
      careTaxon, careIsProvisional, source: 'GBIF + Cloudflare Workers AI Vision',
      note: 'GBIF confirms taxonomy only. Image recognition is a preliminary AI suggestion and must be checked by the owner.',
    },
    plantCare, confidence: fieldConfidence, generatedAt: new Date().toISOString(),
    careDataNotice: 'Агротехническите характеристики са AI предложения по приетото таксономично име. GBIF потвърждава само таксономията. Разпознаването по снимка е предварително. Всички стойности и идентичността на растението трябва да бъдат проверени от собственика преди публикация.',
  }
  const nextPayload = { ...payload, plantCareResearch: careDraft }
  const save = await fetch(base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status) + '&updated_at=eq.' + encodeURIComponent(submission.updated_at), {
    method: 'PATCH', headers: { ...adminHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
  })
  if (!save.ok) return json({ error: 'Не удалось сохранить результат ботанической проверки.' }, 502)
  const savedRows = await save.json() as Array<{ id: string }>
  if (!savedRows.length) return json({ error: 'Заявката е променена. Обновете екрана и опитайте отново.' }, 409)
  await fetch(base + '/rest/v1/catalog_submission_events', {
    method: 'POST', headers: { ...adminHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      submission_id: submissionId, actor_id: caller.id, event_type: 'plant_care_researched',
      from_status: submission.status, to_status: submission.status,
      note: photoMismatch ? 'AI photo check suggests a different botanical species; owner review required.' :
        photoMatchesSeller ? 'GBIF taxonomy and AI photo assessment are visually consistent; care suggestions prepared for owner review.' :
          careTaxon ? 'Care suggestions prepared from a provisional GBIF-accepted photo candidate; owner confirmation required.' :
            'Photo and seller name did not yield a sufficiently reliable species identification; no care suggestions generated.',
      metadata: { identityStatus, photoAssessment, careTaxon, imageCountAnalysed: imagesToAnalyse.length, source: 'GBIF + Cloudflare Workers AI Vision' },
    }),
  }).catch(() => undefined)
  return json({ ok: true, careDraft })
}
