import { hashPassword, json, newId, nowIso, randomHex, sessionCookie, verifyPassword, type ManagerEnv } from '../_lib'

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  const origin = request.headers.get('Origin')
  if (origin) { try { if (new URL(origin).origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403) } catch { return json({ error: 'Invalid origin.' }, 403) } }
  let body: { email?: unknown; password?: unknown }
  try { body = await request.json() as typeof body } catch { return json({ error: 'Invalid request.' }, 400) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 128) return json({ error: 'Невалиден email или парола.' }, 400)
  const staff = await env.DB.prepare('SELECT user_id,email,password_salt,password_hash,password_iterations,role,display_name,is_active FROM catalog_staff_profiles WHERE email=? COLLATE NOCASE LIMIT 1').bind(email).first<{
    user_id: string; email: string; password_salt: string; password_hash: string; password_iterations: number; role: string; display_name: string; is_active: number
  }>()
  if (!staff || staff.is_active !== 1 || !await verifyPassword(password, staff.password_salt, staff.password_hash, staff.password_iterations)) {
    return json({ error: 'Невалиден email или парола.' }, 401)
  }
  const token = randomHex(32)
  const now = nowIso()
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare('INSERT INTO manager_sessions (id,user_id,token_hash,created_at,last_seen_at,expires_at) VALUES (?,?,?,?,?,?)')
    .bind(newId(), staff.user_id, await (async () => {
      const bytes = new TextEncoder().encode(token)
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
      return Array.from(digest, (b) => b.toString(16).padStart(2,'0')).join('')
    })(), now, now, expires).run()
  return json({ ok: true, user: { id: staff.user_id, email: staff.email }, profile: { user_id: staff.user_id, role: staff.role, display_name: staff.display_name, is_active: true } }, 200, { 'Set-Cookie': sessionCookie(token) })
}

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const { authenticate } = await import('../_lib')
  const result = await authenticate(request, env)
  if (result.error || !result.user) return result.error || json({ error: 'Authentication required.' }, 401)
  return json({ user: { id: result.user.user_id, email: result.user.email }, profile: { user_id: result.user.user_id, role: result.user.role, display_name: result.user.display_name, is_active: true, permissions: result.user.permissionsObject } })
}
