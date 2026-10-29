type TrackingEventType = 'page_view' | 'call_bg' | 'call_en_ru' | 'chat_click'
type TrackingLanguage = 'bg' | 'ru' | 'en'

type RuntimeEnv = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

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

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return errorResponse(400)
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
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

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse(500)
  }

  try {
    const response = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/site_events', {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_type: eventType,
        lang,
        page_path: pagePath,
      }),
    })

    return response.ok ? new Response(null, { status: 204 }) : errorResponse(500)
  } catch {
    // Do not log request headers, IP addresses, or request payloads.
    return errorResponse(500)
  }
}
