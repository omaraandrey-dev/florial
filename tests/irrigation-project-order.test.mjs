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
    items: [{ sku: 'A44120', quantity: 7 }, { sku: 'A84666', quantity: 1 }],
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

test('order endpoint persists a valid project and emails a separate PDF only to the owner', async () => {
  const api = await readFile(new URL('../functions/api/orders.ts', import.meta.url), 'utf8')
  assert.match(api, /validateIrrigationProjectSnapshot/)
  assert.match(api, /irrigation_project_attached/)
  assert.match(api, /INSERT INTO order_events/)
  assert.match(api, /createIrrigationProjectPdf/)
  assert.match(api, /florial-irrigation-project-/)
  assert.match(api, /Предварителен проект за поливане към поръчка/)
  assert.match(api, /updateIrrigationProjectDelivery\('sent'\)/)
  assert.match(api, /deliveryStatus/)
})

test('irrigation project PDF contains the drawing, zone assignment, BOM and explicit engineering limits', async () => {
  const pdf = await readFile(new URL('../functions/api/_lib/irrigation-project-pdf.ts', import.meta.url), 'utf8')
  assert.match(pdf, /ПРЕДВАРИТЕЛЕН ПРОЕКТ ЗА АВТОМАТИЧНО ПОЛИВАНЕ/)
  assert.match(pdf, /Схематични трасета на тръбите/)
  assert.match(pdf, /Ведомост на материалите/)
  assert.match(pdf, /Не са изчислявани дебит, динамично налягане/)
  assert.match(pdf, /Не е потвърдена хидравличната възможност/)
})
