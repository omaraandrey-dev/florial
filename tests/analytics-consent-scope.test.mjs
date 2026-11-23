import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [tracking, consent, privacy] = await Promise.all([
  readFile(new URL('../src/services/trackingService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AnalyticsConsent.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/PrivacyPolicyPage.tsx', import.meta.url), 'utf8'),
])

test('baseline Cloudflare D1 tracking is independent of the optional PostHog choice', () => {
  const trackEventStart = tracking.indexOf('export function trackEvent(')
  const trackEventEnd = tracking.indexOf('\n\nconst GA4_MEASUREMENT_ID', trackEventStart)
  const trackEvent = tracking.slice(trackEventStart, trackEventEnd)
  assert.doesNotMatch(trackEvent, /getAnalyticsConsent\(\)\s*!==\s*'accepted'/)
  assert.match(trackEvent, /navigator\.sendBeacon\('\/api\/track'/)
  assert.match(trackEvent, /fetch\('\/api\/track'/)
})

test('PostHog transmission remains explicitly consent-gated', () => {
  const capture = tracking.slice(tracking.indexOf('function capturePostHogEvent('), tracking.indexOf('export function trackPostHogEvent('))
  assert.match(capture, /getAnalyticsConsent\(\)\s*!==\s*'accepted'/)
})

test('consent panel explains the separate D1 and PostHog behavior in all locales', () => {
  assert.match(consent, /основна статистика[\s\S]*Cloudflare D1[\s\S]*PostHog/)
  assert.match(consent, /базовую статистику[\s\S]*Cloudflare D1[\s\S]*PostHog/)
  assert.match(consent, /basic usage statistics[\s\S]*Cloudflare D1[\s\S]*PostHog/)
})

test('privacy notice distinguishes baseline D1 records from optional PostHog events', () => {
  assert.match(privacy, /Cloudflare D1 независимо от избора/)
  assert.match(privacy, /Cloudflare D1 независимо от выбора/)
  assert.match(privacy, /Cloudflare D1 regardless of the visitor’s choice/)
  assert.match(privacy, /automatic deletion is not currently configured/)
})


test('GA4 tag and events are blocked unless optional analytics consent is accepted', () => {
  assert.match(tracking, /getAnalyticsConsent\(\) !== 'accepted'/)
  assert.match(tracking, /googletagmanager\.com\/gtag\/js/)
  assert.match(tracking, /analytics_storage: 'granted'/)
  assert.match(tracking, /analytics_storage: 'denied'/)
  assert.match(tracking, /Consent is queued before config/)
  assert.match(tracking, /target\.gtag\('consent', 'update', \{[\s\S]*analytics_storage: 'granted'/)
  assert.match(consent, /Google Analytics 4/)
  assert.match(consent, /checkout starts and confirmed orders|началото на оформяне|начале оформления/)
  assert.doesNotMatch(tracking, /page_location: window\.location\.href/)
  assert.match(privacy, /Google Analytics 4/)
})

test('GA4 purchase payload is returned only from the server-validated D1 order flow', async () => {
  const orderApi = await readFile(new URL('../functions/api/orders.ts', import.meta.url), 'utf8')
  const orderService = await readFile(new URL('../src/services/orderService.ts', import.meta.url), 'utf8')
  const cartPage = await readFile(new URL('../src/pages/CartPage.tsx', import.meta.url), 'utf8')
  assert.match(orderApi, /INSERT INTO orders/)
  assert.match(orderApi, /analyticsPurchase:/)
  assert.match(orderApi, /value: subtotal/)
  assert.match(orderApi, /currency: 'EUR'/)
  assert.match(orderApi, /items: orderItems\.map/)
  assert.match(orderService, /analyticsPurchase/)
  assert.match(cartPage, /trackGA4Purchase\(/)
  assert.match(cartPage, /begin_checkout/)
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /view_item/)
  assert.match(app, /view_cart/)
  assert.match(app, /add_to_cart/)
  assert.match(app, /remove_from_cart/)
  assert.doesNotMatch(orderApi.slice(orderApi.indexOf('analyticsPurchase:'), orderApi.indexOf('analyticsPurchase:') + 1200), /customer_name|phone|email|address/)
})
