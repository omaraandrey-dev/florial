import { d1RestFetch } from './_rest'
import type { ManagerEnv } from './_lib'
type Env = ManagerEnv
type IntakeImage = { path: string; url?: string; assetId?: string; name?: string; size?: number; type?: string }
type SubmissionRow = { id: string; catalog: string; operation: string; status: string; created_by: string; updated_at: string; payload: Record<string, unknown> }
type GbifMatch = { confidence?: number; matchType?: string; rank?: string; status?: string; canonicalName?: string; scientificName?: string; usageKey?: number }
const textModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const visionModel = '@cf/meta/llama-3.2-11b-vision-instruct'
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const textValue = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const isPlaceholderPlantName = (value: string) => /^(эта страница|this page|page title|страница|untitled|new page)$/i.test(value.trim())
function modelText(response: unknown) {
  const result = object(response)
  const value = result?.response ?? result?.result ?? result?.output_text ?? result?.text
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value)
  throw new Error('Моделът с ИИ не върна отговор.')
}
function parseModelJson(response: unknown) {
  const raw = modelText(response).trim().replace(/^\uFEFF/, '')
  const clean = raw.replace(/^\s*\x60{3}(?:json)?/i, '').replace(/\x60{3}\s*$/, '').trim()
  try { return JSON.parse(clean) as Record<string, unknown> } catch { /* extract the first complete JSON object */ }
  const start = clean.indexOf('{')
  if (start >= 0) {
    let depth = 0
    let inString = false
    let escaped = false
    for (let index = start; index < clean.length; index += 1) {
      const character = clean[index]
      if (inString) {
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') inString = false
      } else if (character === '"') inString = true
      else if (character === '{') depth += 1
      else if (character === '}') {
        depth -= 1
        if (depth === 0) return JSON.parse(clean.slice(start, index + 1)) as Record<string, unknown>
      }
    }
  }
  throw new Error('Моделът с ИИ не върна валиден JSON.')
}
async function repairVisionJson(env: Env, response: unknown) {
  const raw = modelText(response).slice(0, 2500)
  const repaired = await env.AI!.run(textModel, {
    messages: [
      { role: 'system', content: 'Convert the supplied vision-model response into exactly one valid JSON object. Do not add facts. If a value is absent or uncertain, use null, an empty string or an empty array as appropriate. Output JSON only.' },
      { role: 'user', content: 'Extract these keys: likelyScientificName (Latin binomial or null), commonName (string), confidence (high, medium or low), alternatives (array up to 2 objects with scientificName and reason), visualEvidence (array up to 3 strings). Preserve uncertainty. Source response:\n' + raw },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
    temperature: 0,
  })
  return parseModelJson(repaired)
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
  if (!response.ok) throw new Error('GBIF временно не е достъпен. Опитайте проверката по-късно.')
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
  const requestId = crypto.randomUUID()
  let stage = 'request_validation'
  let submissionId = ''
  try {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== requestUrl.origin) return json({ error: 'Заявката е от неразрешен източник.' }, 403) }
    catch { return json({ error: 'Невалиден източник на заявката.' }, 403) }
  }
  if (Number(request.headers.get('Content-Length') || 0) > 5000) return json({ error: 'Заявката е твърде голяма.' }, 413)
  if (!env.DB) return json({ error: 'Базата данни D1 не е конфигурирана.' }, 503)
  if (!env.AI?.run) return json({ error: 'Cloudflare Workers AI не е конфигуриран за тази среда.' }, 503)

  let trustedWorkflowUserId = ''
  const fetch = (input: RequestInfo | URL, init?: RequestInit) => d1RestFetch(env, request, input, init, trustedWorkflowUserId || undefined)
  const base = 'https://florial-d1.local'
  const adminHeaders = { apikey: 'D1-compat', Authorization: 'Bearer D1-compat', 'Content-Type': 'application/json' }

  const isWorkflowProcess = requestUrl.pathname.endsWith('/process')
  stage = 'parse_request'
  let body: Record<string, unknown>
  try {
    const parsed = object(await request.json())
    if (!parsed) return json({ error: 'Невалидни данни в заявката.' }, 400)
    body = parsed
  } catch { return json({ error: 'Невалидни данни в заявката.' }, 400) }

  const workflowJobToken = request.headers.get('x-florial-job-token') || ''
  let callerId = ''
  let workflowId = ''
  if (isWorkflowProcess) {
    callerId = textValue(body.callerId, 80)
    workflowId = textValue(body.workflowId, 100)
    if (workflowJobToken.length < 64 || !callerId || !workflowId) return json({ error: 'Невалидно разрешение за изпълнение на работния процес.' }, 403)
    const jobRow = await env.DB.prepare('SELECT payload FROM catalog_submissions WHERE id=?').bind(textValue(body.submissionId,80)).first<{payload:string}>()
    let savedPayload:Record<string,unknown>={}
    try{savedPayload=typeof jobRow?.payload==='string'?JSON.parse(jobRow.payload):object(jobRow?.payload)||{}}catch{savedPayload={}}
    const savedJob=object(savedPayload.plantCareJob)
    if(!savedJob||savedJob.token!==workflowJobToken||savedJob.workflowId!==workflowId||savedJob.requestedBy!==callerId)return json({error:'Невалидно разрешение за изпълнение на работния процес.'},403)
    trustedWorkflowUserId=callerId
  } else {
    const authorization = request.headers.get('Authorization') || ''
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!accessToken) return json({ error: 'Необходима е автентикация.' }, 401)
    stage = 'manager_auth'
    const userResponse = await fetch(base + '/internal-d1/auth/user', { headers: { Authorization: 'Bearer ' + accessToken } })
    if (!userResponse.ok) return json({ error: 'Сесията е невалидна или е изтекла.' }, 401)
    const caller = await userResponse.json() as { id?: string }
    if (!caller.id) return json({ error: 'Невалидна сесия.' }, 401)
    callerId = caller.id
  }

  stage = 'owner_authorization'
  const profileResponse = await fetch(base + '/internal-d1/data/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(callerId) + '&select=role,is_active,permissions', { headers: adminHeaders })
  if (!profileResponse.ok) return json({ error: 'Не успяхме да проверим правата за достъп.' }, 503)
  const profiles = await profileResponse.json() as Array<{ role: string; is_active: boolean; permissions?: { canEditPlantCard?: boolean } }>
  const profile = profiles[0]
  if (!profile || profile.is_active !== true || profile.role !== 'owner' && (profile.role !== 'manager' || profile.permissions?.canEditPlantCard !== true)) return json({ error: 'Нямате право да подготвяте и редактирате картата на растението.' }, 403)

  submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) return json({ error: 'Невалиден идентификатор на заявката.' }, 400)
  stage = 'load_submission'
  const submissionResponse = await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&select=id,catalog,operation,status,created_by,updated_at,payload', { headers: adminHeaders })
  if (!submissionResponse.ok) return json({ error: 'Не успяхме да заредим заявката.' }, 502)
  const rows = await submissionResponse.json() as SubmissionRow[]
  const submission = rows[0]
  if (!submission || submission.catalog !== 'plants' || submission.operation !== 'create') return json({ error: 'Заявката за растението не е намерена.' }, 404)
  if (!['submitted', 'in_review', 'approved', 'publish_failed'].includes(submission.status)) return json({ error: 'Ботаническа проверка е възможна само за заявка за растение, която е в процес на преглед.' }, 409)
  const payload = object(submission.payload) || {}
  const aiDraft = object(payload.aiDraft)
  if (!aiDraft) return json({ error: 'Сначала подгответе основната AI-карта.' }, 409)

  const reviewInput = object(body.reviewInput) || {}
  const requestedPlantName = textValue(reviewInput.name, 160)
  const storedPlantName = textValue(aiDraft.name ?? payload.name ?? payload.title, 160)
  const plantName = isPlaceholderPlantName(requestedPlantName) ? (storedPlantName || submission.id) : (requestedPlantName || storedPlantName || submission.id)
  const scientificName = textValue(reviewInput.scientificName ?? aiDraft.scientificName ?? payload.latinName, 160)
  const sellerBinomial = speciesBinomial(scientificName)
  const sellerImages = Array.isArray(payload.images) ? payload.images as IntakeImage[] : []
  const selectedImages = Array.isArray(payload.reviewImages) ? payload.reviewImages as IntakeImage[] : sellerImages
  if (!selectedImages.length) return json({ error: 'За ботаническата проверка е необходима поне една снимка на растението.' }, 400)
  if (selectedImages.length > 10 || selectedImages.some((image) => !image || !sellerImages.some((original) => original.path === image.path))) return json({ error: 'Списъкът със снимки към заявката е невалиден (максимум 10). Обновете картата и повторете проверката.' }, 400)
  if (selectedImages.some((image) => typeof image.assetId !== 'string' || !/^image-[A-Za-z0-9-]+$/.test(image.assetId) ||
      typeof (image.url || image.path) !== 'string' || !/^https:\/\/cdn\.sanity\.io\/images\/bxvcy0qs\/plants\//i.test(image.url || image.path))) {
    return json({ error: 'Снимката не принадлежи към Sanity Assets на каталога с растения.' }, 400)
  }

  if (isWorkflowProcess) {
    const activeJob = object(payload.plantCareJob) || {}
    if (activeJob.workflowId === workflowId && activeJob.requestedBy === callerId && activeJob.status === 'completed' && payload.plantCareResearch) {
      return json({ ok: true, careDraft: payload.plantCareResearch, idempotent: true })
    }
    if (activeJob.token !== workflowJobToken || activeJob.workflowId !== workflowId || activeJob.requestedBy !== callerId) {
      return json({ error: 'Ботаническата задача е невалидна или вече е приключила.' }, 403)
    }
  } else {
    if (payload.plantCareResearch) return json({ error: 'Ботаническата проверка вече е завършена. Обновете картата.' }, 409)
    if (!env.PLANT_CARE_WORKFLOW?.fetch) return json({ error: 'Фоновата услуга за ботаническа проверка не е свързана.' }, 503)

    const existingJob = object(payload.plantCareJob) || {}
    const existingWorkflowId = textValue(existingJob.workflowId, 100)
    if (existingWorkflowId && existingJob.status === 'queued') {
      try {
        const statusResponse = await env.PLANT_CARE_WORKFLOW.fetch(new Request('https://plant-care-workflow/status?id=' + encodeURIComponent(existingWorkflowId)))
        const statusBody = object(await statusResponse.json())
        const status = object(statusBody?.status)
        if (['queued', 'running', 'paused'].includes(String(status?.status || ''))) {
          return json({ ok: true, queued: true, workflowId: existingWorkflowId, status: status?.status || 'queued' }, 202)
        }
      } catch { /* A stale workflow may be replaced with a new instance below. */ }
    }

    const jobToken = crypto.randomUUID() + crypto.randomUUID()
    workflowId = submissionId + '-' + crypto.randomUUID()
    const startedAt = new Date().toISOString()
    const queuedPayload = {
      ...payload,
      plantCareJob: { status: 'queued', workflowId, token: jobToken, requestedBy: callerId, startedAt },
    }
    const queueSave = await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status) + '&updated_at=eq.' + encodeURIComponent(submission.updated_at), {
      method: 'PATCH', headers: { ...adminHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ payload: queuedPayload, updated_at: startedAt }),
    })
    if (!queueSave.ok) return json({ error: 'Не успяхме да запазим ботаническата задача преди стартирането.' }, 502)
    const queuedRows = await queueSave.json() as Array<{ id: string }>
    if (!queuedRows.length) return json({ error: 'Заявката е променена. Обновете екрана и опитайте отново.' }, 409)

    const startResponse = await env.PLANT_CARE_WORKFLOW.fetch(new Request('https://plant-care-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, callerId, workflowId, jobToken, reviewInput: { name: plantName, scientificName } }),
    }))
    const startBody = object(await startResponse.json().catch(() => ({}))) || {}
    if (!startResponse.ok) {
      const failedPayload = {
        ...queuedPayload,
        plantCareJob: { status: 'failed', workflowId, token: null, requestedBy: callerId, startedAt, error: textValue(startBody.error, 300) || 'Workflow start failed.' },
      }
      await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status), {
        method: 'PATCH', headers: adminHeaders,
        body: JSON.stringify({ payload: failedPayload, updated_at: new Date().toISOString() }),
      }).catch(() => undefined)
      return json({ error: textValue(startBody.error, 300) || 'Не успяхме да стартираме фоновата ботаническа проверка.', detail: startBody.detail || null }, 503)
    }
    return json({ ok: true, queued: true, workflowId, status: startBody.status || 'queued', message: 'Ботаническата проверка е приета и се изпълнява във фонов режим.' }, 202)
  }

  stage = 'validate_images'
  // Only the first selected photo (main image) is sent to Workers AI Vision.
  // Keep all selected photos intact in the seller submission and publication payload.
  const imagesToAnalyse = selectedImages.slice(0, 1)
  const diagnosticSteps: Array<Record<string, unknown>> = [{ stage: 'request_validated', ok: true, plantNameProvided: !!plantName, scientificNameProvided: !!scientificName, selectedImageCount: selectedImages.length, imageCountSentToAI: imagesToAnalyse.length }]
  const visualResults: Array<Record<string, unknown>> = []
  const visualNames: Array<{ name: string; confidence: string; count: number; evidence: string[] }> = []
  try {
    for (let index = 0; index < imagesToAnalyse.length; index += 1) {
      const image = imagesToAnalyse[index]
      const imageUrl = image.url || image.path
      stage = 'load_photo_' + (index + 1)
      if (!/^https:\/\//i.test(imageUrl)) return json({ error: 'Снимка ' + (index + 1) + ' не съдържа връзка към Sanity Asset.' }, 400)
      const download = await fetch(imageUrl)
      if (!download.ok) return json({ error: 'Не успяхме да отворим снимка ' + (index + 1) + ' от Sanity Assets.' }, 502)
      const contentType = (download.headers.get('content-type') || image.type || '').split(';')[0].trim().toLowerCase()
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) return json({ error: 'За ботаническо разпознаване използвайте JPG, PNG или WebP. Преобразувайте HEIC в JPG и качете снимката отново.' }, 400)
      const bytes = new Uint8Array(await download.arrayBuffer())
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) return json({ error: 'Снимка ' + (index + 1) + ' е празна или надвишава 10 MB.' }, 400)
      stage = 'vision_image_' + (index + 1)
      const visionResponse = await env.AI.run(visionModel, {
        messages: [
          { role: 'system', content: 'You are a cautious botanical image-assessment assistant. Independently assess the visible plant; do not assume the seller botanical name is correct. A photograph is not sufficient to confirm a species. Never claim certainty, never identify a cultivar from an image. Return exactly one valid JSON object and no prose or markdown.' },
          { role: 'user', content: 'Inspect only visible botanical characteristics in this photo. Return JSON with exactly these keys: likelyScientificName (Latin binomial or null), commonName (string), confidence (high, medium, or low), alternatives (array of up to 2 objects with scientificName and reason), visualEvidence (array of up to 3 short visible clues). If species is unclear, use null and low. Never guess cultivar or variety. Output JSON only.' },
        ],
        image: 'data:' + contentType + ';base64,' + bytesToBase64(bytes),
        max_tokens: 500,
        temperature: 0,
      })
      let visual: Record<string, unknown>
      try {
        visual = parseModelJson(visionResponse)
      } catch {
        // Vision model does not consistently emit parseable JSON; normalize its response with the supported text-model JSON mode.
        visual = await repairVisionJson(env, visionResponse)
        diagnosticSteps.push({ stage: 'vision_json_repair', ok: true, model: textModel })
      }
      diagnosticSteps.push({ stage: 'vision_image_' + (index + 1), ok: true, model: visionModel, responseParsed: true })
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
    if (/license|licence|acceptable use|prompt.*agree/i.test(message)) return json({ error: 'Cloudflare изисква предварително приемане на лиценза на Meta за модела за разпознаване на изображения. Проверката по снимка временно не е достъпна; данните по заявката не са променени.' }, 503)
    return json({ error: 'Не успяхме да анализираме снимката на растението. Опитайте отново по-късно. Данните по заявката не са променени.', diagnostics: [...diagnosticSteps, { stage: 'vision_analysis', ok: false, model: visionModel, detail: message }] }, 502)
  }

  const rankedVisual = visualNames.filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count || ['high', 'medium', 'low'].indexOf(a.confidence) - ['high', 'medium', 'low'].indexOf(b.confidence))
  const visualCandidate = rankedVisual[0] || null
  const visualDisagreement = rankedVisual.length > 1 && rankedVisual[0].count === rankedVisual[1].count
  const commonNameCandidates: Array<{ name: string; confidence: string; reason: string }> = []
  if (!sellerBinomial) {
    stage = 'generate_common_name_candidates'
    try {
      const nameResponse = await env.AI.run(textModel, {
        messages: [
          { role: 'system', content: 'You are a cautious botanical nomenclature assistant. Return valid JSON only. Never infer a species from a photograph.' },
          { role: 'user', content: [
            'Suggest possible botanical species from the seller-provided common/display name only. Do not use photographs or visual assumptions.',
            'Plant name exactly as entered: ' + plantName,
            'Plant type: ' + textValue(aiDraft.productType ?? payload.productType, 40),
            'Category: ' + textValue(aiDraft.categoryName ?? payload.categoryName, 120),
            'Description supplied by seller: ' + textValue(aiDraft.description ?? payload.description, 500),
            'Return up to 3 plausible species candidates, each with a Latin binomial, confidence (high, medium, low), and a short reason in Russian.',
            'If the common name is ambiguous, return multiple candidates with medium/low confidence. If there is no defensible candidate, return an empty array. Never invent a cultivar.',
            'JSON shape: {"candidates":[{"scientificName":"Olea europaea","confidence":"high","reason":"Общепринятое ботаническое соответствие названию маслина"}]}',
          ].join('\\n') },
        ],
        response_format: { type: 'json_object' }, max_tokens: 700, temperature: 0.1,
      })
      const suggested = parseModelJson(nameResponse)
      if (Array.isArray(suggested.candidates)) {
        for (const item of suggested.candidates.slice(0, 3)) {
          const candidate = object(item) || {}
          const name = speciesBinomial(textValue(candidate.scientificName, 120))
          const confidence = String(candidate.confidence || 'low').toLowerCase()
          if (!name || commonNameCandidates.some((entry) => normalizedName(entry.name) === normalizedName(name))) continue
          commonNameCandidates.push({
            name,
            confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'low',
            reason: textValue(candidate.reason, 180),
          })
        }
      }
    } catch (error) {
      diagnosticSteps.push({ stage: 'common_name_candidates', ok: false, model: textModel, detail: error instanceof Error ? error.message : String(error) })
    }
  }
  if (!diagnosticSteps.some((step) => step.stage === 'common_name_candidates')) diagnosticSteps.push({ stage: 'common_name_candidates', ok: true, candidateCount: commonNameCandidates.length, model: textModel })
  let sellerMatch: GbifMatch | null = null
  let visualMatch: GbifMatch | null = null
  let nameCandidateMatches: Array<{ candidate: { name: string; confidence: string; reason: string }; match: GbifMatch | null }> = []
  stage = 'gbif_taxonomy'
  try {
    if (sellerBinomial) sellerMatch = await matchGbif(sellerBinomial)
    if (visualCandidate && !visualDisagreement) visualMatch = await matchGbif(visualCandidate.name)
    nameCandidateMatches = await Promise.all(commonNameCandidates.map(async (candidate) => ({
      candidate, match: await matchGbif(candidate.name),
    })))
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Не успяхме да проверим името чрез GBIF.', diagnostics: [...diagnosticSteps, { stage: 'gbif_taxonomy', ok: false, detail: error instanceof Error ? error.message : String(error) }] }, 502) }

  diagnosticSteps.push({ stage: 'gbif_taxonomy', ok: true, sellerAccepted: acceptedSpecies(sellerMatch), visualAccepted: acceptedSpecies(visualMatch), commonNameCandidateCount: nameCandidateMatches.length, acceptedCommonNameCandidateCount: nameCandidateMatches.filter((entry) => acceptedSpecies(entry.match)).length })
  const sellerAccepted = acceptedSpecies(sellerMatch)
  const visualAccepted = acceptedSpecies(visualMatch)
  const sellerCanonical = textValue(sellerMatch?.canonicalName ?? sellerMatch?.scientificName, 180)
  const visualCanonical = textValue(visualMatch?.canonicalName ?? visualMatch?.scientificName, 180)
  const visualHasUsefulConfidence = !!visualCandidate && visualCandidate.confidence !== 'low'
  const acceptedNameCandidates = nameCandidateMatches.filter((entry) => acceptedSpecies(entry.match))
  const photoMatchesSeller = sellerAccepted && visualAccepted && visualHasUsefulConfidence && normalizedName(sellerCanonical) === normalizedName(visualCanonical)
  const photoMismatch = !!visualCandidate && !visualDisagreement && visualHasUsefulConfidence && sellerAccepted && visualAccepted && !photoMatchesSeller
  const photoAssessment = visualDisagreement ? 'multiple' : photoMatchesSeller ? 'match' : photoMismatch ? 'mismatch' : !sellerAccepted && visualAccepted ? 'candidate_only' : 'inconclusive'

  let careMatch: GbifMatch | null = null
  let careTaxon = ''
  let careIsProvisional = false
  let careSource = 'seller_name'
  if ((photoMismatch || photoAssessment === 'candidate_only') && visualAccepted && visualCandidate && visualCandidate.confidence !== 'low') {
    careMatch = visualMatch; careTaxon = visualCanonical; careIsProvisional = true; careSource = 'photo'
  } else if (sellerAccepted) {
    careMatch = sellerMatch; careTaxon = sellerCanonical; careIsProvisional = photoAssessment !== 'match'
  } else if (acceptedNameCandidates.length === 1 && acceptedNameCandidates[0].candidate.confidence === 'high') {
    careMatch = acceptedNameCandidates[0].match
    careTaxon = textValue(careMatch?.canonicalName ?? careMatch?.scientificName, 180)
    careIsProvisional = true
    careSource = 'common_name'
  }

  let plantCare: Record<string, unknown> = {}
  let careGuide = ''
  let fieldConfidence: Record<string, string> = {}
  if (careMatch && careTaxon) {
    stage = 'care_generation'
    const prompt = [
      'Prepare cautious horticultural characteristics for this accepted plant species. This is a suggestion for a human horticulturist, not a verified care database.',
      'Plant common/display name: ' + plantName,
      'Seller botanical name: ' + (sellerBinomial || 'not supplied'),
      'Selected accepted GBIF species for this suggestion: ' + careTaxon,
      'Basis: ' + (careIsProvisional ? (careSource === 'common_name' ? 'provisional candidate suggested from the seller common name and matched to an accepted GBIF species; owner must confirm identity' : 'provisional candidate suggested from the plant photograph; owner must confirm species identity') : 'seller botanical name accepted by GBIF and visually consistent with the photograph') + '.',
      'GBIF verifies taxonomic identity only. It does NOT provide horticultural traits. Do not cite GBIF for light, watering, flowering, mature height, winter hardiness or planting season. Do not claim the photo confirms the species.',
      'Return JSON only. Provide only traits well established for this species and not cultivar-specific. For uncertain fields use null or empty arrays. Never invent values.',
      'light: sun, partialShade or shade; waterNeeds: low, medium or high.',
      'minWinterTempC: numeric only when a defensible species-level threshold is widely established; otherwise null. Do not convert USDA zones to a precise temperature.',
      'adultHeightCm: typical mature species height only; if cultivar-dependent or highly variable, null.',
      'foliageType: evergreen or deciduous only if established.',
      'floweringSeason: spring, summer, autumn, winter; empty if unknown or not applicable.',
      'plantingSeason: spring, summer, autumn, winter, yearRound; account for container-grown plants and Bulgarian climate; empty if uncertain.',
      'blackSeaCoast must always be needsVerification. No verified local coastal trial data was supplied.',
      'Also prepare a concise practical careGuide in Bulgarian, covering light, watering, soil/drainage, feeding, pruning and winter protection only where defensible. State that species identity is provisional when applicable. Do not invent fixed schedules or quantities.',
      'Return confidence for each trait as high, medium or low; this is model self-assessment, not independent evidence.',
      '{"plantCare":{"light":null,"waterNeeds":null,"minWinterTempC":null,"adultHeightCm":null,"foliageType":null,"floweringSeason":[],"plantingSeason":[],"blackSeaCoast":"needsVerification"},"confidence":{"light":"low","waterNeeds":"low","minWinterTempC":"low","adultHeightCm":"low","foliageType":"low","floweringSeason":"low","plantingSeason":"low"},"careGuide":""}',
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
      careGuide = textValue(generated.careGuide, 4000)
      for (const key of ['light', 'waterNeeds', 'minWinterTempC', 'adultHeightCm', 'foliageType', 'floweringSeason', 'plantingSeason']) {
        const value = String(confidenceInput[key] || 'low')
        fieldConfidence[key] = ['high', 'medium', 'low'].includes(value) ? value : 'low'
      }
    } catch (error) { return json({ error: 'Таксономичният кандидат е определен, но ИИ не успя да подготви характеристиките. Данните по заявката не са променени.', diagnostics: [...diagnosticSteps, { stage: 'care_generation', ok: false, model: textModel, selectedTaxon: careTaxon, detail: error instanceof Error ? error.message : String(error) }] }, 502) }
  }

  diagnosticSteps.push({ stage: 'care_generation', ok: true, generatedCareFieldCount: Object.keys(plantCare).length, careGuideGenerated: !!careGuide, selectedTaxon: careTaxon || null, careSource })
  const identityStatus = photoMismatch ? 'photo_name_mismatch' : photoAssessment === 'candidate_only' ? 'photo_candidate_suggested' : photoMatchesSeller ? 'verified' : sellerAccepted ? 'taxonomy_verified_photo_inconclusive' : careSource === 'common_name' && careTaxon ? 'taxonomy_verified_photo_inconclusive' : 'needs_review'
  const displayMatch = careMatch || (sellerAccepted ? sellerMatch : null)
  const visualCandidates = [...rankedVisual.slice(0, 3), ...visualNames.filter((entry) => entry.count === 0).slice(0, 2)].map((entry) => ({ scientificName: entry.name, confidence: entry.confidence, photoCount: entry.count, visualEvidence: entry.evidence.slice(0, 4) }))
  const nameCandidates = nameCandidateMatches.map(({ candidate, match }) => ({
    scientificName: candidate.name, confidence: candidate.confidence, reason: candidate.reason,
    gbif: gbifSummary(match), accepted: acceptedSpecies(match),
  }))
  const careDraft = {
    identity: {
      status: identityStatus, submittedName: scientificName, sellerGbif: gbifSummary(sellerMatch),
      visualCandidates, nameCandidates, visualResults, visualSuggestedScientificName: visualDisagreement ? '' : visualCandidate?.name || '',
      suggestedScientificName: careIsProvisional ? careTaxon : '',
      visualGbif: gbifSummary(visualMatch), photoAssessment, imageCountAnalysed: imagesToAnalyse.length,
      canonicalName: careTaxon || (sellerAccepted ? sellerCanonical : ''),
      rank: displayMatch?.rank || '',
      confidence: displayMatch?.confidence || 0,
      matchType: displayMatch?.matchType || '',
      url: typeof displayMatch?.usageKey === 'number' ? 'https://www.gbif.org/species/' + displayMatch.usageKey : '',
      careTaxon, careIsProvisional, careSource, source: 'GBIF + Cloudflare Workers AI',
      note: 'GBIF confirms taxonomy only. Image recognition and common-name matching are preliminary AI suggestions and must be checked by the owner.',
    },
    plantCare, careGuide, confidence: fieldConfidence, generatedAt: new Date().toISOString(),
    careDataNotice: 'Агротехническите характеристики са AI предложения по приетото таксономично име. GBIF потвърждава само таксономията. Разпознаването по снимка е предварително. Всички стойности и идентичността на растението трябва да бъдат проверени от собственика преди публикация.',
  }
  const nextAiDraft = {
    ...aiDraft,
    scientificName: sellerBinomial || (careIsProvisional ? careTaxon : (sellerAccepted ? sellerCanonical : '')),
    careGuide: textValue(aiDraft.careGuide, 4000) || careGuide,
  }
  const nextPayload = { ...payload, aiDraft: nextAiDraft, plantCareResearch: careDraft, plantCareJob: { status: 'completed', workflowId, token: null, requestedBy: callerId, finishedAt: new Date().toISOString() } }
  stage = 'save_submission'
  const save = await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&status=eq.' + encodeURIComponent(submission.status) + '&updated_at=eq.' + encodeURIComponent(submission.updated_at), {
    method: 'PATCH', headers: { ...adminHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({ payload: nextPayload, updated_at: new Date().toISOString() }),
  })
  if (!save.ok) return json({ error: 'Не успяхме да запазим резултата от ботаническата проверка.', diagnostics: [...diagnosticSteps, { stage: 'save_submission', ok: false, httpStatus: save.status }] }, 502)
  const savedRows = await save.json() as Array<{ id: string }>
  if (!savedRows.length) return json({ error: 'Заявката е променена. Обновете екрана и опитайте отново.', diagnostics: [...diagnosticSteps, { stage: 'save_submission', ok: false, reason: 'optimistic_lock_conflict' }] }, 409)
  stage = 'write_audit_event'
  await fetch(base + '/internal-d1/data/catalog_submission_events', {
    method: 'POST', headers: { ...adminHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      submission_id: submissionId, actor_id: callerId, event_type: 'plant_care_researched',
      from_status: submission.status, to_status: submission.status,
      note: photoMismatch ? 'AI photo check suggests a different botanical species; owner review required.' :
        photoMatchesSeller ? 'GBIF taxonomy and AI photo assessment are visually consistent; care suggestions prepared for owner review.' :
          careTaxon ? 'Care suggestions prepared from a provisional GBIF-accepted photo candidate; owner confirmation required.' :
            'Photo and seller name did not yield a sufficiently reliable species identification; no care suggestions generated.',
      metadata: { identityStatus, photoAssessment, careTaxon, imageCountAnalysed: imagesToAnalyse.length, source: 'GBIF + Cloudflare Workers AI Vision' },
    }),
  }).catch(() => undefined)
  diagnosticSteps.push({ stage: 'save_submission', ok: true }, { stage: 'completed', ok: true })
  stage = 'completed'
  return json({ ok: true, careDraft, diagnostics: diagnosticSteps, requestId })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    console.error('[florial:plant-care-unhandled]', JSON.stringify({
      requestId, stage, submissionId: submissionId || null, errorName, detail: detail.slice(0, 500),
    }))
    return new Response(JSON.stringify({
      error: 'Ботаническая проверка прервалась до формирования штатного ответа.',
      diagnostics: [{
        stage, ok: false, code: 'BOTANICAL_UNHANDLED_ERROR', requestId,
        errorName, detail: detail.slice(0, 500),
      }],
      requestId,
    }), {
      status: 502,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-florial-request-id': requestId,
      },
    })
  }
}


export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const requestUrl = new URL(request.url)
    const origin = request.headers.get('Origin')
    if (origin) {
      try { if (new URL(origin).origin !== requestUrl.origin) return json({ error: 'Заявката е от неразрешен източник.' }, 403) }
      catch { return json({ error: 'Невалиден източник на заявката.' }, 403) }
    }
    if (!env.DB || !env.PLANT_CARE_WORKFLOW?.fetch) {
      return json({ error: 'Услугата за фонови процеси на Manager не е конфигурирана.' }, 503)
    }
    const authorization = request.headers.get('Authorization') || ''
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!accessToken) return json({ error: 'Необходима е автентикация.' }, 401)
    const fetch = (input: RequestInfo | URL, init?: RequestInit) => d1RestFetch(env, request, input, init)
    const base = 'https://florial-d1.local'
    const adminHeaders = { apikey: 'D1-compat', Authorization: 'Bearer D1-compat' }
    const userResponse = await fetch(base + '/internal-d1/auth/user', { headers: { Authorization: 'Bearer ' + accessToken } })
    if (!userResponse.ok) return json({ error: 'Сесията е невалидна или е изтекла.' }, 401)
    const caller = await userResponse.json() as { id?: string }
    if (!caller.id) return json({ error: 'Невалидна сесия.' }, 401)
    const profileResponse = await fetch(base + '/internal-d1/data/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(caller.id) + '&select=role,is_active', { headers: adminHeaders })
    if (!profileResponse.ok) return json({ error: 'Не успяхме да проверим правата за достъп.' }, 503)
    const profiles = await profileResponse.json() as Array<{ role: string; is_active: boolean; permissions?: { canEditPlantCard?: boolean } }>
    const profile = profiles[0]
    if (!profile || profile.is_active !== true || profile.role !== 'owner' && (profile.role !== 'manager' || profile.permissions?.canEditPlantCard !== true)) return json({ error: 'Нямате право да подготвяте и редактирате картата на растението.' }, 403)

    const submissionId = requestUrl.searchParams.get('submissionId') || ''
    const workflowId = requestUrl.searchParams.get('workflowId') || ''
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId) || !workflowId.startsWith(submissionId + '-') || workflowId.length > 100) {
      return json({ error: 'Невалидна препратка към ботаническата проверка.' }, 400)
    }
    const submissionResponse = await fetch(base + '/internal-d1/data/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) + '&select=id,catalog,operation,payload', { headers: adminHeaders })
    if (!submissionResponse.ok) return json({ error: 'Не успяхме да проверим ботаническата задача.' }, 502)
    const rows = await submissionResponse.json() as Array<{ id: string; catalog: string; operation: string; payload: Record<string, unknown> }>
    const submission = rows[0]
    const job = object(object(submission?.payload)?.plantCareJob)
    if (!submission || submission.catalog !== 'plants' || submission.operation !== 'create' || job?.workflowId !== workflowId || job?.requestedBy !== caller.id) {
      return json({ error: 'Не е намерена ботаническа задача за тази заявка.' }, 404)
    }

    const statusResponse = await env.PLANT_CARE_WORKFLOW.fetch(new Request('https://plant-care-workflow/status?id=' + encodeURIComponent(workflowId)))
    const statusBody = await statusResponse.json().catch(() => ({})) as Record<string, unknown>
    return json(statusBody, statusResponse.status)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('[florial:plant-care-workflow-status]', detail.slice(0, 400))
    return json({ error: 'Не успяхме да получим състоянието на фоновата ботаническа проверка.', detail: detail.slice(0, 400) }, 502)
  }
}
