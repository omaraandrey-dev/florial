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


const buildCustomerConfirmationHtml = (
  locale: 'bg' | 'ru' | 'en',
  title: string,
  body: string,
): string => {
  const companyName = locale === 'ru'
    ? 'Садовый центр Florial'
    : locale === 'en'
      ? 'Florial Garden Centre'
      : 'Градински център Флориал'
  const contactHeading = locale === 'ru'
    ? 'Свяжитесь с нами'
    : locale === 'en'
      ? 'Contact our team'
      : 'Свържете се с нас'
  const bulgarianLabel = locale === 'ru' ? 'Болгарский' : locale === 'en' ? 'Bulgarian' : 'Български'
  const otherLanguagesLabel = locale === 'ru'
    ? 'Русский · Українська · English'
    : locale === 'en'
      ? 'Russian · Ukrainian · English'
      : 'Руски · Украински · Английски'
  const whatsappLabel = locale === 'ru' ? 'WhatsApp' : locale === 'en' ? 'WhatsApp' : 'WhatsApp'
  const websiteLabel = locale === 'ru' ? 'Официальный сайт' : locale === 'en' ? 'Official website' : 'Официален сайт'
  const safeTitle = escapeHtml(title)
  const safeBody = escapeHtml(body)
  const safeCompanyName = escapeHtml(companyName)

  return '<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#26352d;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2ebe4;border-radius:16px;overflow:hidden;">' +
    '<tr><td align="center" style="padding:28px 24px 20px;background:#ffffff;border-bottom:1px solid #e8efe9;">' +
    '<img src="https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png" width="190" alt="Florial — ' + safeCompanyName + '" style="display:block;width:190px;max-width:75%;height:auto;border:0;outline:none;text-decoration:none;">' +
    '<div style="padding-top:12px;font-size:13px;letter-spacing:.3px;color:#557263;">' + safeCompanyName + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:30px 30px 18px;">' +
    '<h1 style="margin:0 0 18px;font-size:23px;line-height:1.3;font-weight:700;color:#176b49;">' + safeTitle + '</h1>' +
    '<p style="margin:0;font-size:16px;line-height:1.75;color:#34463b;">' + safeBody + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:8px 30px 28px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f2f7f3;border:1px solid #e0ebe2;border-radius:12px;">' +
    '<tr><td style="padding:18px 20px 8px;font-size:16px;font-weight:700;color:#176b49;">' + contactHeading + '</td></tr>' +
    '<tr><td style="padding:8px 20px 4px;font-size:12px;font-weight:700;letter-spacing:.35px;text-transform:uppercase;color:#718176;">' + bulgarianLabel + '</td></tr>' +
    '<tr><td style="padding:0 20px 10px;font-size:16px;"><a href="tel:+359876777902" style="color:#176b49;font-weight:700;text-decoration:none;">+359 876 777 902</a></td></tr>' +
    '<tr><td style="padding:4px 20px;font-size:12px;font-weight:700;letter-spacing:.2px;color:#718176;">' + otherLanguagesLabel + '</td></tr>' +
    '<tr><td style="padding:0 20px 12px;font-size:16px;"><a href="tel:+359885834860" style="color:#176b49;font-weight:700;text-decoration:none;">+359 885 834 860</a></td></tr>' +
    '<tr><td style="padding:0 20px 8px;font-size:12px;font-weight:700;letter-spacing:.35px;text-transform:uppercase;color:#718176;">' + whatsappLabel + '</td></tr>' +
    '<tr><td style="padding:0 20px 18px;font-size:16px;"><a href="https://wa.me/380674807486" style="color:#176b49;font-weight:700;text-decoration:none;">+380 67 480 7486</a></td></tr>' +
    '</table>' +
    '</td></tr>' +
    '<tr><td align="center" style="padding:18px 24px 24px;background:#176b49;color:#ffffff;">' +
    '<div style="font-size:13px;font-weight:700;">' + safeCompanyName + '</div>' +
    '<a href="https://florial-bg.com" style="display:inline-block;padding-top:7px;font-size:12px;color:#e1f2e7;text-decoration:underline;">' + websiteLabel + ' · florial-bg.com</a>' +
    '</td></tr></table></body></html>'
}

const sendNotification = async (
  env: RuntimeEnv,
  recipient: string,
  subject: string,
  html: string,
  idempotencyKey: string,
): Promise<boolean> => {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !recipient || !isValidLeadEmail(recipient)) return false
  try {
    await sendOrderEmail(env.RESEND_API_KEY, env.EMAIL_FROM, recipient, subject, html, undefined, idempotencyKey)
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
  if (!configuredFields.length) {
    return json({ error: 'Формата все още не е конфигурирана.' }, 503)
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
  const extraFields = Object.fromEntries(Object.entries(fields).filter(([key]) => !['name', 'phone', 'email', 'location', 'address', 'details', 'comment'].includes(key)))
  const ownerRecipient = cleanLeadText(env.ORDER_NOTIFICATION_EMAIL, 254)
  const mailConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)
  const ownerInitialStatus = ownerRecipient && mailConfigured ? 'pending' : 'not_configured'
  const customerInitialStatus = email ? (mailConfigured ? 'pending' : 'failed') : 'not_requested'

  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO service_leads (
        id,lead_number,idempotency_key,service_document_id,service_slug,service_name,locale,
        customer_name,phone,email,location,address,comment,fields_json,status,owner_notification_status,customer_confirmation_status,
        created_at,updated_at,retention_until
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?,?,?,?,?)`).bind(
        id, leadNumber, idempotencyKey, service._id, serviceSlug, serviceName, locale,
        customerName, phone, email || null, location, address || null, comment || null,
        JSON.stringify(extraFields), ownerInitialStatus, customerInitialStatus, createdAt, createdAt, retentionUntil,
      ),
      env.DB.prepare(`INSERT INTO service_lead_events (
        id,service_lead_id,actor_role,event_type,to_status,note,metadata,created_at
      ) VALUES (?,?, 'system','lead_created','new',?,?,?)`).bind(
        crypto.randomUUID(), id, 'Customer submitted a service enquiry.', JSON.stringify({ locale, service_slug: serviceSlug }), createdAt,
      ),
    ])
  } catch {
    const existing = await env.DB.prepare(`SELECT id,lead_number,service_name,locale,customer_name,phone,email,location,address,comment,owner_notification_status,owner_notification_sent_at,customer_confirmation_status,customer_confirmation_sent_at FROM service_leads WHERE idempotency_key=? LIMIT 1`)
      .bind(idempotencyKey).first<{
        id: string
        lead_number: string
        service_name: string
        locale: 'bg' | 'ru' | 'en'
        customer_name: string
        phone: string
        email: string | null
        location: string
        address: string | null
        comment: string | null
        owner_notification_status: 'pending' | 'sent' | 'failed' | 'not_configured'
        owner_notification_sent_at: string | null
        customer_confirmation_status: 'not_requested' | 'pending' | 'sent' | 'failed'
        customer_confirmation_sent_at: string | null
      }>()
    if (existing?.lead_number) {
      const ownerRecipientForRetry = cleanLeadText(env.ORDER_NOTIFICATION_EMAIL, 254)
      const retryMailConfigured = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM)
      const managerUrlForRetry = new URL('/manager', requestUrl).toString()
      let ownerRetryStatus = existing.owner_notification_status
      let ownerRetrySentAt = existing.owner_notification_sent_at
      if (ownerRetryStatus !== 'sent' && ownerRecipientForRetry && retryMailConfigured) {
        const retryOwnerHtml = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#26332c"><h2>Нова заявка за услуга — Florial</h2>' +
          '<p><strong>Номер:</strong> ' + escapeHtml(existing.lead_number) + '<br><strong>Услуга:</strong> ' + escapeHtml(existing.service_name) +
          '<br><strong>Клиент:</strong> ' + escapeHtml(existing.customer_name) + '<br><strong>Телефон:</strong> ' + escapeHtml(existing.phone) +
          '<br><strong>Имейл:</strong> ' + escapeHtml(existing.email || 'Не е посочен') + '<br><strong>Населено място:</strong> ' + escapeHtml(existing.location) +
          (existing.address ? '<br><strong>Адрес:</strong> ' + escapeHtml(existing.address) : '') +
          (existing.comment ? '<br><strong>Описание:</strong> ' + escapeHtml(existing.comment) : '') +
          '</p><p><a href="' + escapeHtml(managerUrlForRetry) + '">Отвори Florial Manager</a></p></div>'
        const sent = await sendNotification(env, ownerRecipientForRetry, localizedText('bg', 'owner', existing.lead_number, existing.service_name), retryOwnerHtml, 'service-lead/' + existing.id + '/owner')
        ownerRetryStatus = sent ? 'sent' : 'failed'
        ownerRetrySentAt = sent ? new Date().toISOString() : null
      } else if (!ownerRecipientForRetry || !retryMailConfigured) {
        ownerRetryStatus = 'not_configured'
      }

      let customerRetryStatus = existing.customer_confirmation_status
      let customerRetrySentAt = existing.customer_confirmation_sent_at
      if (existing.email && customerRetryStatus !== 'sent' && retryMailConfigured) {
        const retryCustomerBody = localizedText(existing.locale, 'customerBody', existing.lead_number, existing.service_name)
        const retryCustomerHtml = buildCustomerConfirmationHtml(
          existing.locale,
          localizedText(existing.locale, 'customerTitle', existing.lead_number, existing.service_name),
          retryCustomerBody,
        )
        const sent = await sendNotification(env, existing.email, localizedText(existing.locale, 'customerTitle', existing.lead_number, existing.service_name), retryCustomerHtml, 'service-lead/' + existing.id + '/customer')
        customerRetryStatus = sent ? 'sent' : 'failed'
        customerRetrySentAt = sent ? new Date().toISOString() : null
      } else if (!existing.email) {
        customerRetryStatus = 'not_requested'
      }

      try {
        const retryUpdatedAt = new Date().toISOString()
        await env.DB.batch([
          env.DB.prepare('UPDATE service_leads SET owner_notification_status=?,owner_notification_sent_at=?,owner_notification_error=?,customer_confirmation_status=?,customer_confirmation_sent_at=?,customer_confirmation_error=?,updated_at=? WHERE id=?')
            .bind(ownerRetryStatus, ownerRetrySentAt, ownerRetryStatus === 'failed' ? 'Email delivery failed; retry required.' : null, customerRetryStatus, customerRetrySentAt, customerRetryStatus === 'failed' ? 'Email delivery failed; retry required.' : null, retryUpdatedAt, existing.id),
          env.DB.prepare(`INSERT INTO service_lead_events (id,service_lead_id,actor_role,event_type,note,metadata,created_at)
            VALUES (?,?,'system','email_retry_result',?,?,?)`).bind(
            crypto.randomUUID(), existing.id, 'Email retry processing completed.',
            JSON.stringify({ owner: ownerRetryStatus, customer: customerRetryStatus }), retryUpdatedAt,
          ),
        ])
      } catch {
        console.error('Service lead retry status could not be recorded.')
      }
      return json({ leadNumber: existing.lead_number, duplicate: true, emailStatus: ownerRetryStatus, customerEmailStatus: customerRetryStatus }, 200)
    }
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
    const sent = await sendNotification(env, ownerRecipient, localizedText('bg', 'owner', leadNumber, serviceName), ownerHtml, 'service-lead/' + id + '/owner')
    ownerStatus = sent ? 'sent' : 'failed'
    ownerSentAt = sent ? new Date().toISOString() : null
  }

  let customerStatus: 'not_requested' | 'sent' | 'failed' = 'not_requested'
  let customerSentAt: string | null = null
  if (email) {
    const customerBody = localizedText(locale, 'customerBody', leadNumber, serviceName)
    const customerHtml = buildCustomerConfirmationHtml(
      locale,
      localizedText(locale, 'customerTitle', leadNumber, serviceName),
      customerBody,
    )
    const sent = await sendNotification(env, email, localizedText(locale, 'customerTitle', leadNumber, serviceName), customerHtml, 'service-lead/' + id + '/customer')
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
