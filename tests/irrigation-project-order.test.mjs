import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { validateIrrigationProjectSnapshot } from '../functions/api/_lib/irrigation-project.mjs'

const snapshot = () => ({
  schemaVersion: 1,
  projectType: 'automatic_lawn_irrigation',
  createdAt: '2026-11-22T10:00:00.000Z',
  language: 'ru',
  geometry: {
    shape: 'rectangle',
    dimensionsM: { length: 25, width: 5 },
    normalized: { regions: [{ boundary: { vertices: [
      { x: 0, y: 0 }, { x: 25, y: 0 }, { x: 25, y: 5 }, { x: 0, y: 5 },
    ] } }] },
    areaM2: 125,
    perimeterM: 60,
    dimensionsAreApproximate: true,
  },
  operatingScenario: { manufacturer: 'Rain Bird', family: 'R-VAN', model: 'R-VAN24', pressureBar: 3.1 },
  layout: {
    model: 'R-VAN24',
    engineVersion: 'test',
    algorithm: 'perimeter-first-multi-row-greedy-set-cover-v3',
    headToHeadPassed: true,
    sprinklers: Array.from({ length: 7 }, (_, index) => ({
      id: 'head-' + index,
      position: { x: index * 2, y: 5 },
      radiusM: 7,
      arcDeg: index === 6 ? 360 : index % 2 ? 180 : 90,
      performanceModel: index === 6 ? 'R-VAN24-360' : 'R-VAN24',
      source: index === 6 ? 'interior' : 'perimeter',
    })),
  },
  zones: [
    { id: 'zone-01', zoneNumber: 1, zoneType: 'perimeter', sprinklerIds: ['head-0','head-1','head-2','head-3'] },
    { id: 'zone-02', zoneNumber: 2, zoneType: 'mixed', sprinklerIds: ['head-4','head-5','head-6'] },
  ],
  pipeNetwork: {
    mainDiameterMm: 25,
    zoneDiameterMm: 25,
    mainRoute: [{ x: 25, y: 5 }, { x: 0, y: 5 }],
    branches: [{ zoneId: 'zone-02', branchDirection: 'forward', sprinklerIds: ['head-4','head-5','head-6'], points: [{ x: 1, y: 2 }] }],
  },
  billOfMaterials: {
    headCount: 7,
    zoneCount: 2,
    flexPipeRequiredM: 7,
    flexPipeCoils30m: 1,
    items: [{ sku: 'A44120', quantity: 7, name: 'Rain Bird 1804' }, { sku: 'A84666', quantity: 1, name: 'R-VAN24 360°' }],
  },
  warnings: [{ code: 'hydraulic_calculation_not_performed', path: 'hydraulics' }],
})

const orderItems = [
  { sku: 'A44120', qty: 7 },
  { sku: 'A84666', qty: 1 },
]

test('accepts a balanced mixed-arc project and sanitizes the persisted snapshot', () => {
  const result = validateIrrigationProjectSnapshot({ ...snapshot(), orderItems })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.zones[1].zoneType, 'mixed')
  assert.equal(result.snapshot.layout.sprinklers[6].arcDeg, 360)
  assert.equal(result.snapshot.billOfMaterials.items.length, 2)
})

test('rejects project snapshots when the BOM does not match submitted order quantities', () => {
  const result = validateIrrigationProjectSnapshot({
    ...snapshot(),
    orderItems: [{ sku: 'A44120', qty: 6 }, { sku: 'A84666', qty: 1 }],
  })
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'project_bom_does_not_match_order')
})

test('persists manual automation without valves or valve boxes', () => {
  const project = snapshot()
  project.automation = { type: 'manual', controllers: [], valve: null, requiresControlCable: false, wifiRequired: false }
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.automation.type, 'manual')
  assert.equal(result.snapshot.automation.controllers.length, 0)
})

test('rejects manual automation when a valve box remains in order lines', () => {
  const project = snapshot()
  project.automation = { type: 'manual', controllers: [], valve: null, requiresControlCable: false, wifiRequired: false }
  const result = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [...orderItems, { sku: 'VBA02672', qty: 2 }],
  })
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'manual_automation_contains_valves_or_controllers')
})

test('persists BAT controller allocation and the 100-HV-9V valve with server-resolved prices', () => {
  const project = snapshot()
  project.billOfMaterials.items.push(
    { sku: 'ESP-BAT-BT2', quantity: 1, name: 'ESP-BAT-BT, 2 zones' },
    { sku: 'H01040', quantity: 2, name: 'Rain Bird 100-HV-9V' },
  )
  project.automation = {
    type: 'bat',
    controllers: [{ sku: 'ESP-BAT-BT2', capacity: 2, quantity: 1, zoneNumbers: [1, 2], name: 'ESP-BAT-BT, 2 zones' }],
    valve: { sku: 'H01040', quantity: 2, name: 'Rain Bird 100-HV-9V' },
    requiresControlCable: false,
    wifiRequired: false,
  }
  const items = [
    ...orderItems,
    { sku: 'ESP-BAT-BT2', qty: 1, name: 'ESP-BAT-BT, 2 zones', price: 200.59 },
    { sku: 'H01040', qty: 2, name: 'Rain Bird 100-HV-9V', price: 58.89 },
  ]
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems: items })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.automation.valve.sku, 'H01040')
  assert.equal(result.snapshot.automation.valve.priceEUR, 58.89)
  assert.equal(result.snapshot.automation.totalPriceEUR, 318.37)
  assert.equal(result.snapshot.billOfMaterials.items.find((item) => item.sku === 'H01040').priceEUR, 58.89)
})

test('rejects BAT projects that retain standard valves or add the wrong 9V valve', () => {
  const project = snapshot()
  project.billOfMaterials.items.push(
    { sku: 'H01000', quantity: 2, name: '100-HV' },
    { sku: 'ESP-BAT-BT2', quantity: 1, name: 'ESP-BAT-BT, 2 zones' },
  )
  project.automation = {
    type: 'bat',
    controllers: [{ sku: 'ESP-BAT-BT2', capacity: 2, quantity: 1, zoneNumbers: [1, 2] }],
    valve: { sku: 'H01040', quantity: 2 },
    requiresControlCable: false,
    wifiRequired: false,
  }
  const result = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [...orderItems, { sku: 'H01000', qty: 2 }, { sku: 'ESP-BAT-BT2', qty: 1 }, { sku: 'H01040', qty: 2 }],
  })
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'invalid_bat_valve_compatibility')
})

test('persists wired TM2 selection with explicit cable requirement and server price', () => {
  const project = snapshot()
  project.billOfMaterials.items.push(
    { sku: 'H01000', quantity: 2, name: 'Rain Bird 100-HV' },
    { sku: 'F54224', quantity: 1, name: 'Rain Bird ESP-TM2 4 zones' },
  )
  project.automation = {
    type: 'tm2',
    controllers: [{ sku: 'F54224', capacity: 4, quantity: 1, zoneNumbers: [1, 2], name: 'Rain Bird ESP-TM2 4 zones' }],
    valve: null,
    requiresControlCable: true,
    wifiRequired: false,
  }
  const items = [
    ...orderItems,
    { sku: 'H01000', qty: 2, name: 'Rain Bird 100-HV', price: 58.89 },
    { sku: 'F54224', qty: 1, name: 'Rain Bird ESP-TM2 4 zones', price: 249.08 },
  ]
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems: items })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.automation.requiresControlCable, true)
  assert.equal(result.snapshot.automation.wifiRequired, false)
  assert.equal(result.snapshot.automation.totalPriceEUR, 249.08)
})

test('rejects unbalanced zone partitions and zones above six heads', () => {
  const unbalanced = snapshot()
  unbalanced.zones[0].sprinklerIds = ['head-0','head-1','head-2','head-3','head-4']
  unbalanced.zones[1].sprinklerIds = ['head-5','head-6']
  assert.equal(validateIrrigationProjectSnapshot({ ...unbalanced, orderItems }).reason, 'unbalanced_project_zones')

  const oversized = snapshot()
  oversized.zones[0].sprinklerIds = ['head-0','head-1','head-2','head-3','head-4','head-5','head-6']
  oversized.zones[1].sprinklerIds = ['head-6']
  assert.equal(validateIrrigationProjectSnapshot({ ...oversized, orderItems }).valid, false)
})

test('order endpoint sends both PDFs to the owner and gates the project to customer approval', async () => {
  const api = await readFile(new URL('../functions/api/orders.ts', import.meta.url), 'utf8')
  assert.match(api, /validateIrrigationProjectSnapshot/)
  assert.match(api, /irrigation_project_attached/)
  assert.match(api, /INSERT INTO order_events/)
  assert.match(api, /createIrrigationProjectPdf/)
  assert.ok(api.includes('-irrigation-project.pdf'))
  assert.ok(api.includes('const sellerEmailValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(sellerEmail)'))
  assert.match(api, /const ownerAttachments = \[\.\.\.pdfAttachment, \.\.\.ownerProjectAttachment\]/)
  assert.match(api, /ownerProjectMailNote/)
  assert.match(api, /ownerProjectAttachment/)
  assert.match(api, /updateIrrigationProjectDelivery\('sent'\)/)
  assert.match(api, /customerMailTask = sendOrderEmail/)
  const managerDocs = await readFile(new URL('../functions/api/manager/order-documents.ts', import.meta.url), 'utf8')
  assert.match(managerDocs, /event_type='irrigation_project_attached'/)
  assert.match(managerDocs, /createIrrigationProjectPdf/)
  assert.ok(managerDocs.includes('-irrigation-project.pdf'))
  assert.match(managerDocs, /approve_irrigation_project/)
  const managerOrders = await readFile(new URL('../functions/api/manager/orders.ts', import.meta.url), 'utf8')
  assert.match(managerOrders, /irrigation_project_approved/)
  const managerUi = await readFile(new URL('../src/manager/OrdersManager.tsx', import.meta.url), 'utf8')
  assert.match(managerUi, /Одобри инженерния проект и изпрати двата PDF на клиента/)
  const projectPdf = await readFile(new URL('../functions/api/_lib/irrigation-project-pdf.ts', import.meta.url), 'utf8')
  assert.match(projectPdf, /Въведени от клиента/)
  assert.match(api, /deliveryStatus/)
  const assistant = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(assistant, /name: catalogProducts\[item\.sku\]\?\.name \|\| item\.sku/)
  assert.match(assistant, /lateralConnections: branch\.lateralConnections/)
})

test('irrigation project PDF contains the drawing, zone assignment, BOM and explicit engineering limits', async () => {
  const pdf = await readFile(new URL('../functions/api/_lib/irrigation-project-pdf.ts', import.meta.url), 'utf8')
  assert.match(pdf, /ПРЕДВАРИТЕЛЕН ПРОЕКТ ЗА АВТОМАТИЧНО ПОЛИВАНЕ/)
  assert.match(pdf, /Схематични трасета на тръбите/)
  assert.match(pdf, /Автоматика и управление/)
  assert.match(pdf, /Ведомост на материалите/)
  assert.match(pdf, /Въведени от клиента/)
  assert.match(pdf, /drawRoute\(branch\.points/)
  assert.match(pdf, /item\.name \+ ' · ' \+ item\.sku/)
  assert.match(pdf, /Не са изчислявани дебит, динамично налягане/)
  assert.match(pdf, /Не е потвърдена хидравличната възможност/)
})
