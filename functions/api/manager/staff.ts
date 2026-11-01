type Env = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

type StaffRole = 'seller' | 'manager' | 'owner'
type StaffProfile = {
  user_id: string
  role: StaffRole
  display_name: string
  is_active: boolean
  created_at?: string
}
type AuthUser = { id: string; email?: string; created_at?: string }

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const parseBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const value = await request.json()
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}

export const onRequest = async ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin) {
    try {
      if (new URL(origin).origin !== url.origin) return json({ error: 'Origin not allowed.' }, 403)
    } catch {
      return json({ error: 'Invalid origin.' }, 403)
    }
  }

  if (!['GET', 'POST', 'PATCH'].includes(request.method)) {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Staff administration is not configured.' }, 503)
  }

  const base = SUPABASE_URL.replace(/\/+$/, '')
  const authorization = request.headers.get('Authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) return json({ error: 'Authentication required.' }, 401)

  const authHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + accessToken,
  }
  const adminHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  }

  // Validate the caller's real Supabase session, then check the server-managed owner profile.
  const userResponse = await fetch(base + '/auth/v1/user', { headers: authHeaders })
  if (!userResponse.ok) return json({ error: 'Invalid or expired session.' }, 401)
  const caller = await userResponse.json() as { id?: string }
  if (!caller.id) return json({ error: 'Invalid session.' }, 401)

  const callerProfileResponse = await fetch(
    base + '/rest/v1/catalog_staff_profiles?user_id=eq.' +
      encodeURIComponent(caller.id) + '&select=user_id,role,is_active',
    { headers: adminHeaders },
  )
  if (!callerProfileResponse.ok) return json({ error: 'Unable to verify owner permissions.' }, 503)
  const callerProfiles = await callerProfileResponse.json() as Array<{ user_id: string; role: string; is_active: boolean }>
  if (callerProfiles[0]?.role !== 'owner' || callerProfiles[0]?.is_active !== true) {
    return json({ error: 'Owner access required.' }, 403)
  }

  const getTargetProfile = async (userId: string) => {
    const response = await fetch(
      base + '/rest/v1/catalog_staff_profiles?user_id=eq.' +
        encodeURIComponent(userId) + '&select=user_id,role,display_name,is_active',
      { headers: adminHeaders },
    )
    if (!response.ok) return { response, profile: null as StaffProfile | null }
    const rows = await response.json() as StaffProfile[]
    return { response, profile: rows[0] || null }
  }

  if (request.method === 'GET') {
    const [profilesResponse, usersResponse] = await Promise.all([
      fetch(base + '/rest/v1/catalog_staff_profiles?select=user_id,role,display_name,is_active,created_at&order=created_at.asc', {
        headers: adminHeaders,
      }),
      fetch(base + '/auth/v1/admin/users?page=1&per_page=1000', { headers: adminHeaders }),
    ])
    if (!profilesResponse.ok || !usersResponse.ok) {
      return json({ error: 'Не успяхме да заредим списъка със служителите.' }, 502)
    }
    const profiles = await profilesResponse.json() as StaffProfile[]
    const authData = await usersResponse.json() as { users?: AuthUser[] }
    const usersById = new Map((authData.users || []).map((user) => [user.id, user]))
    const staff = profiles.map((profile) => {
      const authUser = usersById.get(profile.user_id)
      return {
        user_id: profile.user_id,
        email: authUser?.email || '',
        display_name: profile.display_name,
        role: profile.role,
        is_active: profile.is_active,
        created_at: profile.created_at,
      }
    })
    return json({ staff })
  }

  const body = await parseBody(request)
  if (!body || typeof body.action !== 'string') return json({ error: 'Invalid request body.' }, 400)

  if (request.method === 'POST') {
    if (body.action !== 'create') return json({ error: 'Unknown action.' }, 400)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 120) : ''
    const role = body.role
    if (!validEmail(email) || password.length < 12 || password.length > 128 ||
        !displayName || (role !== 'seller' && role !== 'manager')) {
      return json({ error: 'Въведете валиден email, име, роля и парола с поне 12 символа.' }, 400)
    }

    const createResponse = await fetch(base + '/auth/v1/admin/users', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      }),
    })
    if (!createResponse.ok) {
      return json({ error: 'Не успяхме да създадем профила. Проверете email адреса, паролата и настройките на Auth.' }, 400)
    }
    const created = await createResponse.json() as { id?: string }
    if (!created.id) return json({ error: 'Auth не върна идентификатор на създадения потребител.' }, 502)

    const profileResponse = await fetch(base + '/rest/v1/catalog_staff_profiles', {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: created.id,
        role,
        display_name: displayName,
        is_active: true,
      }),
    })
    if (!profileResponse.ok) {
      // Roll back only the Auth account created by this request; no existing staff data is touched.
      await fetch(base + '/auth/v1/admin/users/' + encodeURIComponent(created.id), {
        method: 'DELETE',
        headers: adminHeaders,
      })
      return json({ error: 'Акаунтът е създаден, но профилът на служителя не беше записан. Създаването е отменено.' }, 502)
    }
    return json({ ok: true, user_id: created.id }, 201)
  }

  const action = body.action
  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!uuidPattern.test(userId) || userId === caller.id) {
    return json({ error: 'Този акаунт не може да бъде променян.' }, 400)
  }
  const { response: targetResponse, profile: target } = await getTargetProfile(userId)
  if (!targetResponse.ok) return json({ error: 'Unable to load employee profile.' }, 502)
  if (!target || target.role === 'owner') return json({ error: 'Акаунтите на собственика не могат да се променят от този екран.' }, 403)

  if (action === 'set_password') {
    const password = typeof body.password === 'string' ? body.password : ''
    if (password.length < 12 || password.length > 128) {
      return json({ error: 'Паролата трябва да съдържа между 12 и 128 символа.' }, 400)
    }
    const passwordResponse = await fetch(base + '/auth/v1/admin/users/' + encodeURIComponent(userId), {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ password }),
    })
    if (!passwordResponse.ok) return json({ error: 'Не успяхме да зададем новата парола.' }, 502)
    return json({ ok: true })
  }

  if (action === 'activate' || action === 'deactivate') {
    const updateResponse = await fetch(
      base + '/rest/v1/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(userId),
      {
        method: 'PATCH',
        headers: { ...adminHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({ is_active: action === 'activate', updated_at: new Date().toISOString() }),
      },
    )
    if (!updateResponse.ok) return json({ error: 'Не успяхме да променим достъпа на служителя.' }, 502)
    return json({ ok: true })
  }

  if (action === 'update') {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.role === 'seller' || body.role === 'manager') patch.role = body.role
    else if (body.role !== undefined) return json({ error: 'Невалидна роля.' }, 400)
    if (typeof body.displayName === 'string') patch.display_name = body.displayName.trim().slice(0, 120)
    if (Object.keys(patch).length === 1) return json({ error: 'Няма промени за запис.' }, 400)
    const updateResponse = await fetch(
      base + '/rest/v1/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(userId),
      {
        method: 'PATCH',
        headers: { ...adminHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
      },
    )
    if (!updateResponse.ok) return json({ error: 'Не успяхме да обновим профила на служителя.' }, 502)
    return json({ ok: true })
  }

  return json({ error: 'Unknown action.' }, 400)
}
