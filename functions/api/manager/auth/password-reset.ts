import { checkSameOrigin, hashPassword, json, nowIso, sha256Hex, type ManagerEnv } from '../_lib'

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  let body: { token?: unknown; password?: unknown }
  try { body = await request.json() as typeof body } catch { return json({ error: 'Invalid request.' }, 400) }
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!/^[a-f0-9]{64}$/i.test(token) || password.length < 12 || password.length > 128) return json({ error: 'Невалиден линк или парола. Паролата трябва да съдържа между 12 и 128 символа.' }, 400)
  const tokenHash = await sha256Hex(token)
  const now = nowIso()
  const { salt, hash, iterations } = await hashPassword(password)
  const claimed = await env.DB.prepare('UPDATE manager_password_reset_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>? RETURNING user_id').bind(now, tokenHash, now).first<{ user_id: string }>()
  if (!claimed) return json({ error: 'Линкът е изтекъл или вече е използван. Помолете собственика да изпрати нов.' }, 410)
  const updated = await env.DB.prepare('UPDATE catalog_staff_profiles SET password_salt=?,password_hash=?,password_iterations=?,updated_at=? WHERE user_id=? AND is_active=1').bind(salt, hash, iterations, now, claimed.user_id).run()
  if (!updated.meta?.changes) return json({ error: 'Акаунтът не е активен. Обърнете се към собственика.' }, 409)
  await env.DB.prepare('DELETE FROM manager_sessions WHERE user_id=?').bind(claimed.user_id).run()
  return json({ ok: true })
}
