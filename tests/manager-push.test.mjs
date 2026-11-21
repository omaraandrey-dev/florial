import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const subscriptions = read('functions/api/manager/push/subscriptions.ts')
const dispatch = read('functions/api/manager/push-dispatch.ts')
const orders = read('functions/api/orders.ts')
const leads = read('functions/api/service-leads.ts')
const worker = read('public/manager/sw.js')
const managerApp = read('src/manager/ManagerApp.tsx')
const migration = read('docs/migrations/0017_manager_push_subscriptions.sql')

test('push subscriptions are authenticated, same-origin and bound to the session user', () => {
  assert.match(subscriptions, /requireUser\(request, env\)/)
  assert.match(subscriptions, /checkSameOrigin\(request\)/)
  assert.match(subscriptions, /auth\.user\.user_id/)
  assert.match(subscriptions, /WHERE endpoint=\? AND user_id=\?/)
  assert.match(subscriptions, /existing\.user_id !== auth\.user\.user_id/)
  assert.match(subscriptions, /endpointUrl\.protocol !== 'https:'/)
  assert.match(subscriptions, /trustedPushHost/)
})

test('push recipients are active staff with role-specific access', () => {
  assert.match(dispatch, /p\.is_active=1 AND p\.role IN \('owner','manager','seller'\)/)
  assert.match(dispatch, /p\.is_active=1 AND p\.role='owner'/)
  assert.match(dispatch, /SELECT is_test FROM orders/)
  assert.match(dispatch, /order\.is_test === 1/)
  assert.match(dispatch, /kind === 'order'/)
  assert.match(dispatch, /type PushKind = 'order' \| 'service-lead'/)
})

test('push dispatch is best-effort and removes expired provider subscriptions', () => {
  assert.match(dispatch, /Promise\.allSettled/)
  assert.match(dispatch, /response\.status === 404 \|\| response\.status === 410/)
  assert.match(dispatch, /DELETE FROM manager_push_subscriptions/)
  assert.match(dispatch, /Push is best-effort/)
  assert.match(dispatch, /redirect: 'error'/)
  assert.match(dispatch, /AbortSignal\.timeout\(5000\)/)
  assert.doesNotMatch(dispatch, /customer_name|customer_phone|customer_email/)
})

test('checkout and service lead dispatch only after successful D1 insert', () => {
  assert.ok(orders.indexOf('await dispatchManagerPush(env, \'order\', orderNumber)') > orders.indexOf('D1 order insert failed'))
  assert.ok(leads.indexOf('await dispatchManagerPush(env, \'service-lead\', leadNumber)') > leads.indexOf('INSERT INTO service_leads'))
  assert.match(leads, /return json\(\{ leadNumber: existing\.lead_number, duplicate: true/)
})

test('Manager push UI requires explicit action and supports unsubscribe', () => {
  assert.match(managerApp, /Notification\.requestPermission\(\)/)
  assert.match(managerApp, /pushManager\.subscribe\(/)
  assert.match(managerApp, /method: 'DELETE'/)
  assert.match(managerApp, /Включи известия/)
})

test('service worker displays push notifications and routes clicks into Manager', () => {
  assert.match(worker, /addEventListener\('push'/)
  assert.match(worker, /showNotification/)
  assert.match(worker, /addEventListener\('notificationclick'/)
  assert.match(worker, /openWindow\(target\)/)
  assert.match(worker, /clientUrl\.pathname\.startsWith\('\/manager\/'\)/)
  assert.match(worker, /event\.respondWith\(fetch\(request\)\)/)
  assert.doesNotMatch(worker, /caches\.|CacheStorage|cache\.put|cache\.add|cache\.match/i)
})

test('push migration is additive and indexed by staff account', () => {
  assert.match(migration, /CREATE TABLE manager_push_subscriptions/)
  assert.match(migration, /REFERENCES catalog_staff_profiles\(user_id\) ON DELETE CASCADE/)
  assert.match(migration, /UNIQUE/)
  assert.match(migration, /idx_manager_push_subscriptions_user/)
  assert.match(migration, /0017_manager_push_subscriptions/)
})

test('test push endpoint is Owner-only and queries only the authenticated Owner subscriptions', () => {
  const endpoint = read('functions/api/manager/push/test.ts')
  assert.match(endpoint, /requireUser\(request, env, \['owner'\]\)/)
  assert.match(endpoint, /WHERE s\.user_id=\? AND p\.user_id=\? AND p\.role='owner' AND p\.is_active=1/)
  assert.match(endpoint, /sendManagerPushToSubscriptions\(env, subscriptions\.results, payload\)/)
  assert.match(endpoint, /title: 'Тестово известие'/)
  assert.match(endpoint, /url: '\/manager\/'/)
  assert.doesNotMatch(endpoint, /orders|service_leads|customer_|phone|email/)
  assert.match(dispatch, /export const sendManagerPushToSubscriptions/)
  assert.match(managerApp, /profile\.role === 'owner' && <button/)
  assert.match(managerApp, /onClick=\{\(\) => void sendTestPush\(\)\}/)
  assert.match(managerApp, /fetch\('\/api\/manager\/push\/test'/)
})


test('Manager order list and navigation count refresh every 20 seconds without overlapping loads', () => {
  const ordersManager = read('src/manager/OrdersManager.tsx')
  assert.match(ordersManager, /window\.setInterval\(refresh,20000\)/)
  assert.match(ordersManager, /Date\.now\(\)-lastRefreshAt\.current>=20000/)
  assert.match(ordersManager, /loadInFlight=useRef\(0\)/)
  assert.match(ordersManager, /loadInFlight\.current===0/)
  assert.match(ordersManager, /loadInFlight\.current=Math\.max\(0,loadInFlight\.current-1\)/)
  assert.doesNotMatch(ordersManager, /900000/)
})

test('Manager service lead list refreshes every 20 seconds and on app focus/visibility return', () => {
  const serviceLeadsManager = read('src/manager/ServiceLeadsManager.tsx')
  assert.match(serviceLeadsManager, /window\.setInterval\(refresh, 20_000\)/)
  assert.match(serviceLeadsManager, /addEventListener\('focus', refresh\)/)
  assert.match(serviceLeadsManager, /addEventListener\('visibilitychange', refresh\)/)
  assert.match(serviceLeadsManager, /loadInFlight = useRef\(0\)/)
  assert.match(serviceLeadsManager, /loadInFlight\.current === 0/)
  assert.match(serviceLeadsManager, /loadInFlight\.current = Math\.max\(0, loadInFlight\.current - 1\)/)
})
