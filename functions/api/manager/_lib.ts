export type StaffRole = 'seller' | 'manager' | 'owner'
export type StaffPermissions = {
  canCreatePlant: boolean
  canAddPlantVariant: boolean
  canEditPlantPrice: boolean
}
export type StaffProfile = {
  user_id: string
  email: string
  display_name: string
  role: StaffRole
  is_active: number
  permissions: string | StaffPermissions
}
export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta?: { changes?: number; last_row_id?: number; duration?: number }
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>
}
export interface D1Database {
  prepare(query: string): D1Statement
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>
}
export type ManagerEnv = {
  DB?: D1Database
  SANITY_API_TOKEN?: string
  SANITY_PROJECT_ID?: string
  SANITY_PLANTS_DATASET?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  CATALOG_REVIEW_EMAIL?: string
  ORDER_NOTIFICATION_EMAIL?: string
  MANAGER_BOOTSTRAP_SECRET?: string
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }
  PLANT_CARE_WORKFLOW?: { fetch: (request: Request) => Promise<Response> }
}
export type ManagerIdentity = StaffProfile & { id: string; permissionsObject: StaffPermissions }

export const json = (body: Record<string, unknown>, status = 200, extraHeaders: Record<string,string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
  })

export const parseBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const value = await request.json()
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch { return null }
}

export const nowIso = () => new Date().toISOString()
export const newId = () => crypto.randomUUID()
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
const hexToBytes = (value: string) => new Uint8Array((value.match(/.{2}/g) || []).map((part) => Number.parseInt(part, 16)))
export const randomHex = (length = 32) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return bytesToHex(bytes)
}
export const sha256Hex = async (value: string) => bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))

const derivePassword = async (password: string, saltHex: string, iterations: number) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations }, key, 256)
  return bytesToHex(new Uint8Array(bits))
}
export const hashPassword = async (password: string) => {
  const salt = randomHex(16)
  const iterations = 310000
  return { salt, hash: await derivePassword(password, salt, iterations), iterations }
}
export const verifyPassword = async (password: string, salt: string, expected: string, iterations: number) => {
  const actual = await derivePassword(password, salt, iterations)
  if (actual.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  return difference === 0
}

export const checkSameOrigin = (request: Request) => {
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== new URL(request.url).origin) return false }
    catch { return false }
  }
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none'
}

const getCookie = (request: Request, name: string) => {
  const cookie = request.headers.get('Cookie') || ''
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return ''
}
export const sessionCookie = (token: string, maxAge = 60 * 60 * 24 * 30) =>
  'florial_manager_session=' + token + '; Path=/api/manager; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge
export const clearSessionCookie = () =>
  'florial_manager_session=; Path=/api/manager; HttpOnly; Secure; SameSite=Strict; Max-Age=0'

export const authenticate = async (request: Request, env: ManagerEnv): Promise<{ user: ManagerIdentity | null; error: Response | null }> => {
  if (!env.DB) return { user: null, error: json({ error: 'D1 database is not configured.' }, 503) }
  const token = getCookie(request, 'florial_manager_session')
  if (!token || token.length < 40) return { user: null, error: json({ error: 'Authentication required.' }, 401) }
  const tokenHash = await sha256Hex(token)
  const now = nowIso()
  const row = await env.DB.prepare(`
    SELECT p.user_id,p.email,p.display_name,p.role,p.is_active,p.permissions,s.id AS session_id
    FROM manager_sessions s JOIN catalog_staff_profiles p ON p.user_id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND p.is_active=1
    LIMIT 1
  `).bind(tokenHash, now).first<StaffProfile & { session_id: string }>()
  if (!row) return { user: null, error: json({ error: 'Session expired or access disabled.' }, 401) }
  const permissions = typeof row.permissions === 'string' ? JSON.parse(row.permissions) as StaffPermissions : row.permissions as StaffPermissions
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare('UPDATE manager_sessions SET last_seen_at=?,expires_at=? WHERE id=?').bind(now, expires, row.session_id).run()
  return { user: { ...row, id: row.user_id, permissionsObject: permissions }, error: null }
}

export const requireUser = async (request: Request, env: ManagerEnv, roles?: StaffRole[]) => {
  const auth = await authenticate(request, env)
  if (auth.error || !auth.user) return { user: null as ManagerIdentity | null, response: auth.error || json({ error: 'Authentication required.' }, 401) }
  if (roles && !roles.includes(auth.user.role)) return { user: null as ManagerIdentity | null, response: json({ error: 'Insufficient permissions.' }, 403) }
  return { user: auth.user, response: null as Response | null }
}

export const recordSubmissionEvent = async (
  db: D1Database, submissionId: string, actorId: string | null, eventType: string,
  fromStatus: string | null, toStatus: string | null, note: string | null = null,
  metadata: Record<string, unknown> = {},
) => db.prepare(`
  INSERT INTO catalog_submission_events (submission_id,actor_id,event_type,from_status,to_status,note,metadata,created_at)
  VALUES (?,?,?,?,?,?,?,?)
`).bind(submissionId,actorId,eventType,fromStatus,toStatus,note,JSON.stringify(metadata),nowIso()).run()
