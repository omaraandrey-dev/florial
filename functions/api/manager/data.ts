import { json, requireUser, type ManagerEnv } from './_lib'

const profileColumns = new Set(['user_id','email','role','display_name','is_active','permissions','created_at','updated_at'])

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403) }
    catch { return json({ error: 'Origin not allowed.' }, 403) }
  }
  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> } catch { return json({ error: 'Invalid request.' }, 400) }
  if (body.table !== 'catalog_staff_profiles' || body.action !== 'select') return json({ error: 'Table or action is no longer available.' }, 400)
  const selected = typeof body.select === 'string' ? body.select.split(',').map((item) => item.trim()).filter(Boolean) : []
  if (!selected.length || selected.some((column) => !profileColumns.has(column))) return json({ error: 'Invalid columns.' }, 400)
  const result = await env.DB.prepare('SELECT ' + selected.join(',') + ' FROM catalog_staff_profiles WHERE user_id=? LIMIT 1')
    .bind(auth.user.user_id).all<Record<string, unknown>>()
  return json({ data: result.results.map((row) => {
    const next = { ...row }
    if (typeof next.permissions === 'string') { try { next.permissions = JSON.parse(next.permissions) } catch { /* retain invalid legacy data for diagnostics */ } }
    if (typeof next.is_active === 'number') next.is_active = next.is_active === 1
    return next
  }), error: null })
}

export const onRequest = onRequestPost
