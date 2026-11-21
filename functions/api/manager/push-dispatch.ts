import { buildPushPayload, type PushSubscription, type VapidKeys } from '@block65/webcrypto-web-push'
import type { ManagerEnv } from './_lib'

type PushKind = 'order' | 'service-lead'
type SubscriptionRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

const getVapid = (env: ManagerEnv): VapidKeys | null => {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return null
  return { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
}

type PushDiagnostic = {
  phase: 'signing' | 'provider' | 'network'
  code: 'payload_signing_failed' | 'provider_http_error' | 'subscription_expired' | 'network_timeout' | 'network_error'
  status: number | null
  errorName: string | null
}

type PushAttempt = { status: 'accepted' | 'expired' | 'failed'; diagnostic?: PushDiagnostic }

const safeErrorName = (error: unknown): string | null => {
  if (!(error instanceof Error)) return null
  return /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(error.name) ? error.name : 'Error'
}

export const sendManagerPushToSubscriptions = async (
  env: ManagerEnv,
  recipients: SubscriptionRow[],
  payloadData: string,
): Promise<{ attempted: number; accepted: number; expired: number; failed: number; diagnostics: PushDiagnostic[] }> => {
  const vapid = getVapid(env)
  if (!vapid) throw new Error('Push notifications are not configured.')
  const results = await Promise.allSettled(recipients.map(async (row): Promise<PushAttempt> => {
    const subscription: PushSubscription = { endpoint: row.endpoint, expirationTime: null, keys: { p256dh: row.p256dh, auth: row.auth } }
    let init: RequestInit
    try {
      init = await buildPushPayload({ data: payloadData, options: { ttl: 300 } }, subscription, vapid)
    } catch (error) {
      return { status: 'failed', diagnostic: { phase: 'signing', code: 'payload_signing_failed', status: null, errorName: safeErrorName(error) } }
    }
    try {
      const response = await fetch(row.endpoint, { ...init, redirect: 'error', signal: AbortSignal.timeout(5000) })
      if (response.status === 404 || response.status === 410) {
        await env.DB!.prepare('DELETE FROM manager_push_subscriptions WHERE id=?').bind(row.id).run()
        return { status: 'expired', diagnostic: { phase: 'provider', code: 'subscription_expired', status: response.status, errorName: null } }
      }
      if (!response.ok) {
        console.warn('Manager push provider returned HTTP', response.status)
        return { status: 'failed', diagnostic: { phase: 'provider', code: 'provider_http_error', status: response.status, errorName: null } }
      }
      return { status: 'accepted' }
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
      return {
        status: 'failed',
        diagnostic: {
          phase: 'network',
          code: timedOut ? 'network_timeout' : 'network_error',
          status: null,
          errorName: safeErrorName(error),
        },
      }
    }
  }))
  const attempts = results.map((result): PushAttempt => result.status === 'fulfilled'
    ? result.value
    : { status: 'failed', diagnostic: { phase: 'network', code: 'network_error', status: null, errorName: safeErrorName(result.reason) } })
  const accepted = attempts.filter((x) => x.status === 'accepted').length
  const expired = attempts.filter((x) => x.status === 'expired').length
  const diagnostics = attempts.flatMap((x) => x.diagnostic ? [x.diagnostic] : [])
  return { attempted: attempts.length, accepted, expired, failed: attempts.length - accepted - expired, diagnostics }
}

export const dispatchManagerPush = async (
  env: ManagerEnv,
  kind: PushKind,
  reference: string,
): Promise<void> => {
  if (!env.DB) return
  const vapid = getVapid(env)
  if (!vapid) return

  try {
    if (kind === 'order') {
      const order = await env.DB.prepare('SELECT is_test FROM orders WHERE order_number=? LIMIT 1')
        .bind(reference).first<{ is_test: number }>()
      if (!order || order.is_test === 1) return
    }

    const recipients = kind === 'order'
      ? await env.DB.prepare(`
          SELECT s.id,s.user_id,s.endpoint,s.p256dh,s.auth
          FROM manager_push_subscriptions s
          JOIN catalog_staff_profiles p ON p.user_id=s.user_id
          WHERE p.is_active=1 AND p.role IN ('owner','manager','seller')
        `).all<SubscriptionRow>()
      : await env.DB.prepare(`
          SELECT s.id,s.user_id,s.endpoint,s.p256dh,s.auth
          FROM manager_push_subscriptions s
          JOIN catalog_staff_profiles p ON p.user_id=s.user_id
          WHERE p.is_active=1 AND p.role='owner'
        `).all<SubscriptionRow>()

    const title = kind === 'order' ? 'Нова поръчка' : 'Нова заявка за услуга'
    const body = kind === 'order' ? 'Поръчка ' + reference : 'Заявка ' + reference
    const url = kind === 'order' ? '/manager/?section=orders' : '/manager/?section=serviceLeads'
    const payloadData = JSON.stringify({ title, body, url })

    await sendManagerPushToSubscriptions(env, recipients.results, payloadData)
  } catch (error) {
    // Push is best-effort and must never break checkout or a service enquiry.
    console.error('Manager push dispatch failed:', error instanceof Error ? error.message : 'unknown')
  }
}
