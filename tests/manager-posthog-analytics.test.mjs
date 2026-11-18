import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPostHogAnalytics, buildPostHogQueries, rowsFromPostHogResponse } from '../functions/api/manager/posthog-analytics-lib.ts'

test('PostHog queries use only the confirmed Florial event names and a bounded period', () => {
  const queries = buildPostHogQueries(30)
  assert.match(queries.events, /INTERVAL 30 DAY/)
  assert.match(queries.events, /florial_page_view/)
  assert.match(queries.events, /florial_category_view/)
  assert.match(queries.events, /florial_product_view/)
  assert.match(queries.events, /florial_cart_view/)
  assert.match(queries.events, /florial_add_to_cart/)
  assert.doesNotMatch(queries.events, /florial_phone_click|florial_chat_click|florial_checkout_start/)
})

test('PostHog response parser accepts result rows and ignores malformed envelopes', () => {
  assert.deepEqual(rowsFromPostHogResponse({ results: [['florial_page_view', 12], ['florial_add_to_cart', 2]] }), [['florial_page_view', 12], ['florial_add_to_cart', 2]])
  assert.deepEqual(rowsFromPostHogResponse({ data: [] }), [])
  assert.deepEqual(rowsFromPostHogResponse(null), [])
})

test('PostHog summary normalizes counts and excludes invalid page, language and country values', () => {
  const report = buildPostHogAnalytics(7, {
    events: [['florial_page_view', '21'], ['florial_category_view', 7], ['florial_product_view', 4], ['florial_cart_view', 2], ['florial_add_to_cart', 3], ['unexpected_event', 900]],
    pages: [['/category/rastenia', 9], ['javascript:alert(1)', 99]],
    languages: [['bg', 12], ['ru', 7], ['xx', 500]],
    countries: [['bg', 18], ['BE', 2], ['unknown', 100]],
    daily: [['2026-11-17', 10], ['bad-date', 20]],
  }, '2026-11-18T12:00:00.000Z')

  assert.deepEqual(report.totals, { page_views: 21, category_views: 7, product_views: 4, cart_views: 2, add_to_cart: 3, total_events: 37 })
  assert.deepEqual(report.top_pages, [{ page_path: '/category/rastenia', page_views: 9 }])
  assert.deepEqual(report.by_language, [{ language: 'bg', event_count: 12 }, { language: 'ru', event_count: 7 }])
  assert.deepEqual(report.by_country, [{ country_code: 'BG', event_count: 18 }, { country_code: 'BE', event_count: 2 }])
  assert.deepEqual(report.daily, [{ event_day: '2026-11-17', page_views: 10 }])
  assert.equal(report.period_days, 7)
})
