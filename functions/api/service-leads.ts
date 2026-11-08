import type { ManagerEnv } from './manager/_lib'
import { sendOrderEmail } from './_lib/order-documents'
import { checkSameOriginPublicPost, enforcePublicRateLimit, readBoundedRequestBody } from './_lib/public-api-security'
import { cleanLeadText, isValidLeadEmail, isValidLeadPhone, normalizeLeadFields } from './_lib/service-leads.mjs'

type RuntimeEnv = ManagerEnv
type ServiceDocument = {
  _id: string
  name?: string
  slug?: { current?: string }
  isActive?: boolean
  leadForm?: Record<string, unknown>
  translations?: Record<string, { name?: string; leadForm?: Record<string, unknown> }>
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char)

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const fetchService = async (slug: string, env: RuntimeEnv): Promise<ServiceDocument | null> => {
  const projectId = env.SANITY_PROJECT_ID || env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs'
  const dataset = env.SANITY_DATASET || 'production'
  const query = '*[_type == "service" && slug.current == $slug && isActive != false][0]{_id,name,slug,isActive,leadForm,translations{ru{name,leadForm},en{name,leadForm}}}'
  const url = new URL('https://' + projectId + '.api.sanity.io/v2024-01-01/data/query/' + encodeURIComponent(dataset))
  url.searchParams.set('query', query)
  url.searchParams.set('$slug', JSON.stringify(slug))
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Sanity service lookup failed')
  const result = await response.json() as { result?: ServiceDocument | null }
  return result.result || null
}

const localizedText = (locale: 'bg' | 'ru' | 'en', key: 'owner' | 'customerTitle' | 'customerBody', leadNumber: string, serviceName: string) => {
  if (key === 'owner') return 'Нова заявка за услуга ' + leadNumber + ' — Florial'
  if (key === 'customerTitle') {
    return locale === 'ru' ? 'Заявка получена — Florial' : locale === 'en' ? 'Enquiry received — Florial' : 'Получихме заявката Ви — Florial'
  }
  return locale === 'ru'
    ? 'Благодарим за обращение! Получили вашу заявку № ' + leadNumber + ' на услугу «' + serviceName + '». Команда Florial свяжется с вами для уточнения деталей.'
    : locale === 'en'
      ? 'Thank you for contacting us. We received your enquiry ' + leadNumber + ' for “' + serviceName + '”. The Florial team will contact you to discuss the details.'
      : 'Благодарим Ви за запитването! Получихме заявка № ' + leadNumber + ' за услугата „' + serviceName + '“. Екипът на Florial ще се свърже с Вас за уточняване на детайлите.'
}

const sendNotification = async (
  env: RuntimeEnv,
  recipient: string,
  subject: string,
  html: string,
): Promise<boolean> => {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !recipient || !isValidLeadEmail(recipient)) return false
  try {
    await sendOrderEmail(env.RESEND_API_KEY, env.EMAIL_FROM, recipient, subject, html)
    return true
  } catch {
    return false
  }
}

const handlePost = async (env: RuntimeEnv, bodyText: string, requestUrl: string) => {
  if (!env.DB) return json({ error: 'Системата за заявки временно не е достъпна.' }, 503)

  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(bodyText)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Невалидни данни на заявката.' }, 400)
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'Невалидни данни на заявката.' }, 400)
  }

  const serviceSlug = cleanLeadText(body.serviceSlug, 96)
  const localeInput = cleanLeadText(body.locale, 2)
  if (!/^[a-z0-9-]+$/.test(serviceSlug) || !['bg', 'ru', 'en'].includes(localeInput)) {
    return json({ error: 'Изберете валидна услуга и език.' }, 400)
  }
  const locale = localeInput as 'bg' | 'ru' | 'en'
  const idempotencyKey = cleanLeadText(body.idempotencyKey, 100)
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) return json({ error: 'Невалиден ключ на заявката.' }, 400)
  if (cleanLeadText(body.website, 200)) return json({ error: 'Невалидна заявка.' }, 400)
  if (body.consent !== true) return json({ error: 'Необходимо е съгласие за обработване на личните данни.' }, 400)

  let service: ServiceDocument | null
  try {
    service = await fetchService(serviceSlug, env)
  } catch {
    return json({ error: 'Не успяхме да проверим услугата. Моля, опитайте отново.' }, 502)
  }
  if (!service || service.isActive === false) return json({ error: 'Избраната услуга вече не е налична.' }, 404)

  const localizedLeadForm = locale === 'bg' ? service.leadForm : service.translations?.[locale]?.leadForm
  const leadForm = localizedLeadForm || (locale === 'bg' ? service.leadForm : undefined)
  const configuredFields = Array.isArray(leadForm?.fields) ? leadForm.fields as Array<Record<string, unknown>> : []
  const consentText = cleanLeadText(leadForm?.consentText, 2000)
  const privacyPolicyInput = cleanLeadText(leadForm?.privacyPolicyUrl, 500)
  if (!configuredFields.length || !consentText || !privacyPolicyInput) {
    return json({ error: 'Формата все още не е конфигурирана за безопасно изпращане.' }, 503)
  }

  let privacyPolicyUrl: URL
  try {
    privacyPolicyUrl = new URL(privacyPolicyInput, 'https://florial-bg.com')
  } catch {
    return json({ error: 'Връзката към политиката за поверителност не е валидна.' }, 503)
  }
  if (privacyPolicyUrl.protocol !== 'https:' || !['florial-bg.com', 'www.florial-bg.com'].includes(privacyPolicyUrl.hostname)) {
    return json({ error: 'Връзката към политиката за поверителност не е валидна.' }, 503)
  }

  const normalized = normalizeLeadFields(configuredFields, body.fields)
  if (normalized.error || !normalized.values) {
    const message = normalized.error === 'invalid_email'
      ? 'Моля, въведете валиден имейл адрес.'
      : normalized.error === 'invalid_phone'
        ? 'Моля, въведете валиден телефонен номер.'
        : normalized.error === 'required_field_missing'
          ? 'Моля, попълнете всички задължителни полета.'
          : 'Конфигурацията на формата е невалидна.'
    return json({ error: message }, normalized.error === 'invalid_form_configuration' ? 503 : 400)
  }

  const fields = normalized.values
  const customerName = cleanLeadText(fields.name, 160)
  const phone = cleanLeadText(fields.phone, 50)
  const email = cleanLeadText(fields.email, 254)
  const location = cleanLeadText(fields.location, 120)
  const address = cleanLeadText(fields.address, 500)
  const comment = cleanLeadText(fields.details || fields.comment, 3000)
  if (!customerName || !isValidLeadPhone(phone) || !location) {
    return json({ error: 'Моля, попълнете име, телефон и населено място.' }, 400)
  }
  if (email && !isValidLeadEmail(email)) return json({ error: 'Моля, въведете валиден имейл адрес.' }, 400)

  const serviceName = cleanLeadText(locale === 'bg' ? service.name : service.translations?.[locale]?.name, 200) || cleanLeadText(service.name, 200)
  const now = new Date()
  const createdAt = now.toISOString()
  const retentionUntil = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const datePart = createdAt.slice(0, 10).replace(/-/g, '')
  const leadNumber = 'FL-S-' + datePart + '-' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
  const id = crypto.randomUUID()
  const consentVersion = (await sha256Hex(consentText + '\n' + privacyPolicyUrl.href)).slice(0, 20)
  const extraFields = Object.fromEntries(Object.entries(fields).filter(([key]) => !['name', 'phone', 'email', 'location', 'address', 'details', 'comment'].includes(key)))
  const ownerRecipient = cleanLeadText(env.ORDER_NOTIFICATION_EMAIL, 254)
  const mailConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)
  const ownerInitialStatus = ownerRecipient && mailConfigured ? 'pending' : 'not_configured'
  const customerInitialStatus = email ? (mailConfigured ? 'pending' : 'failed') : 'not_requested'

  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO service_leads (
        id,lead_number,idempotency_key,service_document_id,service_slug,service_name,locale,
        customer_name,phone,email,location,address,comment,fields_json,consent_given,consent_text,
        privacy_policy_url,consent_version,status,owner_notification_status,customer_confirmation_status,
        created_at,updated_at,retention_until
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?,?,?,?,?)`).bind(
        id, leadNumber, idempotencyKey, service._id, serviceSlug, serviceName, locale,
        customerName, phone, email || null, location, address || null, comment || null,
        JSON.stringify(extraFields), 1, consentText, privacyPolicyUrl.href, consentVersion, ownerInitialStatus,
        customerInitialStatus, createdAt, createdAt, retentionUntil,
      ),
      env.DB.prepare(`INSERT INTO service_lead_events (
        id,service_lead_id,actor_role,event_type,to_status,note,metadata,created_at
      ) VALUES (?,?, 'system','lead_created','new',?,?,?)`).bind(
        crypto.randomUUID(), id, 'Customer submitted a service enquiry.', JSON.stringify({ locale, service_slug: serviceSlug }), createdAt,
      ),
    ])
  } catch {
    const existing = await env.DB.prepare('SELECT lead_number FROM service_leads WHERE idempotency_key=? LIMIT 1')
      .bind(idempotencyKey).first<{ lead_number: string }>()
    if (existing?.lead_number) return json({ leadNumber: existing.lead_number, duplicate: true }, 200)
    return json({ error: 'Не успяхме да запазим заявката. Моля, опитайте отново.' }, 502)
  }

  const managerUrl = new URL('/manager', requestUrl).toString()
  const fieldRows = Object.entries(fields).map(([key, value]) =>
    '<tr><td style="padding:7px;border-bottom:1px solid #e5e7eb;font-weight:600">' + escapeHtml(key) +
    '</td><td style="padding:7px;border-bottom:1px solid #e5e7eb">' + escapeHtml(value) + '</td></tr>',
  ).join('')
  const ownerHtml = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#26332c"><h2>Нова заявка за услуга — Florial</h2>' +
    '<p><strong>Номер:</strong> ' + escapeHtml(leadNumber) + '<br><strong>Услуга:</strong> ' + escapeHtml(serviceName) +
    '<br><strong>Дата:</strong> ' + escapeHtml(createdAt) + '<br><strong>Клиент:</strong> ' + escapeHtml(customerName) +
    '<br><strong>Телефон:</strong> ' + escapeHtml(phone) + '<br><strong>Имейл:</strong> ' + escapeHtml(email || 'Не е посочен') +
    '<br><strong>Населено място:</strong> ' + escapeHtml(location) +
    (address ? '<br><strong>Адрес:</strong> ' + escapeHtml(address) : '') +
    (comment ? '<br><strong>Описание:</strong> ' + escapeHtml(comment) : '') +
    '</p><table role="presentation" style="width:100%;border-collapse:collapse">' + fieldRows +
    '</table><p><a href="' + escapeHtml(managerUrl) + '">Отвори Florial Manager</a></p></div>'

  let ownerStatus: 'sent' | 'failed' | 'not_configured' = 'not_configured'
  let ownerSentAt: string | null = null
  if (ownerRecipient && mailConfigured) {
    const sent = await sendNotification(env, ownerRecipient, localizedText('bg', 'owner', leadNumber, serviceName), ownerHtml)
    ownerStatus = sent ? 'sent' : 'failed'
    ownerSentAt = sent ? new Date().toISOString() : null
  }

  let customerStatus: 'not_requested' | 'sent' | 'failed' = 'not_requested'
  let customerSentAt: string | null = null
  if (email) {
    const customerBody = localizedText(locale, 'customerBody', leadNumber, serviceName)
    const customerHtml = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#26332c"><h2>' +
      escapeHtml(localizedText(locale, 'customerTitle', leadNumber, serviceName)) + '</h2><p>' +
      escapeHtml(customerBody) + '</p><p>Florial</p></div>'
    const sent = await sendNotification(env, email, localizedText(locale, 'customerTitle', leadNumber, serviceName), customerHtml)
    customerStatus = sent ? 'sent' : 'failed'
    customerSentAt = sent ? new Date().toISOString() : null
  }

  const updatedAt = new Date().toISOString()
  try {
    await env.DB.batch([
      env.DB.prepare('UPDATE service_leads SET owner_notification_status=?,owner_notification_sent_at=?,owner_notification_error=?,customer_confirmation_status=?,customer_confirmation_sent_at=?,customer_confirmation_error=?,updated_at=? WHERE id=?')
        .bind(ownerStatus, ownerSentAt, ownerStatus === 'failed' ? 'Email delivery failed; retry required.' : null, customerStatus, customerSentAt, customerStatus === 'failed' ? 'Email delivery failed; retry required.' : null, updatedAt, id),
      env.DB.prepare(`INSERT INTO service_lead_events (id,service_lead_id,actor_role,event_type,note,metadata,created_at)
        VALUES (?,?,'system','email_delivery_result',?,?,?)`).bind(
        crypto.randomUUID(), id, 'Email notification processing completed.',
        JSON.stringify({ owner: ownerStatus, customer: customerStatus }), updatedAt,
      ),
    ])
  } catch {
    console.error('Service lead email status could not be recorded.')
  }

  return json({ leadNumber, emailStatus: ownerStatus, customerEmailStatus: customerStatus }, 201)
}

export const onRequestPost = async ({ request, env }: { request: Request; env: RuntimeEnv }) => {
  const requestId = crypto.randomUUID()
  try {
    const originError = checkSameOriginPublicPost(request)
    if (originError) return originError
    const rateLimitResponse = await enforcePublicRateLimit(request, env.DB, { scope: 'service-leads', limit: 5, periodSeconds: 900 })
    if (rateLimitResponse) return rateLimitResponse
    const boundedBody = await readBoundedRequestBody(request, 16384)
    if (boundedBody.response) return boundedBody.response
    return await handlePost(env, boundedBody.text, request.url)
  } catch {
    console.error('Unhandled POST /api/service-leads exception:', { requestId })
    return json({ error: 'Възникна техническа грешка при изпращането на заявката. Моля, опитайте отново.' }, 500)
  }
}
