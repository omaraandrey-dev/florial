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
  assert.equal(result.snapshot.pipeNetwork.mainDiameterMm, 25)
  assert.equal(result.snapshot.pipeNetwork.zoneDiameterMm, 25)
})

test('preserves validated rectangular non-irrigated areas in the persisted project geometry', () => {
  const project = snapshot()
  project.geometry.normalized.regions[0].exclusions = [{
    id: 'pool',
    kind: 'pool',
    polygon: { vertices: [
      { x: 8, y: 1 }, { x: 12, y: 1 }, { x: 12, y: 4 }, { x: 8, y: 4 }, { x: 8, y: 1 },
    ] },
  }]
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
  assert.equal(result.valid, true)
  assert.deepEqual(result.snapshot.geometry.normalized.regions[0].exclusions[0].polygon.vertices, project.geometry.normalized.regions[0].exclusions[0].polygon.vertices.slice(0, 4))
  assert.equal(result.snapshot.geometry.normalized.regions[0].exclusions[0].kind, 'pool')
})

test('persists edge exclusions at X=0 or Y=0 but rejects the (0,0) origin', () => {
  for (const [x, y] of [[0, 1], [1, 0]]) {
    const project = snapshot()
    project.geometry.normalized.regions[0].exclusions = [{
      id: 'edge-area',
      kind: 'patio',
      polygon: { vertices: [
        { x, y }, { x: x + 4, y }, { x: x + 4, y: y + 2 }, { x, y: y + 2 }, { x, y },
      ] },
    }]
    const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
    assert.equal(result.valid, true)
    assert.equal(result.snapshot.geometry.normalized.regions[0].exclusions[0].kind, 'patio')
  }

  const origin = snapshot()
  origin.geometry.normalized.regions[0].exclusions = [{
    id: 'origin-area',
    kind: 'pool',
    polygon: { vertices: [
      { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 0 },
    ] },
  }]
  const rejected = validateIrrigationProjectSnapshot({ ...origin, orderItems })
  assert.equal(rejected.valid, false)
  assert.equal(rejected.reason, 'invalid_project_geometry')
})

test('rejects malformed or out-of-bound non-irrigated rectangles', () => {
  const project = snapshot()
  project.geometry.normalized.regions[0].exclusions = [{
    id: 'outside',
    polygon: { vertices: [
      { x: 22, y: 1 }, { x: 27, y: 1 }, { x: 27, y: 4 }, { x: 22, y: 4 }, { x: 22, y: 1 },
    ] },
  }]
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'invalid_project_geometry')
})

test('rejects project snapshots when the BOM does not match submitted order quantities', () => {
  const result = validateIrrigationProjectSnapshot({
    ...snapshot(),
    orderItems: [{ sku: 'A44120', qty: 6 }, { sku: 'A84666', qty: 1 }],
  })
  assert.equal(result.valid, false)
  assert.equal(result.reason, 'project_bom_does_not_match_order')
})

test('normalizes submitted pipe diameters to the fixed PE Ø25 mm standard', () => {
  const project = snapshot()
  project.pipeNetwork.mainDiameterMm = 32
  project.pipeNetwork.zoneDiameterMm = 32
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.pipeNetwork.mainDiameterMm, 25)
  assert.equal(result.snapshot.pipeNetwork.zoneDiameterMm, 25)
})

test('persists manual automation without valves or valve boxes', () => {
  const project = snapshot()
  project.automation = { type: 'manual', controllers: [], valve: null, requiresControlCable: false, wifiRequired: false }
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.automation.type, 'manual')
  assert.equal(result.snapshot.automation.controllers.length, 0)
})

test('rejects manual automation when valve adapters or manifold tee remain in order lines', () => {
  const project = snapshot()
  project.automation = { type: 'manual', controllers: [], valve: null, requiresControlCable: false, wifiRequired: false }
  const result = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [...orderItems, { sku: 'IQ21120M0N25D', qty: 4 }],
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
    { sku: 'F54234', quantity: 1, name: 'Rain Bird ESP-TM2 4 zones indoor' },
  )
  project.automation = {
    type: 'tm2',
    controllers: [{ sku: 'F54234', capacity: 4, quantity: 1, zoneNumbers: [1, 2], name: 'Rain Bird ESP-TM2 4 zones indoor' }],
    valve: { sku: 'H01000', quantity: 2 },
    requiresControlCable: true,
    wifiRequired: false,
  }
  const items = [
    ...orderItems,
    { sku: 'H01000', qty: 2, name: 'Rain Bird 100-HV', price: 58.89 },
    { sku: 'F54234', qty: 1, name: 'Rain Bird ESP-TM2 4 zones indoor', price: 249.08 },
  ]
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems: items })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.automation.requiresControlCable, true)
  assert.equal(result.snapshot.automation.wifiRequired, false)
  assert.equal(result.snapshot.automation.valve.sku, 'H01000')
  assert.equal(result.snapshot.automation.valve.quantity, 2)
  assert.equal(result.snapshot.automation.totalPriceEUR, 366.86)
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
  assert.match(pdf, /buildLawnDimensionAnnotations\(vertices, exclusions\)/)
  assert.match(pdf, /Неполиваеми правоъгълници/)
  assert.match(pdf, /annotation\.lengthM\.toFixed\(1\)/)
  assert.match(pdf, /exclusionVertices\.map\(mapPoint\)/)
  assert.match(pdf, /color: rgb\(0\.86, 0\.89, 0\.93\)/)
  assert.match(pdf, /планировъчен R=/)
  assert.match(pdf, /геометрична планировъчна стойност на Florial/)
  const assistantPage = await readFile(new URL('../src/pages/IrrigationAssistantPage.tsx', import.meta.url), 'utf8')
  assert.match(assistantPage, /геометрични проектни стойности на Florial/)
  assert.match(assistantPage, /manufacturer-validated performance/)
  assert.match(pdf, /drawRoute\(branch\.points/)
  assert.match(pdf, /item\.name \+ ' · ' \+ item\.sku/)
  assert.match(pdf, /PE Ø25 mm/)
  assert.match(pdf, /Хидравлични изчисления не се извършват/)
  assert.match(pdf, /installationGuideUrl/)
  assert.match(pdf, /PDFDocument\.load/)
  assert.match(pdf, /getPageCount\(\) !== 3/)
  assert.match(pdf, /pdf\.copyPages/)
})

test('accepts an R-VAN-RCS strip-only project without a circular head-to-head claim', () => {
  const project = snapshot()
  project.layout.headToHeadPassed = null
  project.layout.headToHeadApplicable = false
  project.layout.sprinklers = [{
    id: 'strip-1',
    position: { x: 25, y: 0 },
    radiusM: null,
    arcDeg: null,
    performanceModel: 'R-VAN-RCS',
    pattern: 'strip',
    stripWidthM: 2,
    stripLengthM: 4,
    source: 'perimeter',
  }]
  project.zones = [{ id: 'zone-01', zoneNumber: 1, zoneType: 'perimeter', sprinklerIds: ['strip-1'] }]
  project.billOfMaterials.headCount = 1
  project.billOfMaterials.zoneCount = 1
  project.billOfMaterials.items = [
    { sku: 'A44120', quantity: 1, name: 'Rain Bird 1804' },
    { sku: 'A84668', quantity: 1, name: 'Rain Bird R-VAN-RCS' },
  ]
  const result = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [{ sku: 'A44120', qty: 1 }, { sku: 'A84668', qty: 1 }],
  })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.layout.headToHeadPassed, null)
  assert.equal(result.snapshot.layout.headToHeadApplicable, false)
  assert.equal(result.snapshot.layout.sprinklers[0].pattern, 'strip')
  assert.equal(result.snapshot.layout.sprinklers[0].arcDeg, null)
  assert.equal(result.snapshot.layout.sprinklers[0].stripWidthM, 2)
  assert.equal(result.snapshot.layout.sprinklers[0].stripLengthM, 4)
})

test('persists all directional LCS, RCS and SST strip nozzle metadata', () => {
  const project = snapshot()
  project.layout.headToHeadPassed = null
  project.layout.headToHeadApplicable = false
  project.layout.sprinklers = [
    { id: 'rcs', position: { x: 10, y: 2 }, radiusM: null, arcDeg: null, performanceModel: 'R-VAN-RCS', pattern: 'strip', stripWidthM: 2, stripLengthM: 4, stripDirection: 'left', stripAxis: 'horizontal', source: 'perimeter' },
    { id: 'sst', position: { x: 6, y: 2 }, radiusM: null, arcDeg: null, performanceModel: 'R-VAN-SST', pattern: 'strip', stripWidthM: 2, stripLengthM: 4, stripDirection: 'both', stripAxis: 'horizontal', source: 'perimeter' },
    { id: 'lcs', position: { x: 0, y: 2 }, radiusM: null, arcDeg: null, performanceModel: 'R-VAN-LCS', pattern: 'strip', stripWidthM: 2, stripLengthM: 4, stripDirection: 'right', stripAxis: 'horizontal', source: 'perimeter' },
  ]
  project.zones = [{ id: 'zone-01', zoneNumber: 1, zoneType: 'perimeter', sprinklerIds: ['rcs', 'sst', 'lcs'] }]
  project.billOfMaterials.headCount = 3
  project.billOfMaterials.zoneCount = 1
  project.billOfMaterials.items = [
    { sku: 'A84668', quantity: 1, name: 'R-VAN-RCS' },
    { sku: 'A84669', quantity: 1, name: 'R-VAN-SST' },
    { sku: 'A84667', quantity: 1, name: 'R-VAN-LCS' },
  ]
  const orderItems = [
    { sku: 'A84668', qty: 1 },
    { sku: 'A84669', qty: 1 },
    { sku: 'A84667', qty: 1 },
  ]
  const result = validateIrrigationProjectSnapshot({ ...project, orderItems })
  assert.equal(result.valid, true)
  assert.deepEqual(result.snapshot.layout.sprinklers.map((head) => [
    head.performanceModel, head.stripDirection, head.stripAxis,
  ]), [
    ['R-VAN-RCS', 'left', 'horizontal'],
    ['R-VAN-SST', 'both', 'horizontal'],
    ['R-VAN-LCS', 'right', 'horizontal'],
  ])
})

test('accepts a single 3504-PC rotor without inventing a head-to-head neighbour', () => {
  const project = snapshot()
  project.operatingScenario = { manufacturer: 'Rain Bird', family: '3500', model: '3504-PC', pressureBar: null }
  project.layout = {
    model: '3504-PC',
    engineVersion: '3504-test',
    algorithm: 'owner-approved-3504pc-radius-first',
    headToHeadPassed: null,
    headToHeadApplicable: false,
    sprinklers: [{
      id: 'rotor-3504-1',
      position: { x: 12.5, y: 2.5 },
      radiusM: 8,
      arcDeg: 360,
      performanceModel: '3504-PC',
      source: 'interior',
    }],
  }
  project.zones = [{ id: 'zone-01', zoneNumber: 1, zoneType: 'interior', sprinklerIds: ['rotor-3504-1'] }]
  project.billOfMaterials = {
    headCount: 1,
    zoneCount: 1,
    flexPipeRequiredM: 0.5,
    flexPipeCoils30m: 1,
    items: [
      { sku: 'Y34001', quantity: 1, name: 'Rain Bird 3504-PC' },
      { sku: 'A46010', quantity: 2, name: 'SBE-050' },
    ],
  }
  const result = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [{ sku: 'Y34001', qty: 1 }, { sku: 'A46010', qty: 2 }],
  })
  assert.equal(result.valid, true)
  assert.equal(result.snapshot.layout.sprinklers[0].performanceModel, '3504-PC')
  assert.equal(result.snapshot.layout.headToHeadApplicable, false)

  project.layout.sprinklers[0].radiusM = 10
  const rejected = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [{ sku: 'Y34001', qty: 1 }, { sku: 'A46010', qty: 2 }],
  })
  assert.equal(rejected.valid, false)
  assert.equal(rejected.reason, 'invalid_project_sprinkler')
})

test('persists the explicit rotor pattern and corner-first layout identity for 3504-PC', () => {
  const project = snapshot()
  const positions = [
    { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 8 }, { x: 0, y: 8 },
  ]
  project.operatingScenario = {
    manufacturer: 'Rain Bird', family: '3500', model: '3504-PC', pressureBar: null,
  }
  project.layout = {
    model: '3504-PC',
    engineVersion: '2.0.0',
    algorithm: 'corner-first-shared-cell-grid',
    headToHeadPassed: true,
    headToHeadApplicable: true,
    sprinklers: positions.map((position, index) => ({
      id: 'rotor-' + index,
      position,
      radiusM: 8,
      arcDeg: 90,
      directionDeg: [45, 135, 225, 315][index],
      performanceModel: '3504-PC',
      pattern: 'rotor',
      source: 'vertex',
    })),
  }
  project.zones = [{
    id: 'zone-01',
    zoneNumber: 1,
    zoneType: 'perimeter',
    sprinklerIds: ['rotor-0', 'rotor-1', 'rotor-2', 'rotor-3'],
  }]
  project.billOfMaterials = {
    headCount: 4,
    zoneCount: 1,
    flexPipeRequiredM: 2,
    flexPipeCoils30m: 1,
    items: [
      { sku: 'Y34001', quantity: 4, name: 'Rain Bird 3504-PC' },
      { sku: 'A46010', quantity: 8, name: 'SBE-050' },
    ],
  }
  const result = validateIrrigationProjectSnapshot({
    ...project,
    orderItems: [{ sku: 'Y34001', qty: 4 }, { sku: 'A46010', qty: 8 }],
  })
  assert.equal(result.valid, true)
  assert.ok(result.snapshot.layout.sprinklers.every((head) => head.pattern === 'rotor'))
  assert.equal(result.snapshot.layout.algorithm, 'corner-first-shared-cell-grid')
})

