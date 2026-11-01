type Env = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }
}
type SubmissionRow = {
  id: string
  catalog: string
  operation: string
  status: string
  created_by: string
  updated_at: string
  payload: Record<string, unknown>
}
const textModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
})
const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const textValue = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
function parseModelJson(response: unknown) {
  const result = object(response)
  const value = result?.response ?? result?.result ?? result?.output_text ?? result?.text
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>
  if (typeof value !== 'string') throw new Error('AI model returned an empty response.')
  const clean = value.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI model returned invalid JSON.')
  return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>
}
function boundedPlantCare(value: unknown) {
  const source = object(value) || {}
  const care: Record<string, unknown> = {}
  if (['sun', 'partialShade', 'shade'].includes(String(source.light))) care.light = source.light
  if (['low', 'medium', 'high'].includes(String(source.waterNeeds))) care.waterNeeds = source.waterNeeds
  if (typeof source.minWinterTempC === 'number' && Number.isFinite(source.minWinterTempC) && source.minWinterTempC >= -40 && source.minWinterTempC <= 20) care.minWinterTempC = source.minWinterTempC
  if (typeof source.adultHeightCm === 'number' && Number.isFinite(source.adultHeightCm) && source.adultHeightCm >= 1 && source.adultHeightCm <= 100000) care.adultHeightCm = source.adultHeightCm
  if (['evergreen', 'deciduous'].includes(String(source.foliageType))) care.foliageType = source.foliageType
  if (Array.isArray(source.floweringSeason)) { const seasons = source.floweringSeason.filter((v) => ['spring', 'summer', 'autumn', 'winter'].includes(String(v))); if (seasons.length) care.floweringSeason = seasons }
  if (Array.isArray(source.plantingSeason)) { const seasons = source.plantingSeason.filter((v) => ['spring', 'summer', 'autumn', 'winter', 'yearRound'].includes(String(v))); if (seasons.length) care.plantingSeason = seasons }
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
      '&select=id,catalog,operation,status,created_by,updated_at,payload',
    { headers: adminHeaders },
  )
  if (!submissionResponse.ok) return json({ error: 'Unable to load submission.' }, 502)
  const rows = await submissionResponse.json() as SubmissionRow[]
  const submission = rows[0]
  if (!submission || submission.catalog !== 'plants' || submission.operation !== 'create') return json({ error: 'Plant submission not found.' }, 404)
  if (!['submitted', 'in_review', 'approved', 'publish_failed'].includes(submission.status)) {
    return json({ error: 'Only a plant submission under owner review can be researched.' }, 409)
  }
  const payload = object(submission.payload) || {}
  if (!object(payload.aiDraft)) return json({ error: 'Сначала подгответе основната AI-карта.' }, 409)

  const reviewInput = object(body.reviewInput) || {}
  const plantName = textValue(reviewInput.name ?? payload.name ?? submission.id, 160)
  const scientificName = textValue(reviewInput.scientificName ?? payload.latinName, 160)
  if (!scientificName) return json({ error: 'Введите проверенное латинское ботаническое название.' }, 400)

  let match: Record<string, unknown>
  try {
    const gbifUrl = 'https://api.gbif.org/v1/species/match?name=' + encodeURIComponent(scientificName) + '&kingdom=Plantae&verbose=true'
    const gbifResponse = await fetch(gbifUrl, { headers: { Accept: 'application/json', 'User-Agent': 'Florial/1.0 (+https://florial-bg.com)' } })
    if (!gbifResponse.ok) return json({ error: 'GBIF временно недоступен. Повторите проверку позже.' }, 502)
    match = await gbifResponse.json() as Record<string, unknown>
  } catch {
    return json({ error: 'Не удалось получить таксономические сведения GBIF. Проверьте соединение и повторите попытку.' }, 502)
  }

  const confidence = typeof match.confidence === 'number' ? match.confidence : 0
  const matchType = String(match.matchType || '')
  const rank = String(match.rank || '')
  const taxonomicStatus = String(match.status || '')
  const canonicalName = textValue(match.canonicalName ?? match.scientificName, 180)
  const usageKey = typeof match.usageKey === 'number' ? match.usageKey : null
  const exactSpeciesMatch = matchType === 'EXACT' && confidence >= 95 && rank === 'SPECIES' && taxonomicStatus === 'ACCEPTED' && usageKey !== null
  const identity = {
    status: exactSpeciesMatch ? 'verified' : 'needs_review',
    submittedName: scientificName,
    canonicalName,
    rank,
    confidence,
    matchType,
    taxonomicStatus,
    url: usageKey !== null ? 'https://www.gbif.org/species/' + usageKey : '',
    source: 'GBIF',
    note: 'GBIF confirms taxonomic identity only; it does not verify horticultural care requirements.',
  }

  let plantCare: Record<string, unknown> = {}
  let fieldConfidence: Record<string, string> = {}
  if (exactSpeciesMatch) {
    const prompt = `Prepare cautious horticultural characteristics for the confirmed plant species. This is a suggestion for a human horticulturist, not a verified care database.
Plant supplied by owner: ${plantName}
Owner's scientific name: ${scientificName}
GBIF accepted taxon: ${canonicalName}
GBIF rank: ${rank}; match type: ${matchType}; taxonomy confidence: ${confidence}/100.
Important: GBIF verifies the taxonomic match only. It does NOT provide light, watering, flowering, mature height, winter hardiness or planting-season data. Do not cite GBIF as the source for those horticultural traits.
Return JSON only. Provide only traits that are well established for this accepted species and are not cultivar-specific. For every uncertain field use null or an empty array. Never infer species identity from photos. Do not infer cultivar traits from species traits.
- light: sun, partialShade or shade
- waterNeeds: low, medium or high, based on ordinary established growing conditions
- minWinterTempC: numeric only when a defensible species-level threshold is widely established; otherwise null. Avoid turning USDA zones into a precise temperature.
- adultHeightCm: typical mature species height only; if strongly cultivar-dependent or highly variable, null.
- foliageType: evergreen or deciduous only if established.
- floweringSeason: season names from spring, summer, autumn, winter; empty if not applicable/unknown.
- plantingSeason: spring, summer, autumn, winter, yearRound; account for container-grown plants and Bulgarian climate, but use empty if uncertain.
- blackSeaCoast must always be needsVerification. No verified local coastal trial data was supplied.
Also return confidence for each trait as high, medium or low. This is the model's self-assessment, not independent evidence.
JSON shape:
{"plantCare":{"light":null,"waterNeeds":null,"minWinterTempC":null,"adultHeightCm":null,"foliageType":null,"floweringSeason":[],"plantingSeason":[],"blackSeaCoast":"needsVerification"},"confidence":{"light":"low","waterNeeds":"low","minWinterTempC":"low","adultHeightCm":"low","foliageType":"low","floweringSeason":"low","plantingSeason":"low"}}
Do not include sources or URLs for horticultural traits unless they were explicitly supplied in this request.`
    try {
      const response = await env.AI.run(textModel, {
        messages: [
          { role: 'system', content: 'You are a careful horticultural reference assistant. Return valid JSON only. Never invent a citation or claim a source you did not access.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1400,
        temperature: 0.1,
      })
      const generated = parseModelJson(response)
      plantCare = boundedPlantCare(generated.plantCare)
      const confidenceInput = object(generated.confidence) || {}
      for (const key of ['light', 'waterNeeds', 'minWinterTempC', 'adultHeightCm', 'foliageType', 'floweringSeason', 'plantingSeason']) {
        const value = String(confidenceInput[key] || 'low')
        fieldConfidence[key] = ['high', 'medium', 'low'].includes(value) ? value : 'low'
      }
    } catch {
      return json({ error: 'Таксонът е потвърден от GBIF, но AI не успя да подготви характеристиките. Няма промяна в данните на заявката.' }, 502)
    }
  }

  const careDraft = {
    identity,
    plantCare,
    confidence: fieldConfidence,
    generatedAt: new Date().toISOString(),
    careDataNotice: 'Характеристиките са AI предложения. GBIF е използван само за проверка на таксономичната идентичност; проверете агротехническите данни преди публикация.',
  }
  const nextPayload = { ...payload, plantCareResearch: careDraft }
  const save = await fetch(
    base + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) +
      '&status=eq.' + encodeURIComponent(submission.status) + '&updated_at=eq.' + encodeURIComponent(submission.updated_at),
    {
      method: 'PATCH',
      headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
    },
  )
  if (!save.ok) return json({ error: 'Не удалось сохранить результат ботанической проверки.' }, 502)
  const savedRows = await save.json() as Array<{ id: string }>
  if (!savedRows.length) return json({ error: 'Заявката е променена. Обновете екрана и опитайте отново.' }, 409)
  await fetch(base + '/rest/v1/catalog_submission_events', {
    method: 'POST',
    headers: { ...adminHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      submission_id: submissionId,
      actor_id: caller.id,
      event_type: 'plant_care_researched',
      from_status: submission.status,
      to_status: submission.status,
      note: exactSpeciesMatch
        ? 'GBIF потвърди таксономично съвпадение; AI подготви предложения за грижи за проверка.'
        : 'GBIF не потвърди точно видово съвпадение; агротехнически характеристики не са генерирани.',
      metadata: { identityStatus: identity.status, rank, confidence, matchType, source: 'GBIF' },
    }),
  }).catch(() => undefined)
  return json({ ok: true, careDraft })
}
