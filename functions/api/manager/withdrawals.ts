import {
  checkSameOrigin, hasPermission, json, newId, nowIso, parseBody, requireUser,
  type ManagerEnv, type ManagerIdentity,
} from './_lib'
import { sendOrderEmail } from '../_lib/order-documents'
import { escapeWithdrawalHtml, isWithdrawalStatus } from '../_lib/contract-withdrawals.mjs'

type WithdrawalRow = {
  id: string
  order_id: string | null
  contract_reference: string
  customer_name: string
  customer_email: string
  locale: 'bg' | 'ru' | 'en'
  declaration_text: string
  customer_comment: string | null
  status: string
  confirmation_status: string
  confirmation_sent_at: string | null
  confirmation_error: string | null
  review_note: string | null
  submitted_at: string
  created_at: string
  updated_at: string
}

const canView = (user: ManagerIdentity) =>
  user.role === 'owner' || user.role === 'manager' &&
  (hasPermission(user, 'canViewOrders') || hasPermission(user, 'canEditOrders'))

const canManage = (user: ManagerIdentity) =>
  user.role === 'owner' || user.role === 'manager' && hasPermission(user, 'canEditOrders')

const dateLabel = (value: string, locale: 'bg' | 'ru' | 'en') => new Intl.DateTimeFormat(
  locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'bg-BG',
  { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Europe/Sofia' },
).format(new Date(value))

const confirmationEmail = (row: WithdrawalRow) => {
  const locale = row.locale
  const labels = locale === 'ru'
    ? { title: 'Мы получили ваше заявление об отказе', intro: 'Это письмо повторно подтверждает получение вашего онлайн-заявления.', name: 'Имя потребителя', reference: 'Договор / номер заказа', email: 'Адрес для подтверждения', submitted: 'Дата и время подачи (Europe/Sofia)', declaration: 'Содержание заявления', next: 'Команда Florial проверит заявление и свяжется с вами при необходимости.' }
    : locale === 'en'
      ? { title: 'We received your contract withdrawal', intro: 'This email reconfirms receipt of your online declaration.', name: 'Consumer name', reference: 'Contract / order reference', email: 'Confirmation email', submitted: 'Submission date and time (Europe/Sofia)', declaration: 'Declaration content', next: 'The Florial team will review the declaration and contact you if necessary.' }
      : { title: 'Получихме Вашето заявление за отказ от договор', intro: 'Това писмо повторно потвърждава получаването на Вашето онлайн заявление.', name: 'Име на потребителя', reference: 'Договор / номер на поръчка', email: 'Имейл за потвърждение', submitted: 'Дата и час на подаване (Europe/Sofia)', declaration: 'Съдържание на заявлението', next: 'Екипът на Florial ще прегледа заявлението и ще се свърже с Вас при необходимост.' }
  const safe = escapeWithdrawalHtml
  const date = dateLabel(row.submitted_at, locale)
  return '<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#26352d">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e2ebe4;border-radius:16px">' +
    '<tr><td style="padding:28px 30px;border-bottom:1px solid #e8efe9"><div style="font-size:22px;font-weight:700;color:#176b49">FLORIAL</div></td></tr>' +
    '<tr><td style="padding:28px 30px"><h1 style="font-size:22px;color:#176b49">' + safe(labels.title) + '</h1><p>' + safe(labels.intro) + '</p>' +
    '<p><strong>' + safe(labels.name) + ':</strong> ' + safe(row.customer_name) + '</p>' +
    '<p><strong>' + safe(labels.reference) + ':</strong> ' + safe(row.contract_reference) + '</p>' +
    '<p><strong>' + safe(labels.email) + ':</strong> ' + safe(row.customer_email) + '</p>' +
    '<p><strong>' + safe(labels.submitted) + ':</strong> ' + safe(date) + '</p>' +
    '<p><strong>' + safe(labels.declaration) + ':</strong></p><p style="white-space:pre-wrap">' + safe(row.declaration_text) + '</p>' +
    '<p>' + safe(labels.next) + '</p><p>Florial · Несебър, България<br>+359 876 777 902<br>https://florial-bg.com</p></td></tr></table></body></html>'
}

const addEvent = (
  db: NonNullable<ManagerEnv['DB']>, row: WithdrawalRow, user: ManagerIdentity,
  eventType: string, fromStatus: string | null, toStatus: string | null, note: string | null,
  metadata: Record<string, unknown> = {},
) => db.prepare(`INSERT INTO contract_withdrawal_events
  (id,withdrawal_id,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  .bind(newId(), row.id, user.user_id, user.display_name || user.email, user.role,
    eventType, fromStatus, toStatus, note, JSON.stringify(metadata), nowIso())

export const onRequestGet = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!canView(auth.user)) return json({ error: 'Нямате право да преглеждате откази от договори.' }, 403)
  if (!env.DB) return json({ error: 'D1 database is unavailable.' }, 503)
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  try {
    if (id) {
      const withdrawal = await env.DB.prepare('SELECT * FROM contract_withdrawals WHERE id=?').bind(id).first<WithdrawalRow>()
      if (!withdrawal) return json({ error: 'Заявлението не е намерено.' }, 404)
      const events = await env.DB.prepare(`SELECT id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at
        FROM contract_withdrawal_events WHERE withdrawal_id=? ORDER BY created_at DESC LIMIT 100`)
        .bind(id).all()
      return json({ withdrawal, events: events.results || [] })
    }
    const q = (url.searchParams.get('q') || '').trim().slice(0, 100)
    const status = url.searchParams.get('status') || ''
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50) || 50))
    const where: string[] = []
    const values: unknown[] = []
    if (q) {
      where.push('(contract_reference LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)')
      values.push('%' + q + '%', '%' + q + '%', '%' + q + '%')
    }
    if (isWithdrawalStatus(status)) { where.push('status=?'); values.push(status) }
    const clause = where.length ? ' WHERE ' + where.join(' AND ') : ''
    const result = await env.DB.prepare('SELECT id,order_id,contract_reference,customer_name,customer_email,locale,status,confirmation_status,confirmation_sent_at,review_note,submitted_at,created_at,updated_at FROM contract_withdrawals' + clause + ' ORDER BY submitted_at DESC LIMIT ?')
      .bind(...values, limit).all<WithdrawalRow>()
    const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM contract_withdrawals' + clause)
      .bind(...values).first<{ count: number }>()
    return json({ withdrawals: result.results || [], count: count?.count || 0, limit })
  } catch {
    return json({ error: 'Не успяхме да заредим заявленията.' }, 502)
  }
}

export const onRequestPatch = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!canManage(auth.user)) return json({ error: 'Нямате право да обработвате откази от договори.' }, 403)
  if (!env.DB) return json({ error: 'D1 database is unavailable.' }, 503)
  const body = await parseBody(request)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return json({ error: 'Липсва идентификатор на заявлението.' }, 400)
  const row = await env.DB.prepare('SELECT * FROM contract_withdrawals WHERE id=?').bind(id).first<WithdrawalRow>()
  if (!row) return json({ error: 'Заявлението не е намерено.' }, 404)
  const nextStatus = typeof body?.status === 'string' ? body.status : row.status
  if (!isWithdrawalStatus(nextStatus)) return json({ error: 'Невалиден статус.' }, 400)
  const note = typeof body?.reviewNote === 'string' ? body.reviewNote.trim().slice(0, 1000) : row.review_note
  const now = nowIso()
  try {
    await env.DB.batch([
      env.DB.prepare('UPDATE contract_withdrawals SET status=?,review_note=?,updated_at=? WHERE id=?')
        .bind(nextStatus, note || null, now, id),
      addEvent(env.DB, row, auth.user, nextStatus === row.status ? 'review_note_updated' : 'status_changed',
        row.status, nextStatus, note || null),
    ])
    return json({ ok: true })
  } catch {
    return json({ error: 'Не успяхме да запазим промените.' }, 502)
  }
}

export const onRequestPost = async ({ request, env }: { request: Request; env: ManagerEnv }) => {
  if (!checkSameOrigin(request)) return json({ error: 'Origin not allowed.' }, 403)
  const auth = await requireUser(request, env)
  if (auth.response || !auth.user) return auth.response || json({ error: 'Authentication required.' }, 401)
  if (!canManage(auth.user)) return json({ error: 'Нямате право да изпращате потвърждения.' }, 403)
  if (!env.DB) return json({ error: 'D1 database is unavailable.' }, 503)
  const body = await parseBody(request)
  if (body?.action !== 'resend_confirmation' || typeof body.id !== 'string') return json({ error: 'Невалидна операция.' }, 400)
  const row = await env.DB.prepare('SELECT * FROM contract_withdrawals WHERE id=?').bind(body.id).first<WithdrawalRow>()
  if (!row) return json({ error: 'Заявлението не е намерено.' }, 404)
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return json({ error: 'Имейл услугата не е конфигурирана.' }, 503)
  const attemptKey = 'contract-withdrawal-' + row.id + '-retry-' + newId()
  try {
    await sendOrderEmail(env.RESEND_API_KEY, env.EMAIL_FROM, row.customer_email,
      row.locale === 'ru' ? 'Подтверждение получения отказа от договора — Florial'
        : row.locale === 'en' ? 'Contract withdrawal received — Florial'
          : 'Потвърждение за получен отказ от договор — Florial',
      confirmationEmail(row), undefined, attemptKey)
    const now = nowIso()
    await env.DB.batch([
      env.DB.prepare(`UPDATE contract_withdrawals SET confirmation_status='sent',confirmation_sent_at=?,confirmation_error=NULL,updated_at=? WHERE id=?`)
        .bind(now, now, row.id),
      addEvent(env.DB, row, auth.user, 'confirmation_resent', row.status, row.status, 'Потвърждението е изпратено повторно.'),
    ])
    return json({ ok: true })
  } catch {
    const now = nowIso()
    await env.DB.prepare(`UPDATE contract_withdrawals SET confirmation_status='failed',confirmation_error=?,updated_at=? WHERE id=?`)
      .bind('Неуспешно повторно изпращане чрез имейл доставчика.', now, row.id).run().catch(() => undefined)
    return json({ error: 'Не успяхме да изпратим потвърждението. Опитайте отново.' }, 502)
  }
}
