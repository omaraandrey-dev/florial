import { json, requireUser, type ManagerEnv } from '../_lib'
import { sendManagerPushToSubscriptions } from '../push-dispatch'

type SubscriptionRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  const auth = await requireUser(request, env, ['owner'])
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403) }
    catch { return json({ error: 'Origin not allowed.' }, 403) }
  }
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return json({ error: 'Origin not allowed.' }, 403)
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return json({ error: 'Push notifications are not configured.' }, 503)

  try {
    const subscriptions = await env.DB.prepare(`
      SELECT s.id,s.user_id,s.endpoint,s.p256dh,s.auth
      FROM manager_push_subscriptions s
      JOIN catalog_staff_profiles p ON p.user_id=s.user_id
      WHERE s.user_id=? AND p.user_id=? AND p.role='owner' AND p.is_active=1
    `).bind(auth.user.user_id, auth.user.user_id).all<SubscriptionRow>()
    if (!subscriptions.results?.length) return json({ error: 'Няма активирани известия за профила на собственика.' }, 409)
    const payload = JSON.stringify({ title: 'Тестово известие', body: 'Известията на Florial Manager работят.', url: '/manager/' })
    const result = await sendManagerPushToSubscriptions(env, subscriptions.results, payload)
    return json({ success: true, attempted: result.attempted, accepted: result.accepted, expired: result.expired, failed: result.failed, diagnostics: result.diagnostics })
  } catch (error) {
    console.error('Manager test push failed:', error instanceof Error ? error.message : 'unknown')
    return json({ error: 'Не успяхме да изпратим тестовото известие.' }, 502)
  }
}
