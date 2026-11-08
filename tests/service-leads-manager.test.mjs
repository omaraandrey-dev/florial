import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('service lead manager migration is additive and defaults new rights off', async () => {
  const sql = await read('../functions/migrations/0012_service_leads_manager.sql')
  assert.match(sql, /ADD COLUMN assigned_to TEXT REFERENCES catalog_staff_profiles\(user_id\)/)
  assert.match(sql, /'\$\.canViewServiceLeads', json\(CASE/)
  assert.match(sql, /'\$\.canManageServiceLeads', json\(CASE/)
  assert.match(sql, /canManageServiceLeads.*canViewServiceLeads/s)
  assert.doesNotMatch(sql, /\bDROP TABLE\b|\bDELETE FROM\b|\bTRUNCATE\b/i)
  assert.match(sql, /0012_service_leads_manager/)
})

test('service lead Manager API enforces separate view and mutation permissions', async () => {
  const api = await read('../functions/api/manager/service-leads.ts')
  assert.match(api, /hasPermission\(user, 'canViewServiceLeads'\)/)
  assert.match(api, /hasPermission\(user, 'canManageServiceLeads'\)/)
  assert.match(api, /writeOriginAllowed\(request\)/)
  assert.match(api, /Request body is too large/)
  assert.match(api, /internal_comment/)
  assert.match(api, /service_lead_events/)
  assert.match(api, /TRANSITIONS/)
})

test('service lead Manager UI has filters, audit and no customer file upload', async () => {
  const ui = await read('../src/manager/ServiceLeadsManager.tsx')
  assert.match(ui, /Търсене и филтри/)
  assert.match(ui, /История на заявката/)
  assert.match(ui, /Вътрешен коментар/)
  assert.match(ui, /Отговорник/)
  assert.doesNotMatch(ui, /type="file"/)
})

test('seller role cannot retain manager-only permissions after role change', async () => {
  const staff = await read('../functions/api/manager/staff.ts')
  const permissions = await read('../functions/api/manager/_lib.ts')

  assert.ok(staff.includes("if(role==='seller'&&("))
  assert.ok(staff.includes('canManageCategorySeo:false,canViewServiceLeads:false,canManageServiceLeads:false'))
  assert.ok(staff.includes('parsed.canDeleteTestOrders||parsed.canManageCategorySeo||parsed.canViewServiceLeads||parsed.canManageServiceLeads'))
  assert.ok(permissions.includes("'canManageCategorySeo','canViewServiceLeads','canManageServiceLeads'"))
  const cart = await read('../src/pages/CartPage.tsx')
  const orders = await read('../functions/api/orders.ts')

  assert.match(cart, /'Каблешково':\s*10/)
  assert.match(orders, /'Каблешково':\s*10/)
})
