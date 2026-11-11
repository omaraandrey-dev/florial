import type { ManagerEnv } from './manager/_lib'
import { sendOrderEmail } from './_lib/order-documents'
import { checkSameOriginPublicPost, enforcePublicRateLimit, readBoundedRequestBody } from './_lib/public-api-security'
import { normalizeContractWithdrawal, buildWithdrawalDeclaration, escapeWithdrawalHtml } from './_lib/contract-withdrawals.mjs'

type RuntimeEnv = ManagerEnv
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
})

const copy = (locale: 'bg' | 'ru' | 'en') => ({
  subject: locale === 'ru' ? 'Подтверждение получения отказа от договора — Florial'
    : locale === 'en' ? 'Contract withdrawal received — Florial'
      : 'Потвърждение за получен отказ от договор — Florial',
  title: locale === 'ru' ? 'Мы получили ваше заявление об отказе'
    : locale === 'en' ? 'We received your contract withdrawal'
      : 'Получихме Вашето заявление за отказ от договор',
  intro: locale === 'ru' ? 'Это письмо подтверждает получение вашего онлайн-заявления. Оно содержит отправленные вами сведения и время подачи.'
    : locale === 'en' ? 'This email confirms receipt of your online declaration. It includes the information you submitted and the submission time.'
      : 'Това писмо потвърждава получаването на Вашето онлайн заявление. То съдържа подадената от Вас информация и часа на подаване.',
  reference: locale === 'ru' ? 'Договор / номер заказа' : locale === 'en' ? 'Contract / order reference' : 'Договор / номер на поръчка',
  name: locale === 'ru' ? 'Имя потребителя' : locale === 'en' ? 'Consumer name' : 'Име на потребителя',
  email: locale === 'ru' ? 'Адрес для подтверждения' : locale === 'en' ? 'Confirmation email' : 'Имейл за потвърждение',
  submitted: locale === 'ru' ? 'Дата и время подачи (Europe/Sofia)' : locale === 'en' ? 'Submission date and time (Europe/Sofia)' : 'Дата и час на подаване (Europe/Sofia)',
  declaration: locale === 'ru' ? 'Содержание заявления' : locale === 'en' ? 'Declaration content' : 'Съдържание на заявлението',
  next: locale === 'ru' ? 'Команда Florial проверит заявление и свяжется с вами при необходимости. Это подтверждение получения заявления, а не подтверждение завершения возврата товара или денежных средств.'
    : locale === 'en' ? 'The Florial team will review the declaration and contact you if necessary. This confirms receipt of the declaration, not completion of a goods return or refund.'
      : 'Екипът на Florial ще прегледа заявлението и ще се свърже с Вас при необходимост. Това потвърждава получаването на заявлението, а не приключването на връщането на стоката или възстановяването на суми.',
})

const dateLabel = (value: string, locale: 'bg' | 'ru' | 'en') => new Intl.DateTimeFormat(
  locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'bg-BG',
  { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Europe/Sofia' },
).format(new Date(value))

const confirmationHtml = (
  value: { customerName: string; contractReference: string; customerEmail: string; locale: 'bg' | 'ru' | 'en'; declarationText: string },
  submittedAt: string,
) => {
  const labels = copy(value.locale)
  const safe = escapeWithdrawalHtml
  return '<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#26352d">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e2ebe4;border-radius:16px">' +
    '<tr><td style="padding:28px 30px;border-bottom:1px solid #e8efe9"><div style="font-size:22px;font-weight:700;color:#176b49">FLORIAL</div><div style="padding-top:8px;color:#557263">Градински център Флориал</div></td></tr>' +
    '<tr><td style="padding:28px 30px"><h1 style="font-size:22px;line-height:1.35;color:#176b49">' + safe(labels.title) + '</h1>' +
    '<p>' + safe(labels.intro) + '</p><dl>' +
    '<dt><strong>' + safe(labels.name) + '</strong></dt><dd>' + safe(value.customerName) + '</dd>' +
    '<dt><strong>' + safe(labels.reference) + '</strong></dt><dd>' + safe(value.contractReference) + '</dd>' +
    '<dt><strong>' + safe(labels.email) + '</strong></dt><dd>' + safe(value.customerEmail) + '</dd>' +
    '<dt><strong>' + safe(labels.submitted) + '</strong></dt><dd>' + safe(dateLabel(submittedAt, value.locale)) + '</dd>' +
    '<dt><strong>' + safe(labels.declaration) + '</strong></dt><dd style="white-space:pre-wrap">' + safe(value.declarationText) + '</dd>' +
    '</dl><p>' + safe(labels.next) + '</p><p style="margin-top:28px;color:#557263">Florial · Несебър, България<br>+359 876 777 902<br>https://florial-bg.com</p></td></tr></table></body></html>'
}

export const onRequestPost = async ({ request, env }: { request: Request; env: RuntimeEnv }) => {
  const requestId = crypto.randomUUID()
  try {
    const originError = checkSameOriginPublicPost(request)
    if (originError) return originError
    const rateLimitResponse = await enforcePublicRateLimit(request, env.DB, { scope: 'contract-withdrawals', limit: 5, periodSeconds: 900 })
    if (rateLimitResponse) return rateLimitResponse
    const bounded = await readBoundedRequestBody(request, 16384)
    if (bounded.response) return bounded.response

    let body: unknown
    try { body = JSON.parse(bounded.text) } catch { return json({ error: 'Невалидна заявка.' }, 400) }
    const normalized = normalizeContractWithdrawal(body)
    if (normalized.error || !normalized.value) {
      const message = normalized.error === 'NAME_REQUIRED' ? 'Моля, въведете име и фамилия.'
        : normalized.error === 'REFERENCE_REQUIRED' ? 'Моля, въведете номер на поръчка или данни за договора.'
          : normalized.error === 'EMAIL_INVALID' ? 'Моля, въведете валиден имейл адрес.'
            : 'Невалидна заявка.'
      return json({ error: message }, 400)
    }
    if (!env.DB) return json({ error: 'Системата временно не е достъпна. Моля, опитайте отново.' }, 503)

    const value = normalized.value
    const locale = value.locale as 'bg' | 'ru' | 'en'
    const declarationText = buildWithdrawalDeclaration({
      customerName: value.customerName,
      contractReference: value.contractReference,
      customerComment: value.customerComment,
      locale,
    })
    const submittedAt = new Date().toISOString()
    const id = crypto.randomUUID()
    const idempotencyKey = 'contract-withdrawal-' + id
    let linkedOrderId: string | null = null
    try {
      const order = await env.DB.prepare(
        "SELECT id FROM orders WHERE order_number=? AND lower(trim(COALESCE(email,'')))=? LIMIT 1",
      ).bind(value.contractReference, value.customerEmail).first<{ id: string }>()
      linkedOrderId = order?.id || null
    } catch {
      linkedOrderId = null
    }

    try {
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO contract_withdrawals
          (id,order_id,contract_reference,customer_name,customer_email,locale,declaration_text,customer_comment,
           status,confirmation_status,submitted_at,created_at,updated_at,idempotency_key)
          VALUES (?,?,?,?,?,?,?,?,'received','pending',?,?,?,?)`)
          .bind(id, linkedOrderId, value.contractReference, value.customerName, value.customerEmail, locale,
            declarationText, value.customerComment || null, submittedAt, submittedAt, submittedAt, idempotencyKey),
        env.DB.prepare(`INSERT INTO contract_withdrawal_events
          (id,withdrawal_id,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at)
          VALUES (?,?,NULL,'Потребител','customer','declaration_received',NULL,'received',NULL,?,?)`)
          .bind(crypto.randomUUID(), id, JSON.stringify({ orderMatched: Boolean(linkedOrderId), locale }), submittedAt),
      ])
    } catch (error) {
      console.error('Contract withdrawal D1 insert failed:', { requestId, message: error instanceof Error ? error.message.slice(0, 160) : 'unknown' })
      return json({ error: 'Не успяхме да регистрираме заявлението. Моля, опитайте отново или се свържете с Florial.', requestId }, 502)
    }

    let confirmationStatus: 'sent' | 'failed' | 'not_configured' = 'not_configured'
    let confirmationError: string | null = null
    if (env.RESEND_API_KEY && env.EMAIL_FROM) {
      try {
        await sendOrderEmail(
          env.RESEND_API_KEY,
          env.EMAIL_FROM,
          value.customerEmail,
          copy(locale).subject,
          confirmationHtml({ ...value, declarationText }, submittedAt),
          undefined,
          idempotencyKey + '-customer-confirmation',
        )
        confirmationStatus = 'sent'
      } catch {
        confirmationStatus = 'failed'
        confirmationError = 'Неуспешно изпращане чрез имейл доставчика.'
      }
      const sellerEmail = typeof env.ORDER_NOTIFICATION_EMAIL === 'string' ? env.ORDER_NOTIFICATION_EMAIL.trim() : ''
      if (sellerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
        const ownerHtml = '<h1>Ново заявление за отказ от договор</h1><p>Референция: ' + escapeWithdrawalHtml(value.contractReference) +
          '</p><p>Клиент: ' + escapeWithdrawalHtml(value.customerName) + '<br>Имейл: ' + escapeWithdrawalHtml(value.customerEmail) +
          '<br>Подадено: ' + escapeWithdrawalHtml(dateLabel(submittedAt, 'bg')) + '</p><p>' +
          escapeWithdrawalHtml(declarationText) + '</p><p>Отворете Florial Manager за обработка.</p>'
        try {
          await sendOrderEmail(env.RESEND_API_KEY, env.EMAIL_FROM, sellerEmail,
            'Ново заявление за отказ — ' + value.contractReference + ' — Florial',
            ownerHtml, undefined, idempotencyKey + '-owner-notification')
        } catch {
          console.error('Contract withdrawal owner notification failed:', { requestId })
        }
      }
    }

    try {
      await env.DB.prepare(`UPDATE contract_withdrawals
        SET confirmation_status=?, confirmation_sent_at=?, confirmation_error=?, updated_at=?
        WHERE id=?`)
        .bind(confirmationStatus, confirmationStatus === 'sent' ? new Date().toISOString() : null,
          confirmationError, new Date().toISOString(), id).run()
      await env.DB.prepare(`INSERT INTO contract_withdrawal_events
        (id,withdrawal_id,actor_id,actor_name,actor_role,event_type,from_status,to_status,note,metadata,created_at)
        VALUES (?,?,NULL,'Система','system',?,NULL,NULL,?,?,?)`)
        .bind(crypto.randomUUID(), id, 'confirmation_' + confirmationStatus, confirmationError,
          JSON.stringify({ emailSent: confirmationStatus === 'sent' }), new Date().toISOString()).run()
    } catch {
      console.error('Contract withdrawal confirmation state update failed:', { requestId, withdrawalId: id })
    }

    return json({
      accepted: true,
      reference: value.contractReference,
      submittedAt,
      confirmationStatus,
      message: confirmationStatus === 'sent'
        ? locale === 'ru' ? 'Заявление зарегистрировано. Подтверждение отправлено на вашу электронную почту.'
          : locale === 'en' ? 'Your declaration has been registered. A confirmation has been emailed to you.'
            : 'Заявлението е регистрирано. Изпратихме потвърждение на Вашия имейл.'
        : locale === 'ru' ? 'Заявление зарегистрировано, но подтверждение по электронной почте пока не отправлено. Свяжитесь с Florial, если письмо не поступит.'
          : locale === 'en' ? 'Your declaration has been registered, but the email confirmation has not been sent yet. Please contact Florial if you do not receive it.'
            : 'Заявлението е регистрирано, но потвърждението по имейл все още не е изпратено. Свържете се с Florial, ако не получите писмо.',
    }, 201)
  } catch (error) {
    console.error('Unhandled POST /api/withdrawals exception:', {
      requestId,
      message: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
    })
    return json({ error: 'Възникна техническа грешка. Моля, опитайте отново.', requestId }, 500)
  }
}
