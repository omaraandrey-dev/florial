import { authenticate, checkSameOrigin, json, newId, nowIso, randomHex, sessionCookie, sha256Hex, verifyPassword, type ManagerEnv } from '../_lib'

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  let body: { email?: unknown; password?: unknown }
  try { body = await request.json() as typeof body } catch { return json({ error: 'Invalid request.' }, 400) }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 128) return json({ error: 'Невалиден email или парола.' }, 400)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const attemptKey = await sha256Hex(email + '|' + ip)
  const now = nowIso()
  const attempt = await env.DB.prepare('SELECT failed_count,window_started_at,locked_until FROM manager_login_attempts WHERE attempt_key=?').bind(attemptKey).first<{failed_count:number;window_started_at:string;locked_until:string|null}>()
  if (attempt?.locked_until && attempt.locked_until > now) return json({ error: 'Слишком много попыток входа. Попробуйте позже.' }, 429)
  const staff = await env.DB.prepare('SELECT user_id,email,password_salt,password_hash,password_iterations,role,display_name,is_active FROM catalog_staff_profiles WHERE email=? COLLATE NOCASE LIMIT 1').bind(email).first<{
    user_id: string; email: string; password_salt: string; password_hash: string; password_iterations: number; role: string; display_name: string; is_active: number
  }>()
  if (!staff || staff.is_active !== 1 || !await verifyPassword(password, staff.password_salt, staff.password_hash, staff.password_iterations)) {
    const withinWindow = attempt && Date.now() - new Date(attempt.window_started_at).getTime() < 15 * 60 * 1000
    const failedCount = withinWindow ? attempt.failed_count + 1 : 1
    const windowStarted = withinWindow ? attempt.window_started_at : now
    const lockedUntil = failedCount >= 8 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
    await env.DB.prepare('INSERT OR REPLACE INTO manager_login_attempts (attempt_key,failed_count,window_started_at,locked_until) VALUES (?,?,?,?)').bind(attemptKey,failedCount,windowStarted,lockedUntil).run()
    return json({ error: 'Невалиден email или парола.' }, 401)
  }
  await env.DB.prepare('DELETE FROM manager_login_attempts WHERE attempt_key=?').bind(attemptKey).run()
  const token = randomHex(32)
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare('INSERT INTO manager_sessions (id,user_id,token_hash,created_at,last_seen_at,expires_at) VALUES (?,?,?,?,?,?)')
    .bind(newId(), staff.user_id, await sha256Hex(token), now, now, expires).run()
  return json({ ok: true, user: { id: staff.user_id, email: staff.email }, profile: { user_id: staff.user_id, role: staff.role, display_name: staff.display_name, is_active: true } }, 200, { 'Set-Cookie': sessionCookie(token) })
}

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const result = await authenticate(request, env)
  if (result.error || !result.user) return result.error || json({ error: 'Authentication required.' }, 401)
  return json({ user: { id: result.user.user_id, email: result.user.email }, profile: { user_id: result.user.user_id, role: result.user.role, display_name: result.user.display_name, is_active: true, permissions: result.user.permissionsObject } })
}
