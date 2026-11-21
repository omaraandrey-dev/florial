import { checkSameOrigin, json, newId, nowIso, requireUser, type ManagerEnv } from '../_lib'

const validBase64Url = (value: unknown, min: number, max: number): value is string =>
  typeof value === 'string' && value.length >= min && value.length <= max && /^[A-Za-z0-9_-]+$/.test(value)

export const onRequest = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!['owner', 'manager', 'seller'].includes(auth.user.role)) return json({ error: 'Insufficient permissions.' }, 403)

  if (request.method === 'GET') {
    return env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT
      ? json({ enabled: true, publicKey: env.VAPID_PUBLIC_KEY })
      : json({ enabled: false, publicKey: null })
  }

  if (!['POST', 'DELETE'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405)
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return json({ error: 'Content-Type must be application/json.' }, 415)
  }
  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength > 8192) return json({ error: 'Request body is too large.' }, 413)
  const raw = await request.text()
  if (raw.length > 8192) return json({ error: 'Request body is too large.' }, 413)
  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Invalid request body.' }, 400)
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }

  const endpoint = body.endpoint
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return json({ error: 'Invalid push endpoint.' }, 400)
  let endpointUrl: URL
  try { endpointUrl = new URL(endpoint) } catch { return json({ error: 'Invalid push endpoint.' }, 400) }
  const host = endpointUrl.hostname.toLowerCase()
  const trustedPushHost = host === 'fcm.googleapis.com' ||
    host === 'web.push.apple.com' || host.endsWith('.push.apple.com') ||
    host === 'updates.push.services.mozilla.com' || host.endsWith('.push.services.mozilla.com') ||
    host.endsWith('.notify.windows.com')
  if (endpointUrl.protocol !== 'https:' || endpointUrl.username || endpointUrl.password || !trustedPushHost) {
    return json({ error: 'Push endpoint must use a supported browser push service over HTTPS.' }, 400)
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM manager_push_subscriptions WHERE endpoint=? AND user_id=?')
      .bind(endpoint, auth.user.user_id).run()
    return json({ success: true })
  }

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    return json({ error: 'Push notifications are not configured.' }, 503)
  }
  const keys = body.keys
  if (!keys || typeof keys !== 'object' || Array.isArray(keys)) return json({ error: 'Invalid subscription keys.' }, 400)
  const keyData = keys as Record<string, unknown>
  if (!validBase64Url(keyData.p256dh, 80, 100) || !validBase64Url(keyData.auth, 16, 32)) {
    return json({ error: 'Invalid subscription keys.' }, 400)
  }

  const existing = await env.DB.prepare('SELECT user_id FROM manager_push_subscriptions WHERE endpoint=? LIMIT 1')
    .bind(endpoint).first<{ user_id: string }>()
  if (existing && existing.user_id !== auth.user.user_id) {
    return json({ error: 'This device subscription is already linked to another staff account.' }, 409)
  }

  const now = nowIso()
  await env.DB.prepare(`
    INSERT INTO manager_push_subscriptions(id,user_id,endpoint,p256dh,auth,user_agent,created_at,updated_at,last_seen_at)
    VALUES(?,?,?,?,?,?,?,?,?)
    ON CONFLICT(endpoint) DO UPDATE SET
      p256dh=excluded.p256dh, auth=excluded.auth, user_agent=excluded.user_agent,
      updated_at=excluded.updated_at, last_seen_at=excluded.last_seen_at
    WHERE manager_push_subscriptions.user_id=excluded.user_id
  `).bind(
    newId(), auth.user.user_id, endpoint, keyData.p256dh, keyData.auth,
    (request.headers.get('User-Agent') || '').slice(0, 300) || null, now, now, now,
  ).run()

  return json({ success: true })
}
