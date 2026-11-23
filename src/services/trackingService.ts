export type TrackingEventType = 'page_view' | 'call_bg' | 'call_en_ru' | 'chat_click'
export type TrackingLanguage = 'bg' | 'ru' | 'en'
export type AnalyticsConsent = 'accepted' | 'rejected' | 'unknown'

const MAX_PAGE_PATH_LENGTH = 200
const TEST_MODE_PARAM = 'florial_test'
export const ANALYTICS_CONSENT_KEY = 'florial:analytics-consent:v1'
const ANALYTICS_CONSENT_VERSION = '2026-11-14-v1'
const POSTHOG_HOST = 'https://eu.i.posthog.com'
const postHogProjectKey = import.meta.env.VITE_POSTHOG_PROJECT_KEY as string | undefined

// A random in-memory identifier groups events only within this browser tab until the page is reloaded.
// It is not stored in cookies or browser storage and is not linked to a customer.
const anonymousSessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `session-${Math.random().toString(36).slice(2)}`

let testMode = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get(TEST_MODE_PARAM) === '1'

export function setTrackingTestMode(enabled: boolean): void {
  testMode = enabled
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown'
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    return value === 'accepted' || value === 'rejected' ? value : 'unknown'
  } catch {
    return 'unknown'
  }
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, 'unknown'>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value)
    if (value === 'accepted') initializeGA4()
    else {
      const target = window as Window & { gtag?: (...args: unknown[]) => void }
      target.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    }
  } catch {
    // If the preference cannot be saved, analytics remains disabled.
  }
}

function capturePostHogEvent(
  eventName: string,
  lang: TrackingLanguage,
  pagePath: string,
  details: { product_type?: string; quantity?: number } = {},
): void {
  if (!postHogProjectKey || getAnalyticsConsent() !== 'accepted') return
  try {
    void fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: postHogProjectKey,
        event: eventName,
        distinct_id: anonymousSessionId,
        properties: {
          distinct_id: anonymousSessionId,
          language: lang,
          page_path: pagePath,
          consent_version: ANALYTICS_CONSENT_VERSION,
          $lib: 'florial-web',
          ...details,
        },
      }),
      keepalive: true,
    }).catch(() => {
      // Analytics delivery must never interfere with the storefront.
    })
  } catch {
    // Analytics delivery must never interfere with the storefront.
  }
}

export function trackPostHogEvent(
  eventName: 'florial_page_view' | 'florial_product_view' | 'florial_category_view' | 'florial_cart_view' | 'florial_add_to_cart' | 'florial_checkout_start',
  lang: TrackingLanguage,
  pagePath: string,
  details: { product_type?: string; quantity?: number } = {},
): void {
  if (testMode || typeof window === 'undefined') return
  if (!['bg', 'ru', 'en'].includes(lang)) return
  if (typeof pagePath !== 'string' || !pagePath.startsWith('/') || pagePath.length > MAX_PAGE_PATH_LENGTH) return
  if (details.product_type !== undefined && (typeof details.product_type !== 'string' || details.product_type.length > 40)) return
  if (details.quantity !== undefined && (!Number.isFinite(details.quantity) || details.quantity < 1 || details.quantity > 9999)) return
  capturePostHogEvent(eventName, lang, pagePath, details)
}

export function trackEvent(
  event_type: TrackingEventType,
  lang: TrackingLanguage,
  page_path: string,
): void {
  if (testMode || typeof window === 'undefined' || typeof navigator === 'undefined') return

  const allowedEvents: TrackingEventType[] = ['page_view', 'call_bg', 'call_en_ru', 'chat_click']
  const allowedLanguages: TrackingLanguage[] = ['bg', 'ru', 'en']
  if (!allowedEvents.includes(event_type) || !allowedLanguages.includes(lang)) return
  if (typeof page_path !== 'string' || !page_path.startsWith('/') || page_path.length > MAX_PAGE_PATH_LENGTH) return

  const postHogEvent = event_type === 'page_view'
    ? 'florial_page_view'
    : event_type === 'chat_click'
      ? 'florial_chat_click'
      : 'florial_phone_click'
  // D1 is the first-party baseline site-statistics store and is independent of
  // the optional PostHog preference. PostHog remains consent-gated inside
  // capturePostHogEvent().
  capturePostHogEvent(postHogEvent, lang, page_path)

  if (event_type === 'page_view') trackGA4Event('page_view', { page_location: window.location.origin + page_path, page_path, page_title: document.title, language: lang })

  const payload = JSON.stringify({ event_type, lang, page_path })
  try {
    if (typeof navigator.sendBeacon === 'function') {
      const accepted = navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
      if (accepted) return
    }
  } catch {
    // Analytics must never interfere with the main site action.
  }

  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Intentionally ignore analytics delivery failures.
    })
  } catch {
    // Intentionally ignore analytics delivery failures.
  }
}


const GA4_MEASUREMENT_ID = 'G-2H9DQTLVZY'
type GA4Item = { item_id: string; item_name: string; item_category?: string; item_variant?: string; price: number; quantity: number }
type GA4Window = Window & { dataLayer?: unknown[][]; gtag?: (...args: unknown[]) => void }

function initializeGA4(): void {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'accepted') return
  const target = window as GA4Window
  if (!target.gtag) {
    target.dataLayer = target.dataLayer || []
    target.gtag = function gtag(...args: unknown[]) { target.dataLayer!.push(args) }
    target.gtag('js', new Date())
    target.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false })
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID
    script.referrerPolicy = 'strict-origin-when-cross-origin'
    document.head.appendChild(script)
  }
  // Reapply consent on every explicit acceptance, including after a previous withdrawal.
  target.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}

export function trackGA4Event(eventName: string, parameters: Record<string, unknown> = {}): void {
  if (testMode || typeof window === 'undefined' || getAnalyticsConsent() !== 'accepted') return
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(eventName)) return
  initializeGA4()
  const target = window as GA4Window
  try {
    target.gtag?.('event', eventName, parameters)
  } catch {
    // Analytics delivery must never interfere with storefront actions.
  }
}

export function trackGA4Purchase(purchase: {
  transaction_id: string
  value: number
  shipping?: number
  currency: 'EUR'
  items: GA4Item[]
}): void {
  if (!purchase.transaction_id || !Number.isFinite(purchase.value) || purchase.value < 0 || purchase.items.length === 0) return
  trackGA4Event('purchase', {
    transaction_id: purchase.transaction_id,
    value: purchase.value,
    currency: purchase.currency,
    ...(typeof purchase.shipping === 'number' && Number.isFinite(purchase.shipping) ? { shipping: purchase.shipping } : {}),
    items: purchase.items,
  })
}
