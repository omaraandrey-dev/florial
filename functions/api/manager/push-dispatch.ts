import { buildPushPayload, type PushSubscription, type VapidKeys } from '@block65/webcrypto-web-push'
import type { ManagerEnv } from './_lib'

type PushKind = 'order' | 'service-lead'
type SubscriptionRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

const getVapid = (env: ManagerEnv): VapidKeys | null => {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return null
  return { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
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

    await Promise.allSettled(recipients.results.map(async (row) => {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        expirationTime: null,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }
      try {
        const init = await buildPushPayload({ data: payloadData, options: { ttl: 300 } }, subscription, vapid)
        const response = await fetch(row.endpoint, init)
        if (response.status === 404 || response.status === 410) {
          await env.DB!.prepare('DELETE FROM manager_push_subscriptions WHERE id=?').bind(row.id).run()
        } else if (!response.ok) {
          console.warn('Manager push provider returned HTTP', response.status)
        }
      } catch (error) {
        console.warn('Manager push delivery failed:', error instanceof Error ? error.message : 'unknown')
      }
    }))
  } catch (error) {
    // Push is best-effort and must never break checkout or a service enquiry.
    console.error('Manager push dispatch failed:', error instanceof Error ? error.message : 'unknown')
  }
}
