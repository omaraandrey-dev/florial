export type TrackingEventType = 'page_view' | 'call_bg' | 'call_en_ru' | 'chat_click'
export type TrackingLanguage = 'bg' | 'ru' | 'en'

const MAX_PAGE_PATH_LENGTH = 200
const TEST_MODE_PARAM = 'florial_test'

// This flag exists only in this page's JavaScript memory. Nothing is persisted.
let testMode = typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get(TEST_MODE_PARAM) === '1'

export function setTrackingTestMode(enabled: boolean): void {
  testMode = enabled
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
