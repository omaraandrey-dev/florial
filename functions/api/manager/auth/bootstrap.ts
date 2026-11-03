import { checkSameOrigin, hashPassword, json, newId, nowIso, type ManagerEnv } from '../_lib'

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const requestId = crypto.randomUUID()
  let stage = 'configuration'

  try {
    if (!env.DB || !env.MANAGER_BOOTSTRAP_SECRET) return json({ error: 'Owner bootstrap is not configured.' }, 503)

    stage = 'origin_check'
    if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
    if (request.headers.get('X-Florial-Bootstrap-Secret') !== env.MANAGER_BOOTSTRAP_SECRET) return json({ error: 'Invalid bootstrap secret.' }, 403)

    stage = 'owner_lookup'
    const owner = await env.DB.prepare("SELECT user_id FROM catalog_staff_profiles WHERE role='owner' LIMIT 1").first()
    if (owner) return json({ error: 'Owner account already exists. Bootstrap is permanently disabled.' }, 409)

    stage = 'request_body'
    let body: { email?: unknown; password?: unknown; displayName?: unknown }
    try { body = await request.json() as typeof body } catch { return json({ error: 'Invalid request.' }, 400) }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 120) : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128 || !displayName) {
      return json({ error: 'Введите корректные имя, email и пароль (12–128 символов).' }, 400)
    }

    stage = 'password_hash'
    const { salt, hash, iterations } = await hashPassword(password)
    const now = nowIso()
    const id = newId()

    stage = 'owner_insert'
    const inserted = await env.DB.prepare("INSERT INTO catalog_staff_profiles (user_id,email,password_salt,password_hash,password_iterations,role,display_name,is_active,permissions,created_at,updated_at) VALUES (?,?,?,?,?,'owner',?,1,?,?,?)")
      .bind(id, email, salt, hash, iterations, displayName, JSON.stringify({ canCreatePlant: true, canEditPlantCard: true, canAddPlantVariant: true, canEditPlantPrice: true, canEditPlantStock: true, canReviewPlantSubmissions: true, canApprovePlantSubmission: true, canPublishPlant: true, canManageStaff: true, canDelegatePermissions: true, canViewAnalytics: true }), now, now).run()
    if (!inserted.success) throw new Error('D1 returned an unsuccessful insert result')

    return json({ ok: true, user_id: id }, 201)
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorMessage = error instanceof Error ? error.message.slice(0, 240) : 'Unknown failure'
    console.error('[manager-owner-bootstrap]', { requestId, stage, errorName, errorMessage })
    return json({
      error: 'Внутренняя ошибка при создании владельца. Пароль и секрет не были записаны в журнал.',
      requestId,
      stage,
    }, 500)
  }
}
