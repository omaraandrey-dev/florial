type Env = {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  CATALOG_REVIEW_EMAIL?: string
  ORDER_NOTIFICATION_EMAIL?: string
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char)

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const origin = request.headers.get('Origin')
  const requestUrl = new URL(request.url)
  if (origin && new URL(origin).host !== requestUrl.host) return json({ error: 'Origin not allowed.' }, 403)

  const authorization = request.headers.get('Authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) return json({ error: 'Authentication required.' }, 401)

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM } = env
  const recipient = env.CATALOG_REVIEW_EMAIL || env.ORDER_NOTIFICATION_EMAIL
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY || !EMAIL_FROM || !recipient) {
    return json({ error: 'Notification service is not configured.' }, 503)
  }

  const userResponse = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + accessToken },
  })
  if (!userResponse.ok) return json({ error: 'Invalid or expired session.' }, 401)
  const user = await userResponse.json() as { id?: string; email?: string }
  if (!user.id) return json({ error: 'Invalid session.' }, 401)

  let body: { submissionId?: unknown }
  try { body = await request.json() as { submissionId?: unknown } }
  catch { return json({ error: 'Invalid request.' }, 400) }
  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) return json({ error: 'Invalid submission.' }, 400)

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
  }
  const profileResponse = await fetch(
    SUPABASE_URL + '/rest/v1/catalog_staff_profiles?user_id=eq.' + encodeURIComponent(user.id) + '&select=role,is_active',
    { headers },
  )
  if (!profileResponse.ok) return json({ error: 'Unable to verify staff permissions.' }, 503)
  const profiles = await profileResponse.json() as Array<{ role: string; is_active: boolean }>
  if (!profiles[0]?.is_active || !['seller', 'manager', 'owner'].includes(profiles[0].role)) {
    return json({ error: 'Not authorized.' }, 403)
  }

  const submissionResponse = await fetch(
    SUPABASE_URL + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId) +
      '&select=id,title,sku,catalog,operation,status,created_by,submitted_at,notification_sent_at',
    { headers },
  )
  if (!submissionResponse.ok) return json({ error: 'Unable to load submission.' }, 503)
  const rows = await submissionResponse.json() as Array<{
    id: string; title: string; sku: string | null; catalog: string; operation: string;
    status: string; created_by: string; submitted_at: string | null; notification_sent_at: string | null
  }>
  const submission = rows[0]
  if (!submission || (profiles[0].role === 'seller' && submission.created_by !== user.id)) {
    return json({ error: 'Submission not found.' }, 404)
  }
  if (submission.status !== 'submitted') return json({ error: 'Submission is not awaiting review.' }, 409)
  if (submission.notification_sent_at) return json({ ok: true, alreadySent: true })

  const title = escapeHtml(submission.title || 'Без име')
  const sku = escapeHtml(submission.sku || '—')
  const author = escapeHtml(user.email || user.id)
  const managerUrl = new URL('/manager', requestUrl.origin).toString()
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#26332c">
      <h2>Нова заявка за приемане на растение — Florial</h2>
      <p><b>Продукт:</b> ${title}</p>
      <p><b>Артикул:</b> ${sku}</p>
      <p><b>Каталог:</b> Растения</p>
      <p><b>Операция:</b> ${submission.operation === 'create' ? 'Нова карточка' : 'Предложена промяна'}</p>
      <p><b>Изпратил:</b> ${author}</p>
      <p><b>Дата:</b> ${escapeHtml(submission.submitted_at || new Date().toISOString())}</p>
      <p><a href="${managerUrl}">Отвори затворения Florial Manager</a></p>
    </div>`

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: EMAIL_FROM, to: [recipient], subject: 'Нова заявка за растение — ' + (submission.title || 'Florial'), html }),
  })
  if (!emailResponse.ok) {
    await fetch(SUPABASE_URL + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId), {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ notification_error: 'Email provider returned ' + emailResponse.status }),
    })
    return json({ error: 'The request was submitted, but the owner notification could not be sent.' }, 502)
  }

  await fetch(SUPABASE_URL + '/rest/v1/catalog_submissions?id=eq.' + encodeURIComponent(submissionId), {
    method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ notification_sent_at: new Date().toISOString(), notification_error: null }),
  })
  return json({ ok: true })
}
