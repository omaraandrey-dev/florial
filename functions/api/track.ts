import type { D1Database } from './manager/_lib'
type TrackingEventType = 'page_view' | 'call_bg' | 'call_en_ru' | 'chat_click'
type TrackingLanguage = 'bg' | 'ru' | 'en'

type RuntimeEnv = { DB?: D1Database }

const MAX_BODY_BYTES = 4096
const MAX_PAGE_PATH_LENGTH = 200

const errorResponse = (status: number) => new Response(null, { status })

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request
  env: RuntimeEnv
}) => {
  const contentLength = request.headers.get('content-length')
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) {
    return errorResponse(400)
  }

  let rawBody = ''
  try {
    const reader = request.body?.getReader()
    if (!reader) return errorResponse(400)
    const decoder = new TextDecoder()
    let totalBytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel()
        return errorResponse(400)
      }
      rawBody += decoder.decode(value, { stream: true })
    }
    rawBody += decoder.decode()
  } catch {
    return errorResponse(400)
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return errorResponse(400)
    body = parsed as Record<string, unknown>
  } catch {
    return errorResponse(400)
  }

  const eventTypes: TrackingEventType[] = ['page_view', 'call_bg', 'call_en_ru', 'chat_click']
  const languages: TrackingLanguage[] = ['bg', 'ru', 'en']
  const eventType = body.event_type
  const lang = body.lang
  const pagePath = body.page_path

  if (
    typeof eventType !== 'string' || !eventTypes.includes(eventType as TrackingEventType) ||
    typeof lang !== 'string' || !languages.includes(lang as TrackingLanguage) ||
    typeof pagePath !== 'string' || !pagePath.startsWith('/') ||
    pagePath.length > MAX_PAGE_PATH_LENGTH || /[\u0000-\u001f\u007f?#]/.test(pagePath)
  ) {
    return errorResponse(400)
  }

  if (!env.DB) {
    return errorResponse(500)
  }

  try {
    await env.DB.prepare('INSERT INTO site_events (id,created_at,event_type,lang,page_path) VALUES (?,?,?,?,?)')
      .bind(crypto.randomUUID(), new Date().toISOString(), eventType, lang, pagePath).run()
    return new Response(null, { status: 204 })
  } catch {
    // Do not log request headers, IP addresses, or request payloads.
    return errorResponse(500)
  }
}
