import { authenticate, clearSessionCookie, json, type ManagerEnv } from '../_lib'

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  const { user } = await authenticate(request, env)
  if (user) await env.DB.prepare('DELETE FROM manager_sessions WHERE id=?').bind((user as any).session_id).run()
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() })
}
