import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [tracking, consent, privacy] = await Promise.all([
  readFile(new URL('../src/services/trackingService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/AnalyticsConsent.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/PrivacyPolicyPage.tsx', import.meta.url), 'utf8'),
])

test('baseline Cloudflare D1 tracking is independent of the optional PostHog choice', () => {
  const trackEvent = tracking.slice(tracking.indexOf('export function trackEvent('))
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
