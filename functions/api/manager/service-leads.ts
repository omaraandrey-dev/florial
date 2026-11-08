import { hasPermission, json, newId, nowIso, requireUser, type ManagerEnv } from './_lib'

const LEAD_STATUSES = new Set([
  'new', 'processing', 'contacted', 'proposal_preparing', 'proposal_sent',
  'waiting_customer', 'approved', 'completed', 'rejected', 'closed',
])
const TRANSITIONS: Record<string, string[]> = {
  new: ['processing', 'contacted', 'rejected', 'closed'],
  processing: ['contacted', 'proposal_preparing', 'proposal_sent', 'waiting_customer', 'approved', 'rejected', 'closed'],
  contacted: ['processing', 'proposal_preparing', 'proposal_sent', 'waiting_customer', 'approved', 'rejected', 'closed'],
  proposal_preparing: ['contacted', 'proposal_sent', 'waiting_customer', 'approved', 'rejected', 'closed'],
  proposal_sent: ['contacted', 'proposal_preparing', 'waiting_customer', 'approved', 'rejected', 'closed'],
  waiting_customer: ['contacted', 'proposal_preparing', 'proposal_sent', 'approved', 'rejected', 'closed'],
  approved: ['completed', 'closed', 'rejected'],
  completed: [],
  rejected: [],
  closed: [],
}
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) as unknown } catch { return {} }
}
const writeOriginAllowed = (request: Request) => {
  const origin = request.headers.get('Origin')
  if (origin) {
    try { if (new URL(origin).origin !== new URL(request.url).origin) return false }
    catch { return false }
  }
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none'
}
const canView = (user: Parameters<typeof hasPermission>[0]) =>
  hasPermission(user, 'canViewServiceLeads') || hasPermission(user, 'canManageServiceLeads')
const canManage = (user: Parameters<typeof hasPermission>[0]) =>
  hasPermission(user, 'canManageServiceLeads')

export const onRequest = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503)
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  const actor = auth.user
  if (!canView(actor)) return json({ error: 'Нямате право да преглеждате заявките за услуги.' }, 403)

  if (request.method === 'GET') {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (id) {
      if (!uuid(id)) return json({ error: 'Невалиден номер на заявка.' }, 400)
      const lead = await env.DB.prepare(`
        SELECT l.*, p.display_name AS assigned_name
        FROM service_leads l
        LEFT JOIN catalog_staff_profiles p ON p.user_id=l.assigned_to
        WHERE l.id=? LIMIT 1
      `).bind(id).first<Record<string, unknown>>()
      if (!lead) return json({ error: 'Заявката не е намерена.' }, 404)
      const eventRows = await env.DB.prepare(`
        SELECT id,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at
        FROM service_lead_events WHERE service_lead_id=? ORDER BY created_at DESC LIMIT 200
      `).bind(id).all<Record<string, unknown>>()
      const assignees = actor.role === 'owner'
        ? await env.DB.prepare('SELECT user_id,display_name,role FROM catalog_staff_profiles WHERE is_active=1 AND role IN ('owner','manager') ORDER BY display_name').all<Record<string, unknown>>()
        : await env.DB.prepare('SELECT user_id,display_name,role FROM catalog_staff_profiles WHERE is_active=1 AND role='manager' AND (user_id=? OR created_by=?) ORDER BY display_name').bind(actor.user_id, actor.user_id).all<Record<string, unknown>>()
      return json({
        lead: { ...lead, fields_json: parseJson(lead.fields_json) },
        events: eventRows.results.map((event) => ({ ...event, metadata: parseJson(event.metadata) })),
        assignees: assignees.results,
        canManage: canManage(actor),
      })
    }

    const where: string[] = []
    const values: unknown[] = []
    const status = url.searchParams.get('status') || ''
    const service = url.searchParams.get('service') || ''
    const location = url.searchParams.get('location') || ''
    const assignedTo = url.searchParams.get('assignedTo') || ''
    const query = (url.searchParams.get('q') || '').trim().slice(0, 120)
    const from = url.searchParams.get('from') || ''
    const to = url.searchParams.get('to') || ''
    if (status && !LEAD_STATUSES.has(status)) return json({ error: 'Невалиден статус.' }, 400)
    if (status) { where.push('l.status=?'); values.push(status) }
    if (service) { where.push('l.service_slug=?'); values.push(service.slice(0, 120)) }
    if (location) { where.push('instr(lower(l.location),lower(?))>0'); values.push(location.slice(0, 120)) }
    if (assignedTo) {
      if (assignedTo !== 'unassigned' && !uuid(assignedTo)) return json({ error: 'Невалиден отговорник.' }, 400)
      where.push(assignedTo === 'unassigned' ? 'l.assigned_to IS NULL' : 'l.assigned_to=?')
      if (assignedTo !== 'unassigned') values.push(assignedTo)
    }
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) { where.push("l.created_at>=?"); values.push(from + 'T00:00:00.000Z') }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) { const end = new Date(to + 'T00:00:00.000Z'); if (!Number.isNaN(end.getTime())) { end.setUTCDate(end.getUTCDate() + 1); where.push('l.created_at<?'); values.push(end.toISOString()) } }
    if (query) {
      where.push('(instr(lower(l.lead_number),lower(?))>0 OR instr(lower(l.customer_name),lower(?))>0 OR instr(lower(l.phone),lower(?))>0 OR instr(lower(COALESCE(l.email,\'\')),lower(?))>0 OR instr(lower(l.location),lower(?))>0 OR instr(lower(l.service_name),lower(?))>0)')
      values.push(query, query, query, query, query, query)
    }
    const sql = `
      SELECT l.id,l.lead_number,l.service_slug,l.service_name,l.locale,l.customer_name,l.phone,l.email,
        l.location,l.address,l.comment,l.status,l.created_at,l.updated_at,l.assigned_to,
        p.display_name AS assigned_name
      FROM service_leads l LEFT JOIN catalog_staff_profiles p ON p.user_id=l.assigned_to
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY l.created_at DESC LIMIT 100
    `
    const rows = await env.DB.prepare(sql).bind(...values).all<Record<string, unknown>>()
    const services = await env.DB.prepare('SELECT service_slug,MAX(service_name) AS service_name,COUNT(*) AS lead_count FROM service_leads GROUP BY service_slug ORDER BY service_name').all<Record<string, unknown>>()
    const assignees = actor.role === 'owner'
      ? await env.DB.prepare('SELECT user_id,display_name,role FROM catalog_staff_profiles WHERE is_active=1 AND role IN ('owner','manager') ORDER BY display_name').all<Record<string, unknown>>()
      : await env.DB.prepare('SELECT user_id,display_name,role FROM catalog_staff_profiles WHERE is_active=1 AND role='manager' AND (user_id=? OR created_by=?) ORDER BY display_name').bind(actor.user_id, actor.user_id).all<Record<string, unknown>>()
    return json({ leads: rows.results, services: services.results, assignees: assignees.results, canManage: canManage(actor) })
  }

  if (!canManage(actor)) return json({ error: 'Нямате право да обработвате заявките за услуги.' }, 403)
  if (!writeOriginAllowed(request)) return json({ error: 'Origin not allowed.' }, 403)
  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.toLowerCase().includes('application/json')) return json({ error: 'Content-Type must be application/json.' }, 415)
  const rawBody = await request.text()
  if (new TextEncoder().encode(rawBody).byteLength > 8192) return json({ error: 'Request body is too large.' }, 413)
  let body: unknown
  try { body = JSON.parse(rawBody) as unknown } catch { return json({ error: 'Invalid request body.' }, 400) }
  if (!isObject(body)) return json({ error: 'Invalid request body.' }, 400)
  const leadId = typeof body.leadId === 'string' ? body.leadId : ''
  if (!uuid(leadId)) return json({ error: 'Невалиден номер на заявка.' }, 400)
  const lead = await env.DB.prepare('SELECT id,status,assigned_to FROM service_leads WHERE id=?').bind(leadId).first<{ id: string; status: string; assigned_to: string | null }>()
  if (!lead) return json({ error: 'Заявката не е намерена.' }, 404)
  const now = nowIso()
  const actorName = actor.display_name || actor.email || 'Florial Manager'

  if (body.action === 'status') {
    const nextStatus = typeof body.status === 'string' ? body.status : ''
    if (!LEAD_STATUSES.has(nextStatus) || nextStatus === lead.status) return json({ error: 'Изберете нов валиден статус.' }, 400)
    if (!(TRANSITIONS[lead.status] || []).includes(nextStatus)) return json({ error: 'Този преход на статуса не е разрешен.' }, 409)
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
    const result = await env.DB.batch([
      env.DB.prepare('UPDATE service_leads SET status=?,updated_at=? WHERE id=? AND status=?').bind(nextStatus, now, leadId, lead.status),
      env.DB.prepare(`
        INSERT INTO service_lead_events (id,service_lead_id,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at)
        SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM service_leads WHERE id=? AND status=? AND updated_at=?)
      `).bind(newId(), leadId, actor.user_id, actorName, actor.role, 'status_changed', lead.status, nextStatus, note || null, '{}', now, leadId, nextStatus, now),
    ])
    if ((result[0]?.meta?.changes || 0) !== 1 || (result[1]?.meta?.changes || 0) !== 1) return json({ error: 'Заявката беше променена паралелно. Обновете страницата.' }, 409)
    return json({ ok: true })
  }

  if (body.action === 'assign') {
    const assigneeId = body.assignedTo === null || body.assignedTo === '' ? null : typeof body.assignedTo === 'string' ? body.assignedTo : undefined
    if (assigneeId === undefined || assigneeId !== null && !uuid(assigneeId)) return json({ error: 'Невалиден отговорник.' }, 400)
    if (assigneeId === lead.assigned_to) return json({ error: 'Отговорникът не е променен.' }, 400)
    let assignee: { user_id: string; display_name: string } | null = null
    if (assigneeId) {
      assignee = actor.role === 'owner'
        ? await env.DB.prepare('SELECT user_id,display_name FROM catalog_staff_profiles WHERE user_id=? AND is_active=1 AND role IN ('owner','manager')').bind(assigneeId).first<{ user_id: string; display_name: string }>()
        : await env.DB.prepare('SELECT user_id,display_name FROM catalog_staff_profiles WHERE user_id=? AND is_active=1 AND role='manager' AND (user_id=? OR created_by=?)').bind(assigneeId, actor.user_id, actor.user_id).first<{ user_id: string; display_name: string }>()
      if (!assignee) return json({ error: 'Можете да назначите само активен служител от разрешения ви екип.' }, 403)
    }
    const result = await env.DB.batch([
      env.DB.prepare('UPDATE service_leads SET assigned_to=?,updated_at=? WHERE id=? AND assigned_to IS ?').bind(assigneeId, now, leadId, lead.assigned_to),
      env.DB.prepare(`
        INSERT INTO service_lead_events (id,service_lead_id,actor_id,actor_name,actor_role,event_type,note,metadata,created_at)
        SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM service_leads WHERE id=? AND assigned_to IS ? AND updated_at=?)
      `).bind(newId(), leadId, actor.user_id, actorName, actor.role, 'assignment_changed', assigneeId ? 'Променен отговорник' : 'Премахнат отговорник', JSON.stringify({ assignedTo: assigneeId, assignedName: assignee?.display_name || null }), now, leadId, assigneeId, now),
    ])
    if ((result[0]?.meta?.changes || 0) !== 1 || (result[1]?.meta?.changes || 0) !== 1) return json({ error: 'Заявката беше променена паралелно. Обновете страницата.' }, 409)
    return json({ ok: true })
  }

  if (body.action === 'comment') {
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    if (!note || note.length > 2000) return json({ error: 'Коментарът трябва да съдържа от 1 до 2000 символа.' }, 400)
    await env.DB.prepare(`
      INSERT INTO service_lead_events (id,service_lead_id,actor_id,actor_name,actor_role,event_type,note,metadata,created_at)
      VALUES (?,?,?,?,?,'internal_comment',?,'{}',?)
    `).bind(newId(), leadId, actor.user_id, actorName, actor.role, note, now).run()
    return json({ ok: true })
  }

  return json({ error: 'Непознато действие.' }, 400)
}
